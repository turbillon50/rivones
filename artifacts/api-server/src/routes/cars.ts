import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { carsTable, bookingsTable } from "@workspace/db/schema";
import { eq, ilike, gte, lte, and, type SQL, or, not } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth";

const router: IRouter = Router();

function carToApi(car: typeof carsTable.$inferSelect) {
  return {
    id: car.id.toString(),
    title: car.title,
    pricePerDay: Number(car.pricePerDay),
    depositAmount: Number(car.depositAmount ?? 0),
    location: { lat: Number(car.lat), lng: Number(car.lng) },
    address: car.address,
    city: car.city,
    images: car.images as string[],
    video: car.video ?? null,
    specs: car.specs,
    description: car.description,
    host: car.host,
    features: (car.features as string[]) ?? [],
    tags: (car.tags as string[]) ?? [],
    category: car.category,
    status: car.status,
    featured: car.featured,
    badge: car.badge ?? null,
    isFavorited: car.isFavorited,
    hasVideo: car.hasVideo,
    instantBook: car.instantBook,
    deliveryAvailable: car.deliveryAvailable,
    deliveryFee: car.deliveryFee ? Number(car.deliveryFee) : null,
    minDays: car.minDays,
    maxDays: car.maxDays,
    mileageLimit: car.mileageLimit ?? null,
    fuelPolicy: car.fuelPolicy,
    cleaningFee: Number(car.cleaningFee ?? 0),
    cancellationPolicy: car.cancellationPolicy ?? "moderate",
    blockedDates: (car.blockedDates as string[]) ?? [],
    hostUserId: car.hostUserId ?? null,
    rating: Number(car.rating ?? 5.0),
    reviewCount: car.reviewCount ?? 0,
    tripsCount: car.tripsCount ?? 0,
    createdAt: car.createdAt.toISOString(),
    updatedAt: car.updatedAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const { category, city, minPrice, maxPrice, search, featured, status, startDate, endDate } = req.query;
    const conditions: SQL[] = [];

    if (category) conditions.push(eq(carsTable.category, category as string));
    if (city) conditions.push(ilike(carsTable.city, `%${city}%`));
    if (status) conditions.push(eq(carsTable.status, status as string));
    if (featured === "true") conditions.push(eq(carsTable.featured, true));
    if (minPrice) conditions.push(gte(carsTable.pricePerDay, minPrice as string));
    if (maxPrice) conditions.push(lte(carsTable.pricePerDay, maxPrice as string));
    if (search) conditions.push(ilike(carsTable.title, `%${search}%`));

    let cars = conditions.length > 0
      ? await db.select().from(carsTable).where(and(...conditions))
      : await db.select().from(carsTable);

    // Filter by availability if dates provided
    if (startDate && endDate) {
      const bookedCarIds = await db.select({ carId: bookingsTable.carId }).from(bookingsTable).where(
        and(
          or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "active"), eq(bookingsTable.status, "pending")),
          lte(bookingsTable.startDate, endDate as string),
          gte(bookingsTable.endDate, startDate as string),
        )
      );
      const bookedIds = new Set(bookedCarIds.map(b => b.carId));
      cars = cars.filter(c => !bookedIds.has(c.id));
    }

    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching cars");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch cars" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const cars = await db.select().from(carsTable);
    const active = cars.filter(c => c.status === "active");
    const bookings = await db.select().from(bookingsTable);
    const revenue = bookings
      .filter(b => b.status === "completed")
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);

    res.json({
      total: cars.length,
      active: active.length,
      featured: cars.filter(c => c.featured).length,
      cities: [...new Set(cars.map(c => c.city))],
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === "confirmed" || b.status === "active").length,
      completedRevenue: revenue,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching stats");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const cars = await db.select().from(carsTable).where(
      and(eq(carsTable.featured, true), eq(carsTable.status, "active"))
    );
    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching featured cars");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, city } = req.query;
    let cars;
    if (city) {
      cars = await db.select().from(carsTable).where(
        and(ilike(carsTable.city, `%${city}%`), eq(carsTable.status, "active"))
      );
    } else {
      cars = await db.select().from(carsTable).where(eq(carsTable.status, "active"));
    }
    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching nearby cars");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, parseInt(req.params.id)));
    if (!car) return res.status(404).json({ error: "not_found", message: "Auto no encontrado" });
    res.json(carToApi(car));
  } catch (err) {
    req.log.error({ err }, "Error fetching car");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/cars/:id/availability — booked ranges + host-blocked dates
router.get("/:id/availability", async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    if (isNaN(carId)) return res.status(400).json({ error: "bad_request" });

    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, carId));
    if (!car) return res.status(404).json({ error: "not_found" });

    const bookings = await db.select({
      startDate: bookingsTable.startDate,
      endDate: bookingsTable.endDate,
    }).from(bookingsTable).where(
      and(
        eq(bookingsTable.carId, carId),
        or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "active"), eq(bookingsTable.status, "pending")),
      )
    );

    res.json({
      bookedRanges: bookings,
      blockedDates: (car.blockedDates as string[]) ?? [],
      minDays: car.minDays ?? 1,
      maxDays: car.maxDays ?? 30,
      cancellationPolicy: car.cancellationPolicy ?? "moderate",
    });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const body = req.body;

    // Force the host id to the authenticated user — clients can't impersonate.
    const incomingHost = body.host ?? body.seller ?? {};
    const host = {
      id: userId,
      name: incomingHost.name ?? req.auth?.email ?? "Anfitrión",
      phone: incomingHost.phone ?? "",
      ...(incomingHost.whatsapp ? { whatsapp: incomingHost.whatsapp } : {}),
    };

    const [car] = await db.insert(carsTable).values({
      title: body.title,
      pricePerDay: body.pricePerDay?.toString() ?? body.price?.toString() ?? "0",
      depositAmount: body.depositAmount?.toString() ?? "0",
      lat: body.location?.lat?.toString() ?? "19.4326",
      lng: body.location?.lng?.toString() ?? "-99.1332",
      address: body.address ?? "",
      city: body.city ?? "",
      images: body.images ?? [],
      specs: body.specs,
      description: body.description ?? "",
      host,
      hostUserId: userId,
      features: body.features ?? [],
      tags: body.tags ?? [],
      category: body.category ?? "economico",
      // New host listings start in "pending_review" until admin approves them.
      status: req.auth?.role === "admin" ? (body.status ?? "active") : "pending_review",
      featured: req.auth?.role === "admin" ? (body.featured ?? false) : false,
      badge: body.badge ?? null,
      instantBook: body.instantBook ?? true,
      fuelPolicy: body.fuelPolicy ?? "full_to_full",
      cleaningFee: body.cleaningFee?.toString() ?? "0",
      cancellationPolicy: ["flexible", "moderate", "strict"].includes(body.cancellationPolicy)
        ? body.cancellationPolicy
        : "moderate",
      blockedDates: Array.isArray(body.blockedDates) ? body.blockedDates : [],
    } as any).returning();
    res.status(201).json(carToApi(car));
  } catch (err) {
    req.log.error({ err }, "Error creating car");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.auth!.userId;
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, id));
    if (!car) return res.status(404).json({ error: "not_found" });
    if (car.hostUserId !== userId && req.auth?.role !== "admin" && req.auth?.userId !== "admin-key" && req.auth?.userId !== "admin-legacy") {
      return res.status(403).json({ error: "forbidden", message: "Solo el anfitrión o un admin pueden eliminar este auto" });
    }
    await db.delete(carsTable).where(eq(carsTable.id, id));
    res.json({ success: true, deletedId: id });
  } catch (err) {
    req.log.error({ err }, "Error deleting car");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/:id/favorite", requireAuth, async (req, res) => {
  try {
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, parseInt(req.params.id)));
    if (!car) return res.status(404).json({ error: "not_found" });
    const [updated] = await db.update(carsTable)
      .set({ isFavorited: !car.isFavorited, updatedAt: new Date() })
      .where(eq(carsTable.id, parseInt(req.params.id)))
      .returning();
    res.json({ isFavorited: updated.isFavorited });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

// PUT /api/cars/:id/blocked-dates — host updates their car's blocked dates
router.put("/:id/blocked-dates", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const { blockedDates } = req.body;
    if (!Array.isArray(blockedDates)) {
      return res.status(400).json({ error: "bad_request", message: "blockedDates debe ser un array de fechas YYYY-MM-DD" });
    }
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, id));
    if (!car) return res.status(404).json({ error: "not_found" });
    if (car.hostUserId !== req.auth!.userId && req.auth?.role !== "admin") {
      return res.status(403).json({ error: "forbidden", message: "Solo el anfitrión puede modificar disponibilidad" });
    }
    const cleaned = blockedDates
      .filter((d: unknown) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .slice(0, 730); // cap at ~2 years of dates
    const [updated] = await db.update(carsTable)
      .set({ blockedDates: cleaned as any, updatedAt: new Date() })
      .where(eq(carsTable.id, id))
      .returning();
    res.json({ id, blockedDates: updated.blockedDates ?? [] });
  } catch (err) {
    req.log.error({ err }, "Error updating blocked dates");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
