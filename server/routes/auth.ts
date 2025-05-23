import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from '../storage';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { User as SelectUser } from '@shared/schema';

const router = Router();
const scryptAsync = promisify(scrypt);

// Password hashing functions
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Configure passport
export function configurePassport() {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Create admin account if it doesn't exist
export async function createAdminAccount() {
  const adminEmail = 'ankit@logiciel.io';
  const adminUsername = 'admin';
  const defaultPassword = 'password123';
  
  try {
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      await storage.createUser({
        username: adminUsername,
        password: await hashPassword(defaultPassword),
        displayName: 'Admin',
        email: adminEmail,
      });
      console.log('Admin account created successfully');
    }
  } catch (error) {
    console.error('Error setting up admin account:', error);
  }
}

// Auth middleware - ensures requests to protected routes are authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    message: 'Not authenticated'
  });
}

// Login route
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  // Ensure we return JSON
  res.setHeader('Content-Type', 'application/json');
  
  passport.authenticate('local', (err: any, user: Express.User | false, info: any) => {
    if (err) return next(err);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid username or password'
      });
    }
    
    req.login(user, (err) => {
      if (err) return next(err);
      
      const userObj = user as SelectUser;
      res.json({
        success: true,
        user: {
          id: userObj.id,
          username: userObj.username,
          displayName: userObj.displayName,
          email: userObj.email,
        }
      });
    });
  })(req, res, next);
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Get current user
router.get('/user', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  const user = req.user as SelectUser;
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
  });
});

// Change password
router.post('/change-password', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    const user = await storage.getUser((req.user as SelectUser).id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const passwordMatch = await comparePasswords(currentPassword, user.password);
    
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    const hashedPassword = await hashPassword(newPassword);
    
    await storage.updateUser(user.id, {
      password: hashedPassword
    });
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change password'
    });
  }
});

// Create a new user (admin only)
router.post('/users', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as SelectUser;
    
    // Only admins can create users (simplified check - you could add an admin role in the schema)
    if (currentUser.username !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can create new accounts'
      });
    }
    
    const { username, password, displayName, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    const existingUser = await storage.getUserByUsername(username);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
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
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user'
    });
  }
});

// Get all users (admin only)
router.get('/users', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as SelectUser;
    
    // Only admins can list users
    if (currentUser.username !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can list all accounts'
      });
    }
    
    const users = await storage.getAllUsers();
    
    res.json(
      users.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
      }))
    );
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get users'
    });
  }
});

export default router;