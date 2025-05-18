import { 
  users, submissions, services, 
  type User, type InsertUser, 
  type Service, type InsertService,
  type Submission, type InsertSubmission 
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: { name?: string; email?: string }): Promise<User | undefined>;
  getUserSubmissionCount(userId: number): Promise<number>;
  incrementUserSubmissionCount(userId: number): Promise<void>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  
  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  
  // Submissions
  getSubmissions(userId?: number): Promise<Submission[]>;
  getSubmissionsByStatus(status: string): Promise<Submission[]>;
  getSubmissionCount(userId: number): Promise<number>;
  getPendingSubmissionCount(userId: number): Promise<number>;
  getSubmission(id: number): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmissionStatus(id: number, status: string): Promise<Submission | undefined>;
  updateSubmissionPayment(id: number, paymentIntentId: string, status: string): Promise<Submission | undefined>;
  approveSubmission(id: number): Promise<Submission | undefined>;
  rejectSubmission(id: number): Promise<Submission | undefined>;
  markSubmissionPaid(id: number): Promise<Submission | undefined>;
  addFeedback(id: number, feedback: string): Promise<Submission | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private submissions: Map<number, Submission>;
  private userId: number;
  private serviceId: number;
  private submissionId: number;
  
  // For interface compliance, implementing all required methods
  getSubmissionCount(userId: number): Promise<number> {
    const userSubmissions = Array.from(this.submissions.values())
      .filter(sub => sub.userId === userId);
    return Promise.resolve(userSubmissions.length);
  }
  
  getUserSubmissionCount(userId: number): Promise<number> {
    const user = this.users.get(userId);
    return Promise.resolve(user?.submissionCount || 0);
  }
  
  incrementUserSubmissionCount(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return Promise.resolve();
    
    user.submissionCount = (user.submissionCount || 0) + 1;
    this.users.set(userId, user);
    return Promise.resolve();
  }
  
  updateUser(id: number, data: { name?: string; email?: string }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return Promise.resolve(undefined);
    
    const updatedUser = {
      ...user,
      name: data.name !== undefined ? data.name : user.name,
      email: data.email !== undefined ? data.email : user.email
    };
    
    this.users.set(id, updatedUser);
    return Promise.resolve(updatedUser);
  }
  
  updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updatedUser = {...user, stripeCustomerId: customerId};
    this.users.set(userId, updatedUser as User);
    return Promise.resolve(updatedUser as User);
  }
  
  updateSubmissionPayment(id: number, paymentIntentId: string, status: string): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return Promise.resolve(undefined);
    
    const updatedSubmission = {
      ...submission,
      paymentIntentId,
      paymentStatus: status
    };
    
    this.submissions.set(id, updatedSubmission);
    return Promise.resolve(updatedSubmission);
  }
  
  approveSubmission(id: number): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return Promise.resolve(undefined);
    
    const updatedSubmission = {
      ...submission,
      status: "approved",
      approvedAt: new Date()
    };
    
    this.submissions.set(id, updatedSubmission);
    return Promise.resolve(updatedSubmission);
  }
  
  rejectSubmission(id: number): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return Promise.resolve(undefined);
    
    const updatedSubmission = {
      ...submission,
      status: "rejected"
    };
    
    this.submissions.set(id, updatedSubmission);
    return Promise.resolve(updatedSubmission);
  }
  
  markSubmissionPaid(id: number): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return Promise.resolve(undefined);
    
    const updatedSubmission = {
      ...submission,
      status: "paid",
      paidAt: new Date(),
      paymentStatus: "paid"
    };
    
    this.submissions.set(id, updatedSubmission);
    return Promise.resolve(updatedSubmission);
  }
  
  getSubmissionsByStatus(status: string): Promise<Submission[]> {
    const submissions = Array.from(this.submissions.values());
    return Promise.resolve(submissions.filter(sub => sub.status === status));
  }
  
  getPendingSubmissionCount(userId: number): Promise<number> {
    const submissions = Array.from(this.submissions.values());
    const pendingCount = submissions.filter(
      sub => sub.userId === userId && sub.status === 'pending_approval'
    ).length;
    return Promise.resolve(pendingCount);
  }

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.submissions = new Map();
    this.userId = 1;
    this.serviceId = 1;
    this.submissionId = 1;
    
    // Initialize with default services
    this.initDefaultServices();
  }

  private initDefaultServices() {
    const standardService: InsertService = {
      name: "Standard Review",
      description: "Comprehensive feedback on your academic writing with detailed suggestions for improvement in structure, clarity, flow, and argumentation.",
      price: 1500, // $15.00
      turnaround: 72, // 3 days in hours
      isExpress: false,
    };
    
    const expressService: InsertService = {
      name: "Express Review",
      description: "Expedited feedback for time-sensitive submissions. Same comprehensive review with priority handling for urgent deadlines.",
      price: 3000, // $30.00
      turnaround: 24, // 24 hours
      isExpress: true,
    };
    
    const sopService: InsertService = {
      name: "Statement of Purpose",
      description: "Specialized feedback for graduate school, scholarship, or fellowship application statements, focusing on impact, clarity, and personal narrative.",
      price: 1500, // $15.00
      turnaround: 72, // 3 days in hours
      isExpress: false,
    };
    
    const researchService: InsertService = {
      name: "Research Paper Review",
      description: "Detailed feedback on academic research papers, with attention to argumentation, methodology presentation, and academic conventions.",
      price: 1500, // $15.00
      turnaround: 72, // 3 days in hours
      isExpress: false,
    };
    
    this.createService(standardService);
    this.createService(expressService);
    this.createService(sopService);
    this.createService(researchService);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser,
      id,
      name: insertUser.name || null,
      email: insertUser.email || null
    };
    this.users.set(id, user);
    return user;
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.serviceId++;
    const service: Service = { 
      ...insertService, 
      id,
      isExpress: insertService.isExpress || false
    };
    this.services.set(id, service);
    return service;
  }

  // Submission methods
  async getSubmissions(userId?: number): Promise<Submission[]> {
    const submissions = Array.from(this.submissions.values());
    if (userId) {
      return submissions.filter(submission => submission.userId === userId);
    }
    return submissions;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.submissionId++;
    const submission: Submission = { 
      ...insertSubmission, 
      id, 
      submittedAt: new Date(),
      completedAt: null,
      status: insertSubmission.status || 'pending',
      content: insertSubmission.content || null,
      userId: insertSubmission.userId || null,
      filename: insertSubmission.filename || null,
      additionalInstructions: insertSubmission.additionalInstructions || null,
      feedback: null
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async updateSubmissionStatus(id: number, status: string): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;

    const updatedSubmission: Submission = {
      ...submission,
      status,
      completedAt: status === 'completed' ? new Date() : submission.completedAt,
    };
    
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }

  async addFeedback(id: number, feedback: string): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;

    const updatedSubmission: Submission = {
      ...submission,
      feedback,
      status: 'completed',
      completedAt: new Date(),
    };
    
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
}

import { PgStorage } from "./pgStorage";

// Use PostgreSQL storage instead of in-memory storage
export const storage = new PgStorage();
