import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable, bookingsTable, carsTable } from "@workspace/db/schema";
import { eq, and, asc, isNull } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { dispatchNotification } from "../lib/notifications";

const router: IRouter = Router();

async function getParticipants(bookingId: number) {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking) return null;
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
  return {
    booking,
    car,
    renterId: booking.renterId,
    hostUserId: car?.hostUserId ?? null,
  };
}

// GET /api/bookings/:bookingId/messages — thread between renter & host
router.get("/:bookingId/messages", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(String(req.params.bookingId));
    if (isNaN(bookingId)) return res.status(400).json({ error: "bad_request" });
    const ctx = await getParticipants(bookingId);
    if (!ctx) return res.status(404).json({ error: "not_found" });

    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === "admin" || userId === "admin-key" || userId === "admin-legacy";
    if (!isAdmin && userId !== ctx.renterId && userId !== ctx.hostUserId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const msgs = await db.select().from(messagesTable)
      .where(eq(messagesTable.bookingId, bookingId))
      .orderBy(asc(messagesTable.createdAt));

    // Mark as read for the requester
    await db.update(messagesTable)
      .set({ readAt: new Date() })
      .where(and(
        eq(messagesTable.bookingId, bookingId),
        eq(messagesTable.recipientUserId, userId),
        isNull(messagesTable.readAt),
      ));

    res.json({ messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Error fetching messages");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /api/bookings/:bookingId/messages — send a message
router.post("/:bookingId/messages", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(String(req.params.bookingId));
    if (isNaN(bookingId)) return res.status(400).json({ error: "bad_request" });
    const { body } = req.body;
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return res.status(400).json({ error: "empty_body" });
    }
    if (body.length > 2000) {
      return res.status(400).json({ error: "body_too_long" });
    }

    const ctx = await getParticipants(bookingId);
    if (!ctx) return res.status(404).json({ error: "not_found" });
    if (!ctx.hostUserId) {
      return res.status(400).json({ error: "no_host_account", message: "Este auto no tiene anfitrión vinculado" });
    }

    const senderUserId = req.auth!.userId;
    let recipientUserId: string;
    if (senderUserId === ctx.renterId) recipientUserId = ctx.hostUserId;
    else if (senderUserId === ctx.hostUserId) recipientUserId = ctx.renterId;
    else return res.status(403).json({ error: "forbidden" });

    const [message] = await db.insert(messagesTable).values({
      bookingId,
      senderUserId,
      recipientUserId,
      body: body.trim(),
    }).returning();

    dispatchNotification({
      type: "message_received",
      title: "Nuevo mensaje",
      message: body.trim().substring(0, 120),
      bookingId,
      recipientUserId,
    }).catch(() => {});

    res.status(201).json(message);
  } catch (err) {
    req.log.error({ err }, "Error sending message");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/bookings/messages/unread-count — badge counter
router.get("/messages/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const rows = await db.select().from(messagesTable).where(and(
      eq(messagesTable.recipientUserId, userId),
      isNull(messagesTable.readAt),
    ));
    res.json({ count: rows.length });
  } catch {
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
