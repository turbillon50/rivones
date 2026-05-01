import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, carsTable, bookingsTable } from "@workspace/db/schema";
import { eq, desc, and, or, isNotNull } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { dispatchNotification } from "../lib/notifications";

const router = Router();

const VISIBILITY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function isVisible(r: typeof reviewsTable.$inferSelect): boolean {
  if (r.visibleAt) return r.visibleAt.getTime() <= Date.now();
  // Legacy reviews without visibleAt are visible by default.
  return true;
}

router.get("/:id/reviews", optionalAuth, async (req, res) => {
  try {
    const carId = parseInt(req.params.id, 10);
    if (isNaN(carId)) return res.status(400).json({ error: "bad_request" });

    const all = await db
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.carId, carId), eq(reviewsTable.reviewerType, "renter")))
      .orderBy(desc(reviewsTable.createdAt));

    const reviews = all.filter(isVisible);

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
      reviews: reviews.map(r => ({ ...r, rating: parseFloat(String(r.rating)) })),
      averageRating,
      totalReviews: reviews.length,
      ratingBreakdown: breakdown,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching reviews");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/:id/reviews", requireAuth, async (req, res) => {
  try {
    const carId = parseInt(req.params.id, 10);
    if (isNaN(carId)) return res.status(400).json({ error: "bad_request" });

    const { rating, comment, bookingId, reviewerType } = req.body;
    const numericRating = parseFloat(String(rating));
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "invalid_rating" });
    }
    if (!comment || String(comment).trim().length < 10) {
      return res.status(400).json({ error: "comment_too_short", message: "El comentario debe tener al menos 10 caracteres" });
    }

    const type: "renter" | "host" = reviewerType === "host" ? "host" : "renter";

    // Must reference a completed booking the user participated in
    if (!bookingId) {
      return res.status(400).json({ error: "booking_required" });
    }
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parseInt(bookingId)));
    if (!booking || booking.carId !== carId) return res.status(404).json({ error: "booking_not_found" });
    if (booking.status !== "completed") return res.status(400).json({ error: "booking_not_completed" });

    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, carId));
    const userId = req.auth!.userId;
    const isRenter = booking.renterId === userId;
    const isHost = car?.hostUserId === userId;

    if (type === "renter" && !isRenter) return res.status(403).json({ error: "forbidden" });
    if (type === "host" && !isHost) return res.status(403).json({ error: "forbidden" });

    // Has the counterpart already submitted? If so, both reviews become visible now.
    const counterpartType = type === "renter" ? "host" : "renter";
    const [counterpart] = await db.select().from(reviewsTable).where(and(
      eq(reviewsTable.bookingId, parseInt(bookingId)),
      eq(reviewsTable.reviewerType, counterpartType),
    ));

    const visibleAt = counterpart
      ? new Date()
      : new Date(Date.now() + VISIBILITY_WINDOW_MS);

    const [review] = await db.insert(reviewsTable).values({
      carId,
      reviewerId: userId,
      reviewerName: req.body.reviewerName ?? req.auth?.email ?? "Usuario",
      reviewerType: type,
      rating: String(numericRating),
      comment: String(comment).substring(0, 2000),
      bookingId: parseInt(bookingId),
      tripDays: booking.days ?? null,
      tripCity: car?.city ?? null,
      visibleAt,
    }).returning();

    // If counterpart exists, flip their visibleAt to now too.
    if (counterpart) {
      await db.update(reviewsTable)
        .set({ visibleAt: new Date() })
        .where(eq(reviewsTable.id, counterpart.id));
    }

    // Recompute aggregate rating ONLY from visible renter reviews.
    const allRenterReviews = await db.select({ rating: reviewsTable.rating, visibleAt: reviewsTable.visibleAt })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.carId, carId), eq(reviewsTable.reviewerType, "renter")));
    const visibleRenter = allRenterReviews.filter(r => !r.visibleAt || r.visibleAt.getTime() <= Date.now());
    if (visibleRenter.length > 0) {
      const avg = visibleRenter.reduce((s, r) => s + parseFloat(String(r.rating)), 0) / visibleRenter.length;
      await db.update(carsTable)
        .set({ rating: String(Math.round(avg * 10) / 10), reviewCount: visibleRenter.length })
        .where(eq(carsTable.id, carId));
    }

    dispatchNotification({
      type: "review_received",
      title: "Nueva reseña",
      message: `Recibiste una reseña de ${review.rating} estrellas`,
      carId,
      bookingId: booking.id,
      recipientUserId: type === "renter" ? car?.hostUserId ?? null : booking.renterId,
    }).catch(() => {});

    res.status(201).json({ ...review, rating: parseFloat(String(review.rating)) });
  } catch (err) {
    req.log.error({ err }, "Error creating review");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
