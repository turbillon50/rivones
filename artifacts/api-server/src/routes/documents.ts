import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();

router.get("/", async (req, res) => {
  try {
    const userId = (req.query.userId as string) || "guest";
    const category = req.query.category as string | undefined;

    const conditions = [eq(documentsTable.userId, userId)];
    if (category) conditions.push(eq(documentsTable.category, category));

    const docs = await db
      .select()
      .from(documentsTable)
      .where(and(...conditions))
      .orderBy(desc(documentsTable.createdAt));

    res.json(docs);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Server Error", message: "Failed to fetch documents" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, bookingId, carId, category, label, notes, images } = req.body;

    if (!userId || !category || !label) {
      return res.status(400).json({ error: "Bad Request", message: "Missing required fields" });
    }

    const [doc] = await db.insert(documentsTable).values({
      userId,
      bookingId: bookingId ?? null,
      carId: carId ?? null,
      category,
      label,
      notes: notes ?? null,
      images: images ?? [],
      status: "pending",
    }).returning();

    res.status(201).json(doc);
  } catch (err) {
    console.error("Error creating document:", err);
    res.status(500).json({ error: "Server Error", message: "Failed to create document" });
  }
});

router.post("/upload-url", async (req, res) => {
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    res.json({ uploadURL });
  } catch (err) {
    console.error("Error generating upload URL:", err);
    res.status(500).json({ error: "Server Error", message: "Failed to generate upload URL" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Bad Request", message: "Invalid ID" });

    await db.delete(documentsTable).where(eq(documentsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: "Server Error", message: "Failed to delete document" });
  }
});

export default router;
