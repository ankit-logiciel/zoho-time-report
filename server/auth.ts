import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
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

export async function setupAuth(app: Express) {
  const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');

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

  // Create admin account if it doesn't exist
  const adminEmail = "ankit@logiciel.io";
  const adminUsername = "admin";
  const defaultPassword = "password123"; // Default password for initial setup
  
  try {
    // Check if admin user exists
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      // Create the admin user
      await storage.createUser({
        username: adminUsername,
        password: await hashPassword(defaultPassword),
        displayName: "Admin",
        email: adminEmail,
      });
      console.log("Admin account created successfully");
    }
  } catch (error) {
    console.error("Error setting up admin account:", error);
  }

  // Login route
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
          }
        });
      });
    })(req, res, next);
  });

  // Change password route
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authenticated" 
      });
    }
    
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required"
        });
      }
      
      // Get the user and verify current password
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      const passwordMatch = await comparePasswords(currentPassword, user.password);
      
      if (!passwordMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
      
      // Hash the new password and update the user
      const hashedPassword = await hashPassword(newPassword);
      
      await storage.updateUser(user.id, {
        password: hashedPassword
      });
      
      res.json({
        success: true,
        message: "Password changed successfully"
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to change password"
      });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ success: true });
    });
  });

  // Get current user route
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