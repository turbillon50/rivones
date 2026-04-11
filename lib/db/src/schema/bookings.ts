import { pgTable, text, serial, numeric, boolean, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  // Guest/renter info
  renterId: text("renter_id").notNull().default("guest"),
  renterName: text("renter_name").notNull(),
  renterPhone: text("renter_phone").notNull(),
  renterEmail: text("renter_email"),
  // Trip dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  // Pricing breakdown
  days: integer("days").notNull(),
  pricePerDay: numeric("price_per_day", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  cleaningFee: numeric("cleaning_fee", { precision: 8, scale: 2 }).notNull().default("0"),
  serviceFee: numeric("service_fee", { precision: 8, scale: 2 }).notNull().default("0"),
  insuranceFee: numeric("insurance_fee", { precision: 8, scale: 2 }).notNull().default("0"),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  // Options
  insuranceAdded: boolean("insurance_added").notNull().default(false),
  deliveryRequested: boolean("delivery_requested").notNull().default(false),
  notes: text("notes"),
  // Status: pending | confirmed | active | completed | cancelled
  status: text("status").notNull().default("pending"),
  // Stripe — rental payment
  rentalPaymentIntentId: text("rental_payment_intent_id"),
  rentalPaymentStatus: text("rental_payment_status").notNull().default("pending"),
  // Stripe — deposit hold (capture_method: manual)
  depositPaymentIntentId: text("deposit_payment_intent_id"),
  depositStatus: text("deposit_status").notNull().default("none"),
  // License verification
  licenseVerified: boolean("license_verified").notNull().default(false),
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
