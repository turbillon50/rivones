import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { carsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

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

router.get("/me", async (req, res) => {
  res.status(200).json({
    id: null,
    name: null,
    email: null,
    avatar: null,
    memberSince: null,
  });
});

router.get("/favorites", async (req, res) => {
  try {
    const cars = await db.select().from(carsTable).where(eq(carsTable.isFavorited, true));
    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching favorites");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch favorites" });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const cars = await db.select().from(carsTable).limit(6);
    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching recent cars");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch recent cars" });
  }
});

export default router;
