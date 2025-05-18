import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";

// Configure passport with local strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      
      // Compare password with hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return done(null, false, { message: "Incorrect password." });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize and deserialize user for session
passport.serializeUser((user: any, done) => {
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

// Helper function to hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Not authenticated" });
}

// User registration
export async function registerUser(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = insertUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationResult.error.errors 
      });
    }
    
    const { username, password, email, name } = req.body;
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      name
    });
    
    // Remove password from response
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name
    };
    
    // Log user in
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging in" });
      }
      
      res.status(201).json(userWithoutPassword);
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
}

// User login
export async function loginUser(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('local', (err: Error | null, user: any, info: { message: string }) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ message: info.message || 'Authentication failed' });
    }
    
    req.login(user, (err: Error | null) => {
      if (err) {
        return next(err);
      }
      
      // Remove password from response
      const userWithoutPassword = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      };
      
      return res.json(userWithoutPassword);
    });
  })(req, res, next);
}

// User logout
export function logoutUser(req: Request, res: Response) {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
}

// Get current user
export function getCurrentUser(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Remove password from response
  const user = req.user as any;
  const userWithoutPassword = {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name
  };
  
  res.json(userWithoutPassword);
}