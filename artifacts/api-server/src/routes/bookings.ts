import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { bookingsTable, carsTable, usersTable } from "@workspace/db/schema";
import { eq, and, or, lte, gte, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { calculateBookingPrice, isCarAvailable } from "../lib/booking-pricing";
import { dispatchNotification } from "../lib/notifications";

const router: IRouter = Router();

const createBookingLimiter = rateLimit({
  windowMs: 60_000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Demasiadas reservas en poco tiempo" },
});

// POST /api/bookings/quote — pre-booking price + availability check (no persist)
router.post("/quote", async (req, res) => {
  try {
    const { carId, startDate, endDate, insuranceAdded, deliveryRequested } = req.body;
    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ error: "missing_fields" });
    }
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, parseInt(carId)));
    if (!car) return res.status(404).json({ error: "car_not_found" });

    const overlap = await db.select().from(bookingsTable).where(
      and(
        eq(bookingsTable.carId, parseInt(carId)),
        or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "active"), eq(bookingsTable.status, "pending")),
        lte(bookingsTable.startDate, endDate),
        gte(bookingsTable.endDate, startDate),
      )
    );

    const blockedDates = (car.blockedDates as string[]) ?? [];
    const available = overlap.length === 0 && isCarAvailable(blockedDates, startDate, endDate);

    const pricing = calculateBookingPrice({
      pricePerDay: Number(car.pricePerDay),
      cleaningFee: Number(car.cleaningFee ?? 0),
      depositAmount: Number(car.depositAmount ?? 0),
      startDate,
      endDate,
      insuranceAdded: !!insuranceAdded,
      deliveryFee: deliveryRequested ? Number(car.deliveryFee ?? 0) : 0,
    });

    res.json({
      available,
      ...pricing,
      car: {
        id: car.id.toString(),
        title: car.title,
        instantBook: car.instantBook,
        cancellationPolicy: car.cancellationPolicy ?? "moderate",
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error generating quote");
    res.status(500).json({ error: "internal_error" });
  }
});

// POST /api/bookings — create a booking (authenticated)
router.post("/", requireAuth, createBookingLimiter as any, async (req, res) => {
  try {
    const renterId = req.auth!.userId;
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

    // Verify renter has a verified license unless we're in a no-clerk dev env
    if (renterId !== "anon-dev") {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, renterId));
      if (user?.blocked) {
        return res.status(403).json({ error: "user_blocked", message: "Tu cuenta no puede crear reservas en este momento" });
      }
      if (process.env.REQUIRE_LICENSE_VERIFIED === "1" && user?.licenseStatus !== "verified") {
        return res.status(403).json({
          error: "license_unverified",
          message: "Necesitas verificar tu licencia de conducir antes de reservar",
        });
      }
    }

    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, parseInt(carId)));
    if (!car) return res.status(404).json({ error: "car_not_found" });

    // Hosts can't book their own cars
    if (car.hostUserId && car.hostUserId === renterId) {
      return res.status(400).json({ error: "self_booking", message: "No puedes reservar tu propio auto" });
    }

    const overlap = await db.select().from(bookingsTable).where(
      and(
        eq(bookingsTable.carId, parseInt(carId)),
        or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "active"), eq(bookingsTable.status, "pending")),
        lte(bookingsTable.startDate, endDate),
        gte(bookingsTable.endDate, startDate),
      )
    );
    if (overlap.length > 0) {
      return res.status(409).json({ error: "not_available", message: "El auto no está disponible para esas fechas" });
    }

    const blockedDates = (car.blockedDates as string[]) ?? [];
    if (!isCarAvailable(blockedDates, startDate, endDate)) {
      return res.status(409).json({ error: "host_blocked_dates", message: "El anfitrión bloqueó estas fechas" });
    }

    const pricing = calculateBookingPrice({
      pricePerDay: Number(car.pricePerDay),
      cleaningFee: Number(car.cleaningFee ?? 0),
      depositAmount: Number(car.depositAmount ?? 0),
      startDate,
      endDate,
      insuranceAdded: !!insuranceAdded,
      deliveryFee: deliveryRequested ? Number(car.deliveryFee ?? 0) : 0,
    });

    const [booking] = await db.insert(bookingsTable).values({
      carId: parseInt(carId),
      renterId,
      renterName,
      renterPhone,
      renterEmail: renterEmail ?? req.auth?.email ?? null,
      startDate,
      endDate,
      days: pricing.days,
      pricePerDay: pricing.pricePerDay.toString(),
      subtotal: pricing.subtotal.toString(),
      cleaningFee: pricing.cleaningFee.toString(),
      serviceFee: pricing.serviceFee.toString(),
      insuranceFee: pricing.insuranceFee.toString(),
      depositAmount: pricing.depositAmount.toString(),
      totalAmount: pricing.totalAmount.toString(),
      insuranceAdded: !!insuranceAdded,
      deliveryRequested: !!deliveryRequested,
      notes: notes ?? null,
      // Always start as "pending" until payment_intent.succeeded comes in via webhook
      status: "pending",
      rentalPaymentStatus: "pending",
      termsAccepted: true,
    }).returning();

    // Fire notifications (best-effort, don't fail the booking if email is down)
    dispatchNotification({
      type: "booking_request",
      title: "Nueva solicitud de reserva",
      message: `Reserva #${booking.id} para ${car.title}`,
      carId: car.id,
      bookingId: booking.id,
      recipientUserId: car.hostUserId ?? null,
      email: req.auth?.email ?? null,
    }).catch((e) => req.log.warn({ err: e }, "notification dispatch failed"));

    res.status(201).json({
      ...booking,
      car: { title: car.title, images: car.images, city: car.city, host: car.host },
    });
  } catch (err) {
    req.log.error({ err }, "Error creating booking");
    res.status(500).json({ error: "internal_error", message: "Error al crear la reserva" });
  }
});

