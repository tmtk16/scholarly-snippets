import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  submissionCount: integer("submission_count").default(0).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // price in cents per 500 words
  turnaround: integer("turnaround").notNull(), // in hours
  isExpress: boolean("is_express").default(false),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  wordCount: integer("word_count").notNull(),
  filename: text("filename"),
  promptInstructions: text("prompt_instructions").notNull(),
  additionalInstructions: text("additional_instructions"),
  // pending_approval (initial state), approved (ready for payment)
  // paid (payment received), in_progress (being worked on)
  // completed (work done), rejected (not accepted)
  status: text("status").notNull().default("pending_approval"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  completedAt: timestamp("completed_at"),
  feedback: text("feedback"),
  totalPrice: integer("total_price").notNull(), // total price in cents
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: text("payment_status").default("unpaid"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const insertServiceSchema = createInsertSchema(services);

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
  completedAt: true,
});

// Custom validation schema for submissions
export const submissionValidationSchema = z.object({
  serviceId: z.number(),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  wordCount: z.number().min(1, "Word count must be at least 1"),
  promptInstructions: z.string().min(10, "Paper prompt/instructions are required and must be at least 10 characters"),
  additionalInstructions: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the academic integrity terms"
  }),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
