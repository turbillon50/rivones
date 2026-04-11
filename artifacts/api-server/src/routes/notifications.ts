import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function notifToApi(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    carId: n.carId?.toString() ?? null,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const notifications = await db.select().from(notificationsTable)
      .orderBy(notificationsTable.createdAt);
    res.json(notifications.map(notifToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching notifications");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch notifications" });
  }
});

router.post("/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request", message: "Invalid ID" });

    const [n] = await db.update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.id, id))
      .returning();

    if (!n) return res.status(404).json({ error: "not_found", message: "Notification not found" });
    res.json(notifToApi(n));
  } catch (err) {
    req.log.error({ err }, "Error marking notification read");
    res.status(500).json({ error: "internal_error", message: "Failed to mark as read" });
  }
});

export default router;