// GET /api/bookings — list bookings.
//   - admin: all bookings
//   - host: bookings on their cars
//   - renter: bookings they created
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === "admin" || userId === "admin-key" || userId === "admin-legacy";

    let bookings;
    if (isAdmin) {
      bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
    } else {
      // host's car bookings
      const myCars = await db.select({ id: carsTable.id }).from(carsTable).where(eq(carsTable.hostUserId, userId));
      const myCarIds = new Set(myCars.map(c => c.id));
      const all = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
      bookings = all.filter(b => b.renterId === userId || myCarIds.has(b.carId));
    }
    res.json(bookings);
  } catch (err) {
    req.log.error({ err }, "Error fetching bookings");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/bookings/:id — auth: renter | host | admin
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    if (!booking) return res.status(404).json({ error: "not_found" });

    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === "admin" || userId === "admin-key" || userId === "admin-legacy";
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    const isHost = car?.hostUserId === userId;
    const isRenter = booking.renterId === userId;

    if (!isAdmin && !isHost && !isRenter) {
      return res.status(403).json({ error: "forbidden" });
    }

    res.json({ ...booking, car: car ? { id: car.id, title: car.title, images: car.images, host: car.host } : null });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// PATCH /api/bookings/:id/status — confirm/cancel (admin or host of the car)
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["confirmed", "active", "completed", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "invalid_status" });

    const id = parseInt(req.params.id);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    if (!booking) return res.status(404).json({ error: "not_found" });

    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === "admin" || userId === "admin-key" || userId === "admin-legacy";
    const isHost = car?.hostUserId === userId;
    const isRenter = booking.renterId === userId;

    // Only the host or admin can confirm/activate/complete. Renter can only cancel.
    if (!isAdmin && !isHost) {
      if (!(status === "cancelled" && isRenter)) {
        return res.status(403).json({ error: "forbidden" });
      }
    }

    const [updated] = await db.update(bookingsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookingsTable.id, id))
      .returning();

    dispatchNotification({
      type: status === "cancelled" ? "booking_cancelled" : "booking_confirmed",
      title: status === "cancelled" ? "Reserva cancelada" : "Reserva confirmada",
      message: `Reserva #${updated.id} ahora está ${status}`,
      carId: booking.carId,
      bookingId: booking.id,
      recipientUserId: status === "cancelled" ? booking.renterId : booking.renterId,
      email: booking.renterEmail ?? null,
    }).catch((e) => req.log.warn({ err: e }, "notification dispatch failed"));

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:id/rental-intent", requireAuth, async (req, res) => {
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
