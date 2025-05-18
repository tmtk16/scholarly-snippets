import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  users, submissions, services, 
  type User, type InsertUser, 
  type Service, type InsertService,
  type Submission, type InsertSubmission 
} from "@shared/schema";
import { IStorage } from "./storage";

export class PgStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = { 
      ...insertUser, 
      submissionCount: 0,
      stripeCustomerId: null
    };
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async getUserSubmissionCount(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    return user?.submissionCount || 0;
  }

  async incrementUserSubmissionCount(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        submissionCount: sql`${users.submissionCount} + 1` 
      })
      .where(eq(users.id, userId));
  }

  async updateUser(id: number, data: { name?: string; email?: string }): Promise<User | undefined> {
    // Only update fields that are provided
    const updateData: Record<string, any> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    
    // If no fields to update, return the existing user
    if (Object.keys(updateData).length === 0) {
      return this.getUser(id);
    }
    
    const results = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    return results[0];
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const results = await db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return results[0];
  }

  // Services
  async getServices(): Promise<Service[]> {
    return db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const results = await db.select().from(services).where(eq(services.id, id));
    return results[0];
  }

  async createService(insertService: InsertService): Promise<Service> {
    const results = await db.insert(services).values(insertService).returning();
    return results[0];
  }

  // Submissions
  async getSubmissions(userId?: number): Promise<Submission[]> {
    if (userId) {
      return db.select().from(submissions).where(eq(submissions.userId, userId));
    }
    return db.select().from(submissions);
  }

  async getSubmissionsByStatus(status: string): Promise<Submission[]> {
    return db.select().from(submissions).where(eq(submissions.status, status));
  }

  async getSubmissionCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.userId, userId));
    return result[0]?.count || 0;
  }
  
  async getPendingSubmissionCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.status, "pending_approval")
        )
      );
    return result[0]?.count || 0;
  }

  async getSubmission(id: number): Promise<Submission | undefined> {
    const results = await db.select().from(submissions).where(eq(submissions.id, id));
    return results[0];
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const submission = {
      ...insertSubmission,
      status: "pending_approval",
      approvedAt: null,
      paidAt: null,
      completedAt: null,
      feedback: null,
      paymentIntentId: null,
      paymentStatus: "unpaid"
    };
    
    // Increment user submission count if userId is provided
    if (submission.userId) {
      await this.incrementUserSubmissionCount(submission.userId);
    }
    
    const results = await db.insert(submissions).values(submission).returning();
    return results[0];
  }

  async updateSubmissionStatus(id: number, status: string): Promise<Submission | undefined> {
    let updateData: any = { status };
    
    if (status === "completed") {
      updateData.completedAt = new Date();
    }
    
    const results = await db.update(submissions)
      .set(updateData)
      .where(eq(submissions.id, id))
      .returning();
      
    return results[0];
  }

  async updateSubmissionPayment(id: number, paymentIntentId: string, status: string): Promise<Submission | undefined> {
    const results = await db.update(submissions)
      .set({ 
        paymentIntentId, 
        paymentStatus: status 
      })
      .where(eq(submissions.id, id))
      .returning();
      
    return results[0];
  }

  async approveSubmission(id: number): Promise<Submission | undefined> {
    const results = await db.update(submissions)
      .set({ 
        status: "approved", 
        approvedAt: new Date() 
      })
      .where(eq(submissions.id, id))
      .returning();
      
    return results[0];
  }

  async rejectSubmission(id: number): Promise<Submission | undefined> {
    const results = await db.update(submissions)
      .set({ status: "rejected" })
      .where(eq(submissions.id, id))
      .returning();
      
    return results[0];
  }

  async markSubmissionPaid(id: number): Promise<Submission | undefined> {
    const results = await db.update(submissions)
      .set({ 
        status: "paid", 
        paidAt: new Date(),
        paymentStatus: "paid" 
      })
      .where(eq(submissions.id, id))
      .returning();
      
    return results[0];
  }

  async addFeedback(id: number, feedback: string): Promise<Submission | undefined> {
    const results = await db.update(submissions)
      .set({ 
        feedback,
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(submissions.id, id))
      .returning();
      
    return results[0];
  }
}