import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tripInspectionsTable, bookingsTable, carsTable } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { dispatchNotification } from "../lib/notifications";

const router: IRouter = Router();

// GET /api/bookings/:bookingId/inspections — pickup + return records for a booking
router.get("/:bookingId/inspections", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(String(req.params.bookingId));
    if (isNaN(bookingId)) return res.status(400).json({ error: "bad_request" });

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!booking) return res.status(404).json({ error: "not_found" });
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === "admin" || userId === "admin-key" || userId === "admin-legacy";
    if (!isAdmin && userId !== booking.renterId && userId !== car?.hostUserId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const records = await db.select().from(tripInspectionsTable)
      .where(eq(tripInspectionsTable.bookingId, bookingId))
      .orderBy(asc(tripInspectionsTable.createdAt));
    res.json({ inspections: records });
  } catch {
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /api/bookings/:bookingId/inspections — record pickup or return
router.post("/:bookingId/inspections", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(String(req.params.bookingId));
    if (isNaN(bookingId)) return res.status(400).json({ error: "bad_request" });

    const { type, odometerKm, fuelLevel, photos, notes, damageReport, damageAmount } = req.body;
    if (!["pickup", "return"].includes(type)) {
      return res.status(400).json({ error: "invalid_type" });
    }
    if (!Array.isArray(photos) || photos.length < 1) {
      return res.status(400).json({ error: "photos_required", message: "Sube al menos una foto" });
    }

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!booking) return res.status(404).json({ error: "not_found" });
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === "admin" || userId === "admin-key" || userId === "admin-legacy";
    if (!isAdmin && userId !== booking.renterId && userId !== car?.hostUserId) {
      return res.status(403).json({ error: "forbidden" });
    }

    // No duplicates of the same type per booking
    const [existing] = await db.select().from(tripInspectionsTable).where(and(
      eq(tripInspectionsTable.bookingId, bookingId),
      eq(tripInspectionsTable.type, type),
    ));
    if (existing) {
      return res.status(409).json({ error: "already_recorded", message: `Ya hay una inspección de ${type}` });
    }

    const [record] = await db.insert(tripInspectionsTable).values({
      bookingId,
      type,
      recordedByUserId: userId,
      odometerKm: typeof odometerKm === "number" ? odometerKm : null,
      fuelLevel: fuelLevel ? String(fuelLevel).substring(0, 20) : null,
      photos: (photos as string[]).slice(0, 10),
      notes: notes ? String(notes).substring(0, 1000) : null,
      damageReport: type === "return" && damageReport ? String(damageReport).substring(0, 2000) : null,
      damageAmount: type === "return" && typeof damageAmount === "number" ? String(damageAmount) : null,
    }).returning();

    // State transitions: pickup -> active, return -> completed
    const newStatus = type === "pickup" ? "active" : "completed";
    await db.update(bookingsTable)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(bookingsTable.id, bookingId));

    dispatchNotification({
      type: type === "pickup" ? "system" : "system",
      title: type === "pickup" ? "Viaje iniciado" : "Viaje completado",
      message: type === "pickup"
        ? `Reserva #${bookingId} en curso`
        : damageReport
          ? `Reserva #${bookingId} terminó con daños reportados`
          : `Reserva #${bookingId} terminó sin daños`,
      bookingId,
      recipientUserId: type === "pickup" ? booking.renterId : (car?.hostUserId ?? null),
    }).catch(() => {});

    res.status(201).json(record);
  } catch (err) {
    req.log.error({ err }, "Error recording inspection");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
