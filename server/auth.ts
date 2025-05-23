import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { ZohoCredentials as ZohoCredentialsType } from "@/components/connect-modal";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

  // Session setup
  const sessionSettings: session.SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local authentication strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Google authentication strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: CALLBACK_URL,
          scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByGoogleId(profile.id);
            
            if (!user) {
              // Create a new user
              const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
              const displayName = profile.displayName || '';
              const photoUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
              
              // Generate a random username if email is available, otherwise use profile ID
              const baseUsername = email ? email.split('@')[0] : `user${profile.id}`;
              let username = baseUsername;
              let counter = 1;
              
              // Keep trying to find a unique username
              while (await storage.getUserByUsername(username)) {
                username = `${baseUsername}${counter}`;
                counter++;
              }
              
              user = await storage.createUser({
                username,
                password: await hashPassword(randomBytes(16).toString('hex')), // Random password
                displayName,
                email,
                profilePicture: photoUrl,
                googleId: profile.id,
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // User serialization/deserialization
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, displayName, email } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Username and password are required" 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "Username already exists" 
        });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        displayName: displayName || null,
        email: email || null,
      });

      // Login the new user
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          success: true, 
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            profilePicture: user.profilePicture
          }
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Registration failed" 
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: info?.message || "Invalid username or password" 
        });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json({ 
          success: true, 
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            profilePicture: user.profilePicture
          }
        });
      });
    })(req, res, next);
  });

  // Google OAuth routes
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", passport.authenticate("google"));

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { 
        failureRedirect: "/auth",
        successRedirect: "/"
      })
    );
  }

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ success: true });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated" 
      });
    }
    
    // Return user info without sensitive data
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  });

  // Zoho connection/disconnection for authenticated users
  app.post("/api/zoho/connect", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    try {
      const { clientId, clientSecret, organization } = req.body as ZohoCredentialsType;
      
      if (!clientId || !clientSecret || !organization) {
        return res.status(400).json({
          success: false,
          message: "Client ID, Client Secret, and Organization are required"
        });
      }

      // In a real implementation, we would initiate OAuth flow here
      // and exchange authorization code for tokens
      
      // Simulate token exchange
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
      
      // Save/update Zoho credentials for this user
      const existingCredentials = await storage.getZohoCredentials(req.user.id);
      
      if (existingCredentials) {
        await storage.updateZohoCredentials(existingCredentials.id, {
          clientId,
          clientSecret,
          organization,
          accessToken: "simulated_access_token",
          refreshToken: "simulated_refresh_token",
          expiresAt
        });
      } else {
        await storage.saveZohoCredentials({
          userId: req.user.id,
          clientId,
          clientSecret,
          organization,
          accessToken: "simulated_access_token",
          refreshToken: "simulated_refresh_token",
          expiresAt
        });
      }
      
      res.json({
        success: true,
        message: "Successfully connected to Zoho People"
      });
    } catch (error) {
      console.error("Zoho connect error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to connect to Zoho"
      });
    }
  });

  app.post("/api/zoho/disconnect", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    try {
      // Get existing credentials
      const credentials = await storage.getZohoCredentials(req.user.id);
      
      if (credentials) {
        // Update to remove tokens
        await storage.updateZohoCredentials(credentials.id, {
          accessToken: null,
          refreshToken: null,
          expiresAt: null
        });
      }
      
      res.json({
        success: true,
        message: "Successfully disconnected from Zoho People"
      });
    } catch (error) {
      console.error("Zoho disconnect error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to disconnect from Zoho"
      });
    }
  });

  app.get("/api/zoho/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    
    try {
      const credentials = await storage.getZohoCredentials(req.user.id);
      
      res.json({
        connected: !!credentials?.accessToken,
        expiresAt: credentials?.expiresAt || null
      });
    } catch (error) {
      console.error("Zoho status error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to check Zoho connection status"
      });
    }
  });
}