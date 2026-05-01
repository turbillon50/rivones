import { pgTable, text, serial, integer, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripInspectionsTable = pgTable("trip_inspections", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  // "pickup" | "return"
  type: text("type").notNull(),
  // Who recorded the inspection (Clerk user id)
  recordedByUserId: text("recorded_by_user_id").notNull(),
  odometerKm: integer("odometer_km"),
  // Fuel level: 0..100 (percent), or text like "full"/"3/4"/"1/2"
  fuelLevel: text("fuel_level"),
  // Object-storage paths for inspection photos
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  // For return inspections: damages reported (free text + optional photos)
  damageReport: text("damage_report"),
  damageAmount: numeric("damage_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTripInspectionSchema = createInsertSchema(tripInspectionsTable).omit({ id: true, createdAt: true });
export type InsertTripInspection = z.infer<typeof insertTripInspectionSchema>;
export type TripInspection = typeof tripInspectionsTable.$inferSelect;
