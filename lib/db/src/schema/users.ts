import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  // Clerk user id is the source of truth for identity. Unique.
  clerkUserId: text("clerk_user_id").notNull().unique(),
  // "renter" | "host" | "both" | "admin"
  role: text("role").notNull().default("renter"),
  displayName: text("display_name"),
  email: text("email"),
  phone: text("phone"),
  avatar: text("avatar"),

  // Identity verification
  // licenseStatus: "none" | "pending" | "verified" | "rejected"
  licenseStatus: text("license_status").notNull().default("none"),
  licenseDocId: integer("license_doc_id"),
  // ineStatus only relevant for hosts
  ineStatus: text("ine_status").notNull().default("none"),
  ineDocId: integer("ine_doc_id"),
  rfc: text("rfc"),

  // Stripe Connect (hosts get a connected account for payouts)
  stripeAccountId: text("stripe_account_id"),
  payoutsEnabled: boolean("payouts_enabled").notNull().default(false),

  // Soft-block flag for trust & safety
  blocked: boolean("blocked").notNull().default(false),
  blockedReason: text("blocked_reason"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
