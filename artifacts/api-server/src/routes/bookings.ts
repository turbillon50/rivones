import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, carsTable } from "@workspace/db/schema";
import { eq, and, or, lte, gte } from "drizzle-orm";

const router: IRouter = Router();

// POST /api/bookings — create a booking
router.post("/", async (req, res) => {
  try {
    const {
      carId, renterName, renterPhone, renterEmail,
      startDate, endDate, insuranceAdded, deliveryRequested, notes,
      termsAccepted,
    } = req.body;

    if (!carId || !renterName || !renterPhone || !startDate || !endDate) {
      return res.status(400).json({ error: "missing_fields", message: "Campos obligatorios faltantes" });
    }
    if (!termsAccepted) {
      return res.status(400).json({ error: "terms_required", message: "Debes aceptar los términos" });
    }

    // Fetch car
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, parseInt(carId)));
    if (!car) return res.status(404).json({ error: "car_not_found" });

    // Check availability — no overlapping confirmed/active bookings
    const start = new Date(startDate);
    const end = new Date(endDate);
    const existing = await db.select().from(bookingsTable).where(
      and(
        eq(bookingsTable.carId, parseInt(carId)),
        or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "active"), eq(bookingsTable.status, "pending")),
        lte(bookingsTable.startDate, endDate),
        gte(bookingsTable.endDate, startDate),
      )
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "not_available", message: "El auto no está disponible para esas fechas" });
    }

    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const pricePerDay = Number(car.pricePerDay);
    const subtotal = pricePerDay * days;
    const cleaningFee = Number(car.cleaningFee ?? 0);
    const serviceFee = Math.round(subtotal * 0.12); // 12% service fee
    const insuranceFee = insuranceAdded ? Math.round(pricePerDay * 0.18 * days) : 0;
    const depositAmount = Number(car.depositAmount ?? 0);
    const totalAmount = subtotal + cleaningFee + serviceFee + insuranceFee;

    const [booking] = await db.insert(bookingsTable).values({
      carId: parseInt(carId),
      renterName,
      renterPhone,
      renterEmail: renterEmail ?? null,
      startDate,
      endDate,
      days,
      pricePerDay: pricePerDay.toString(),
      subtotal: subtotal.toString(),
      cleaningFee: cleaningFee.toString(),
      serviceFee: serviceFee.toString(),
      insuranceFee: insuranceFee.toString(),
      depositAmount: depositAmount.toString(),
      totalAmount: totalAmount.toString(),
      insuranceAdded: !!insuranceAdded,
      deliveryRequested: !!deliveryRequested,
      notes: notes ?? null,
      status: car.instantBook ? "confirmed" : "pending",
      termsAccepted: true,
    }).returning();

    res.status(201).json({
      ...booking,
      car: { title: car.title, images: car.images, city: car.city, host: car.host },
    });
  } catch (err) {
    req.log.error({ err }, "Error creating booking");
    res.status(500).json({ error: "internal_error", message: "Error al crear la reserva" });
  }
});

// GET /api/bookings — list bookings (admin/host)
router.get("/", async (req, res) => {
  try {
    const bookings = await db.select().from(bookingsTable).orderBy(bookingsTable.createdAt);
    res.json(bookings);
  } catch (err) {
    req.log.error({ err }, "Error fetching bookings");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/bookings/:id
router.get("/:id", async (req, res) => {
  try {
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parseInt(req.params.id)));
    if (!booking) return res.status(404).json({ error: "not_found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /api/bookings/:id/status — confirm/cancel
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["confirmed", "active", "completed", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "invalid_status" });
    const [updated] = await db.update(bookingsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookingsTable.id, parseInt(req.params.id)))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:id/rental-intent", async (req, res) => {
  try {
    const { rentalPaymentIntentId } = req.body;
    if (!rentalPaymentIntentId) return res.status(400).json({ error: "missing_intent_id" });
    const [updated] = await db.update(bookingsTable)
      .set({ rentalPaymentIntentId, rentalPaymentStatus: "pending", updatedAt: new Date() })
      .where(eq(bookingsTable.id, parseInt(req.params.id)))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
