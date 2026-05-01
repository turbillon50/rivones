import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  bookingId: integer("booking_id"),
  reviewerId: text("reviewer_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  reviewerAvatar: text("reviewer_avatar"),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
  comment: text("comment").notNull(),
  hostReply: text("host_reply"),
  hostReplyAt: timestamp("host_reply_at"),
  tripDays: integer("trip_days"),
  tripCity: text("trip_city"),
  // "renter" = guest reviewing the car/host. "host" = host reviewing the renter.
  reviewerType: text("reviewer_type").notNull().default("renter"),
  // Reviews are hidden until both parties submit OR the 14-day window passes.
  // visibleAt = the timestamp the review becomes public. Null = not visible yet.
  visibleAt: timestamp("visible_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
