import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  senderUserId: text("sender_user_id").notNull(),
  recipientUserId: text("recipient_user_id").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at"),
  // System messages (e.g. "Reserva confirmada") aren't sent by a person.
  system: boolean("system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
