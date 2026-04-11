import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { carsTable, bookingsTable } from "@workspace/db/schema";
import { eq, ilike, gte, lte, and, type SQL, or, not } from "drizzle-orm";

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

// GET /api/cars/:id/availability — check booked dates
router.get("/:id/availability", async (req, res) => {
  try {
    const bookings = await db.select({
      startDate: bookingsTable.startDate,
      endDate: bookingsTable.endDate,
    }).from(bookingsTable).where(
      and(
        eq(bookingsTable.carId, parseInt(req.params.id)),
        or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "active"), eq(bookingsTable.status, "pending")),
      )
    );
    res.json({ bookedRanges: bookings });
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
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
      host: body.host ?? body.seller ?? { id: "host-001", name: "Anfitrión", phone: "" },
      features: body.features ?? [],
      tags: body.tags ?? [],
      category: body.category ?? "economico",
      status: body.status ?? "active",
      featured: body.featured ?? false,
      badge: body.badge ?? null,
      instantBook: body.instantBook ?? true,
      fuelPolicy: body.fuelPolicy ?? "full_to_full",
      cleaningFee: body.cleaningFee?.toString() ?? "0",
    }).returning();
    res.status(201).json(carToApi(car));
  } catch (err) {
    req.log.error({ err }, "Error creating car");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== "autos") {
      return res.status(403).json({ error: "forbidden", message: "Clave de admin inválida" });
    }
    const id = parseInt(req.params.id);
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, id));
    if (!car) return res.status(404).json({ error: "not_found" });
    await db.delete(carsTable).where(eq(carsTable.id, id));
    res.json({ success: true, deletedId: id });
  } catch (err) {
    req.log.error({ err }, "Error deleting car");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/:id/favorite", async (req, res) => {
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

export default router;
