import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { ZohoCredentials as ZohoCredentialsType } from "@/components/connect-modal";
import axios from "axios";

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

// Middleware to ensure the user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    message: "Authentication required"
  });
}

// Middleware to ensure the user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.username === "admin") {
    return next();
  }
  
  res.status(403).json({
    success: false,
    message: "Admin privileges required"
  });
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
  passport.serializeUser((user: any, done) => done(null, user.id));
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

  // Authentication routes
  
  // Login route
  app.post("/api/login", (req, res, next) => {
    // Ensure the response is JSON
    res.setHeader('Content-Type', 'application/json');
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
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

  // User management routes
  
  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Return users without sensitive data
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get users"
      });
    }
  });
  
  // Create a new user (admin only)
  app.post("/api/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const { username, password, displayName, email } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required"
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Username already exists"
        });
      }
      
      // Create the new user
      const hashedPassword = await hashPassword(password);
      
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        displayName: displayName || null,
        email: email || null,
      });
      
      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          email: newUser.email,
        }
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create user"
      });
    }
  });

  // Change password route
  app.post("/api/change-password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required"
        });
      }
      
      // Get the user and verify current password
      const user = await storage.getUser(req.user!.id);
      
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

  // Zoho connection/disconnection for authenticated users
  app.post("/api/zoho/connect", async (req: Request, res: Response) => {
    try {
      // First verify that the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }
      
      const { clientId, clientSecret, organization } = req.body;
      
      if (!clientId || !clientSecret || !organization) {
        return res.status(400).json({
          success: false,
          message: "Client ID, Client Secret, and Organization are required"
        });
      }

      console.log("Connecting to Zoho with credentials for user:", req.user!.id);
      
      // In a production app, we would make an OAuth request to Zoho,
      // but for this demo we'll create a simulated token
      // Following Zoho's self-client approach
      const accessToken = "simulated_zoho_access_token";
      const refreshToken = "simulated_zoho_refresh_token";
      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
      
      // Save the credentials to the database
      const existingCredentials = await storage.getZohoCredentials(req.user!.id);
      
      if (existingCredentials) {
        await storage.updateZohoCredentials(existingCredentials.id, {
          clientId,
          clientSecret,
          organization,
          accessToken,
          refreshToken,
          expiresAt
        });
      } else {
        await storage.saveZohoCredentials({
          userId: req.user!.id,
          clientId,
          clientSecret,
          organization,
          accessToken,
          refreshToken,
          expiresAt
        });
      }
      
      // Return success response
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
  }
  });

  app.post("/api/zoho/disconnect", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get existing credentials
      const credentials = await storage.getZohoCredentials(req.user!.id);
      
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

  app.get("/api/zoho/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const credentials = await storage.getZohoCredentials(req.user!.id);
      
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