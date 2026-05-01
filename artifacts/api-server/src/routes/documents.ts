import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable, usersTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { dispatchNotification } from "../lib/notifications";

const router = Router();
const storage = new ObjectStorageService();

// GET /api/documents — list documents owned by the authenticated user (or all when admin).
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === "admin" || userId === "admin-key" || userId === "admin-legacy";
    const explicitUserId = req.query.userId as string | undefined;
    const targetUserId = isAdmin && explicitUserId ? explicitUserId : userId;
    const category = req.query.category as string | undefined;

    const conditions = [eq(documentsTable.userId, targetUserId)];
    if (category) conditions.push(eq(documentsTable.category, category));

    const docs = await db
      .select()
      .from(documentsTable)
      .where(and(...conditions))
      .orderBy(desc(documentsTable.createdAt));

    res.json(docs);
  } catch (err) {
    req.log.error({ err }, "Error fetching documents");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch documents" });
  }
});

// POST /api/documents — submit a document for review (KYC: license, INE).
router.post("/", requireAuth, async (req, res) => {
  try {
    const ownerId = req.auth!.userId;
    const { bookingId, carId, category, label, notes, images } = req.body;

    if (!category || !label) {
      return res.status(400).json({ error: "missing_fields", message: "category y label son requeridos" });
    }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "missing_images", message: "Debes adjuntar al menos una imagen" });
    }

    const [doc] = await db.insert(documentsTable).values({
      userId: ownerId,
      bookingId: bookingId ?? null,
      carId: carId ?? null,
      category: String(category).substring(0, 50),
      label: String(label).substring(0, 200),
      notes: notes ? String(notes).substring(0, 1000) : null,
      images: (images as string[]).slice(0, 6),
      status: "pending",
    }).returning();

    // Mirror the doc reference onto the user's KYC fields
    if (category === "license") {
      await db.update(usersTable).set({
        licenseStatus: "pending", licenseDocId: doc.id, updatedAt: new Date(),
      }).where(eq(usersTable.clerkUserId, ownerId));
    } else if (category === "ine") {
      await db.update(usersTable).set({
        ineStatus: "pending", ineDocId: doc.id, updatedAt: new Date(),
      }).where(eq(usersTable.clerkUserId, ownerId));
    }

    res.status(201).json(doc);
  } catch (err) {
    req.log.error({ err }, "Error creating document");
    res.status(500).json({ error: "internal_error", message: "Failed to create document" });
  }
});

// PATCH /api/documents/:id/status — admin approves or rejects KYC docs.
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const { status, notes } = req.body;
    if (!["verified", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!doc) return res.status(404).json({ error: "not_found" });

    const [updated] = await db.update(documentsTable)
      .set({ status, notes: notes ?? doc.notes, updatedAt: new Date() })
      .where(eq(documentsTable.id, id))
      .returning();

    // Sync user's KYC status when license/ine docs change
    if (doc.category === "license") {
      await db.update(usersTable).set({
        licenseStatus: status, updatedAt: new Date(),
      }).where(eq(usersTable.clerkUserId, doc.userId));
    } else if (doc.category === "ine") {
      await db.update(usersTable).set({
        ineStatus: status, updatedAt: new Date(),
      }).where(eq(usersTable.clerkUserId, doc.userId));
    }

    dispatchNotification({
      type: "kyc_status_changed",
      title: status === "verified" ? "Documento verificado ✓" : "Documento rechazado",
      message: status === "verified"
        ? `Tu ${doc.label} fue verificado. Ya puedes ${doc.category === "license" ? "reservar autos" : "publicar tu auto"}.`
        : `Tu ${doc.label} fue rechazado. ${notes ? `Motivo: ${notes}` : "Sube otra imagen más clara."}`,
      recipientUserId: doc.userId,
    }).catch(() => {});

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating document status");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/upload-url", requireAuth, async (req, res) => {
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    res.json({ uploadURL });
  } catch (err) {
    req.log.error({ err }, "Error generating upload URL");
    res.status(500).json({ error: "internal_error", message: "Failed to generate upload URL" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!doc) return res.status(404).send();
    if (doc.userId !== req.auth!.userId && req.auth?.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }
    await db.delete(documentsTable).where(eq(documentsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting document");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
