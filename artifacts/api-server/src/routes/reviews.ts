import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, carsTable } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/:id/reviews", async (req, res) => {
  try {
    const carId = parseInt(req.params.id, 10);
    if (isNaN(carId)) return res.status(400).json({ error: "Bad Request", message: "Invalid car ID" });

    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.carId, carId))
      .orderBy(desc(reviewsTable.createdAt));

    const breakdown: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    let sum = 0;
    for (const r of reviews) {
      const rating = Math.round(parseFloat(String(r.rating)));
      const key = String(Math.min(5, Math.max(1, rating)));
      breakdown[key] = (breakdown[key] || 0) + 1;
      sum += parseFloat(String(r.rating));
    }

    const averageRating = reviews.length > 0 ? Math.round((sum / reviews.length) * 10) / 10 : 0;

    res.json({
      reviews: reviews.map(r => ({
        ...r,
        rating: parseFloat(String(r.rating)),
      })),
      averageRating,
      totalReviews: reviews.length,
      ratingBreakdown: breakdown,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Server Error", message: "Failed to fetch reviews" });
  }
});

router.post("/:id/reviews", async (req, res) => {
  try {
    const carId = parseInt(req.params.id, 10);
    if (isNaN(carId)) return res.status(400).json({ error: "Bad Request", message: "Invalid car ID" });

    const { reviewerName, rating, comment, bookingId, tripDays, tripCity } = req.body;

    if (!reviewerName || rating == null || !comment) {
      return res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
    }

    const [review] = await db.insert(reviewsTable).values({
      carId,
      reviewerId: "guest",
      reviewerName,
      rating: String(rating),
      comment,
      bookingId: bookingId ?? null,
      tripDays: tripDays ?? null,
      tripCity: tripCity ?? null,
    }).returning();

    const allReviews = await db
      .select({ rating: reviewsTable.rating })
      .from(reviewsTable)
      .where(eq(reviewsTable.carId, carId));

    const avg = allReviews.reduce((s, r) => s + parseFloat(String(r.rating)), 0) / allReviews.length;

    await db.update(carsTable)
      .set({
        rating: String(Math.round(avg * 10) / 10),
        reviewCount: allReviews.length,
      })
      .where(eq(carsTable.id, carId));

    res.status(201).json({
      ...review,
      rating: parseFloat(String(review.rating)),
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: "Server Error", message: "Failed to create review" });
  }
});

export default router;
