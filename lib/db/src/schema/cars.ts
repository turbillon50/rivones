import { pgTable, text, serial, numeric, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carsTable = pgTable("cars", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // Rental price per day (MXN)
  pricePerDay: numeric("price_per_day", { precision: 10, scale: 2 }).notNull(),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  lat: numeric("lat", { precision: 10, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 6 }).notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  video: text("video"),
  specs: jsonb("specs").$type<{
    brand: string;
    model: string;
    year: number;
    km: number;
    transmission: "manual" | "automatic" | "cvt";
    fuel: "gasoline" | "diesel" | "hybrid" | "electric";
    color?: string;
    doors?: number;
    horsepower?: number;
    engine?: string;
    seats?: number;
  }>().notNull(),
  description: text("description").notNull(),
  // Foreign key to users.clerkUserId. Cars created before users existed have null.
  hostUserId: text("host_user_id"),
  // Denormalized host info shown in listings (name, phone, avatar).
  // Source of truth is the users table; this is a snapshot for fast reads.
  host: jsonb("host").$type<{
    id: string;
    name: string;
    phone: string;
    whatsapp?: string;
    rating?: number;
    totalListings?: number;
    memberSince?: string;
    avatar?: string;
    responseTime?: string;
    tripsCompleted?: number;
  }>().notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  category: text("category").notNull(),
  status: text("status").notNull().default("active"),
  featured: boolean("featured").notNull().default(false),
  badge: text("badge"),
  isFavorited: boolean("is_favorited").notNull().default(false),
  hasVideo: boolean("has_video").notNull().default(false),
  // Rental-specific fields
  instantBook: boolean("instant_book").notNull().default(true),
  deliveryAvailable: boolean("delivery_available").notNull().default(false),
  deliveryFee: numeric("delivery_fee", { precision: 8, scale: 2 }),
  minDays: integer("min_days").notNull().default(1),
  maxDays: integer("max_days").notNull().default(30),
  mileageLimit: integer("mileage_limit"),
  fuelPolicy: text("fuel_policy").notNull().default("full_to_full"),
  cleaningFee: numeric("cleaning_fee", { precision: 8, scale: 2 }).notNull().default("0"),
  // Cancellation policy chosen by the host: "flexible" | "moderate" | "strict"
  cancellationPolicy: text("cancellation_policy").notNull().default("moderate"),
  // ISO YYYY-MM-DD dates the host has blocked out (vacation, personal use).
  blockedDates: jsonb("blocked_dates").$type<string[]>().notNull().default([]),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.0"),
  reviewCount: integer("review_count").notNull().default(0),
  tripsCount: integer("trips_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCarSchema = createInsertSchema(carsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof carsTable.$inferSelect;
