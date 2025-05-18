import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submissionValidationSchema } from "@shared/schema";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { registerUser, loginUser, logoutUser, getCurrentUser, isAuthenticated } from "./auth";
import { createTeamsMeeting } from "./teams";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.resolve(import.meta.dirname, "../uploads");
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.') as any);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", registerUser);
  app.post("/api/auth/login", loginUser);
  app.post("/api/auth/logout", logoutUser);
  app.get("/api/auth/user", getCurrentUser);
  
  // Update user profile
  app.patch("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { name, email } = req.body;
      
      if (!name && !email) {
        return res.status(400).json({ message: 'No fields to update' });
      }
      
      const updatedUser = await storage.updateUser(user.id, { name, email });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return updated user without sensitive information
      const userWithoutPassword = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name
      };
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });
  
  // API routes
  
  // Get services
  app.get('/api/services', async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: 'Failed to fetch services' });
    }
  });

  // Get service by ID
  app.get('/api/services/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid service ID' });
      }
      
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ message: 'Failed to fetch service' });
    }
  });

  // Submit text - text submission (no file)
  app.post('/api/submissions/text', async (req: Request, res: Response) => {
    try {
      const validationResult = submissionValidationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: validationResult.error.errors 
        });
      }
      
      const { serviceId, title, content, wordCount, promptInstructions, additionalInstructions } = req.body;
      const userId = req.body.userId || null;
      
      // Check if user has reached the limit of 3 pending submissions
      if (userId) {
        const pendingCount = await storage.getPendingSubmissionCount(userId);
        if (pendingCount >= 3) {
          return res.status(400).json({ 
            message: 'You have reached the limit of 3 pending submissions. Please wait for your current submissions to be reviewed before submitting more.'
          });
        }
      }
      
      // Get service to calculate total price
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Calculate total price based on word count
      const units = Math.ceil(wordCount / 500);
      const totalPrice = units * service.price;
      
      const submission = await storage.createSubmission({
        serviceId,
        userId,
        title,
        content,
        wordCount,
        promptInstructions,
        additionalInstructions: additionalInstructions || '',
        status: 'pending_approval',
        totalPrice,
        filename: null,
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({ message: 'Failed to create submission' });
    }
  });

  // Submit text - file upload
  app.post('/api/submissions/file', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const validationResult = submissionValidationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        // Remove uploaded file if validation fails
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: validationResult.error.errors 
        });
      }
      
      const { serviceId, title, wordCount, promptInstructions, additionalInstructions } = req.body;
      const userId = req.body.userId || null;
      
      // Check if user has reached the limit of 3 pending submissions
      if (userId) {
        const pendingCount = await storage.getPendingSubmissionCount(userId);
        if (pendingCount >= 3) {
          // Remove uploaded file if user has reached the limit
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }
          
          return res.status(400).json({ 
            message: 'You have reached the limit of 3 pending submissions. Please wait for your current submissions to be reviewed before submitting more.'
          });
        }
      }
      
      // Get service to calculate total price
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Calculate total price based on word count
      const units = Math.ceil(wordCount / 500);
      const totalPrice = units * service.price;
      
      const submission = await storage.createSubmission({
        serviceId,
        userId,
        title,
        content: null, // No content for file submissions
        wordCount: parseInt(wordCount),
        promptInstructions,
        additionalInstructions: additionalInstructions || '',
        status: 'pending_approval',
        totalPrice,
        filename: req.file.filename,
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({ message: 'Failed to create submission' });
    }
  });

  // Get submissions by status
  app.get('/api/submissions/status/:status', async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const submissions = await storage.getSubmissionsByStatus(status);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions by status:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  // Get submissions (all or filtered by user)
  app.get('/api/submissions', async (req: Request, res: Response) => {
    try {
      let userId: number | undefined = undefined;
      
      if (req.query.userId) {
        userId = parseInt(req.query.userId as string);
        if (isNaN(userId)) {
          return res.status(400).json({ message: 'Invalid user ID' });
        }
      }
      
      const submissions = await storage.getSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  // Get submission by ID
  app.get('/api/submissions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid submission ID' });
      }
      
      const submission = await storage.getSubmission(id);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ message: 'Failed to fetch submission' });
    }
  });

  // Approve submission
  app.post('/api/submissions/:id/approve', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid submission ID' });
      }
      
      const submission = await storage.approveSubmission(id);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error approving submission:', error);
      res.status(500).json({ message: 'Failed to approve submission' });
    }
  });

  // Reject submission
  app.post('/api/submissions/:id/reject', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid submission ID' });
      }
      
      const submission = await storage.rejectSubmission(id);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error rejecting submission:', error);
      res.status(500).json({ message: 'Failed to reject submission' });
    }
  });

  // Add feedback to submission (marks as completed)
  app.post('/api/submissions/:id/feedback', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid submission ID' });
      }
      
      const { feedback } = req.body;
      if (!feedback || typeof feedback !== 'string') {
        return res.status(400).json({ message: 'Feedback is required' });
      }
      
      const submission = await storage.addFeedback(id, feedback);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error adding feedback:', error);
      res.status(500).json({ message: 'Failed to add feedback' });
    }
  });

  // Microsoft Teams meeting scheduling
  app.post('/api/meetings/teams', isAuthenticated, async (req, res) => {
    await createTeamsMeeting(req, res);
  });

  // PayPal integration routes
  app.get('/paypal/setup', async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post('/paypal/order', async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post('/paypal/order/:orderID/capture', async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Update submission payment status after successful payment
  app.post('/api/submissions/:id/payment-success', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid submission ID' });
      }
      
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        return res.status(400).json({ message: 'Payment intent ID is required' });
      }
      
      const submission = await storage.updateSubmissionPayment(id, paymentIntentId, 'paid');
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      // Mark the submission as paid
      const paidSubmission = await storage.markSubmissionPaid(id);
      res.json(paidSubmission);
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Failed to update payment status' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
