import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { carsTable, usersTable, bookingsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, optionalAuth, getClerkUser } from "../middleware/auth";

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

/**
 * GET /api/users/me — current user's profile, lazily upserting the local
 * users row from Clerk on first call. Returns null fields when unauthenticated.
 */
router.get("/me", optionalAuth, async (req, res) => {
  if (!req.auth?.userId || req.auth.userId === "anon-dev") {
    return res.json({ id: null, name: null, email: null, avatar: null, memberSince: null });
  }
  try {
    const clerkUserId = req.auth.userId;
    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, clerkUserId));

    if (!user) {
      const clerkUser = await getClerkUser(clerkUserId);
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? req.auth.email ?? null;
      const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null;
      const role = (clerkUser?.publicMetadata as any)?.role ?? "renter";
      [user] = await db.insert(usersTable).values({
        clerkUserId,
        role,
        displayName: fullName,
        email,
        avatar: clerkUser?.imageUrl ?? null,
      }).returning();
    }

    res.json({
      id: user.clerkUserId,
      name: user.displayName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      phone: user.phone,
      licenseStatus: user.licenseStatus,
      ineStatus: user.ineStatus,
      stripeAccountId: user.stripeAccountId,
      payoutsEnabled: user.payoutsEnabled,
      blocked: user.blocked,
      memberSince: user.createdAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching /me");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { displayName, phone, role, rfc } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (typeof displayName === "string") updates.displayName = displayName.substring(0, 200);
    if (typeof phone === "string") updates.phone = phone.substring(0, 20);
    if (typeof rfc === "string") updates.rfc = rfc.substring(0, 13).toUpperCase();
    if (["renter", "host", "both"].includes(role)) updates.role = role;

    const [updated] = await db.update(usersTable)
      .set(updates)
      .where(eq(usersTable.clerkUserId, req.auth!.userId))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "user_not_found", message: "Llama a /me primero para inicializar tu perfil" });
    }
    res.json({ ok: true, user: { role: updated.role, displayName: updated.displayName, phone: updated.phone } });
  } catch (err) {
    req.log.error({ err }, "Error updating user");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/favorites", requireAuth, async (req, res) => {
  try {
    const cars = await db.select().from(carsTable).where(eq(carsTable.isFavorited, true));
    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching favorites");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/recent", optionalAuth, async (req, res) => {
  try {
    const cars = await db.select().from(carsTable).limit(6);
    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching recent cars");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/users/me/bookings — bookings I'm renting + bookings on my hosted cars
router.get("/me/bookings", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const myRented = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.renterId, userId))
      .orderBy(desc(bookingsTable.createdAt));

    const myCars = await db.select({ id: carsTable.id }).from(carsTable).where(eq(carsTable.hostUserId, userId));
    const myCarIds = new Set(myCars.map(c => c.id));
    const allBookings = myCarIds.size > 0
      ? await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt))
      : [];
    const hosted = allBookings.filter(b => myCarIds.has(b.carId));

    res.json({ rented: myRented, hosted });
  } catch (err) {
    req.log.error({ err }, "Error fetching me/bookings");
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/users/me/cars — cars I'm hosting
router.get("/me/cars", requireAuth, async (req, res) => {
  try {
    const cars = await db.select().from(carsTable)
      .where(eq(carsTable.hostUserId, req.auth!.userId))
      .orderBy(desc(carsTable.createdAt));
    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching me/cars");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
