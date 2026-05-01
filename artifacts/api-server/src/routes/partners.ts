import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { partnersTable } from "@workspace/db/schema";
import { eq, ilike, and, type SQL, desc } from "drizzle-orm";
import { requireAdmin, optionalAuth } from "../middleware/auth";

const router: IRouter = Router();

function partnerToPublic(p: typeof partnersTable.$inferSelect) {
  return {
    id: p.id.toString(),
    businessName: p.businessName,
    category: p.category,
    description: p.description,
    address: p.address,
    city: p.city,
    state: p.state,
    googleMapsUrl: p.googleMapsUrl,
    location: p.lat && p.lng ? { lat: Number(p.lat), lng: Number(p.lng) } : null,
    phone: p.phone,
    whatsapp: p.whatsapp,
    email: p.email,
    website: p.website,
    images: (p.images as string[]) ?? [],
    logo: p.logo,
    discountPercent: p.discountPercent,
    discountDescription: p.discountDescription,
    discountCode: p.discountCode,
    complementarios: p.complementarios,
    rating: Number(p.rating ?? 0),
    reviewCount: p.reviewCount ?? 0,
    featured: p.featured,
    status: p.status,
    createdAt: p.createdAt?.toISOString() ?? null,
  };
}

function partnerToAdmin(p: typeof partnersTable.$inferSelect) {
  return {
    ...partnerToPublic(p),
    ownerName: p.ownerName,
    ownerPhone: p.ownerPhone,
    ownerEmail: p.ownerEmail,
    conversionFee: p.conversionFee ? Number(p.conversionFee) : 5,
    adFeePaid: p.adFeePaid,
    adFeeAmount: p.adFeeAmount ? Number(p.adFeeAmount) : 20,
    rejectionReason: p.rejectionReason,
    approvedAt: p.approvedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
  };
}

function isAdminReq(req: any): boolean {
  // True when an admin auth context is attached. The actual gating happens
  // via requireAdmin on the mutation routes; this helper just decides whether
  // to expose admin-only fields on read endpoints.
  return req.auth?.role === "admin"
    || req.auth?.userId === "admin-key"
    || req.auth?.userId === "admin-legacy";
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, city, featured } = req.query;
    const admin = isAdminReq(req);
    const statusFilter = admin ? (req.query.status as string || "pending") : "approved";
    const conditions: SQL[] = [eq(partnersTable.status, statusFilter)];

    if (category && category !== "todos") {
      conditions.push(eq(partnersTable.category, category as string));
    }
    if (city) {
      conditions.push(ilike(partnersTable.city, `%${city}%`));
    }
    if (featured === "true") {
      conditions.push(eq(partnersTable.featured, true));
    }

    const partners = await db
      .select()
      .from(partnersTable)
      .where(and(...conditions))
      .orderBy(desc(partnersTable.featured), desc(partnersTable.createdAt));

    const mapper = admin ? partnerToAdmin : partnerToPublic;
    res.json(partners.map(mapper));
  } catch (err) {
    req.log.error({ err }, "Error fetching partners");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch partners" });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const [partner] = await db.select().from(partnersTable).where(eq(partnersTable.id, id));
    if (!partner) return res.status(404).json({ error: "not_found" });

    const admin = isAdminReq(req);
    const mapper = admin ? partnerToAdmin : partnerToPublic;
    if (!admin && partner.status !== "approved") {
      return res.status(404).json({ error: "not_found" });
    }
    res.json(mapper(partner));
  } catch (err) {
    req.log.error({ err }, "Error fetching partner");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      businessName, category, description, address, city, state,
      googleMapsUrl, lat, lng, phone, whatsapp, email, website,
      ownerName, ownerPhone, ownerEmail, images, logo,
      discountPercent, discountDescription, complementarios,
    } = req.body;

    if (!businessName || !category || !description || !address || !city || !state || !phone || !ownerName || !ownerPhone || !ownerEmail) {
      return res.status(400).json({ error: "bad_request", message: "Faltan campos obligatorios" });
    }

    const disc = Math.min(Math.max(Number(discountPercent) || 10, 5), 50);
    const discountCode = `AUTOSPOT-${businessName.replace(/[^A-Z0-9]/gi, "").substring(0, 4).toUpperCase()}${disc}`;

    const [partner] = await db.insert(partnersTable).values({
      businessName: String(businessName).substring(0, 200),
      category: String(category),
      description: String(description).substring(0, 2000),
      address: String(address).substring(0, 500),
      city: String(city).substring(0, 100),
      state: String(state).substring(0, 100),
      googleMapsUrl: googleMapsUrl ? String(googleMapsUrl).substring(0, 500) : null,
      lat: lat ? String(lat) : null,
      lng: lng ? String(lng) : null,
      phone: String(phone).substring(0, 20),
      whatsapp: whatsapp ? String(whatsapp).substring(0, 20) : null,
      email: email ? String(email).substring(0, 200) : null,
      website: website ? String(website).substring(0, 500) : null,
      ownerName: String(ownerName).substring(0, 200),
      ownerPhone: String(ownerPhone).substring(0, 20),
      ownerEmail: String(ownerEmail).substring(0, 200),
      images: Array.isArray(images) ? images.slice(0, 10) : [],
      logo: logo ? String(logo).substring(0, 500) : null,
      discountPercent: disc,
      discountDescription: discountDescription ? String(discountDescription).substring(0, 500) : null,
      discountCode,
      conversionFee: "5",
      adFeeAmount: "20",
      adFeePaid: false,
      complementarios: complementarios ? String(complementarios).substring(0, 500) : null,
      status: "pending",
    }).returning();

    res.status(201).json({ success: true, id: partner.id.toString(), status: "pending" });
  } catch (err) {
    req.log.error({ err }, "Error creating partner");
    res.status(500).json({ error: "internal_error", message: "Failed to create partner" });
  }
});

router.patch("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const [updated] = await db.update(partnersTable).set({
      status: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(partnersTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(partnerToAdmin(updated));
  } catch (err) {
    req.log.error({ err }, "Error approving partner");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const { reason } = req.body;
    const [updated] = await db.update(partnersTable).set({
      status: "rejected",
      rejectionReason: reason ? String(reason).substring(0, 500) : "No cumple con los requisitos",
      updatedAt: new Date(),
    }).where(eq(partnersTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(partnerToAdmin(updated));
  } catch (err) {
    req.log.error({ err }, "Error rejecting partner");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:id/featured", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const { featured } = req.body;
    const [updated] = await db.update(partnersTable).set({
      featured: !!featured,
      updatedAt: new Date(),
    }).where(eq(partnersTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(partnerToAdmin(updated));
  } catch (err) {
    req.log.error({ err }, "Error toggling featured");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/:id/ad-payment", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const [updated] = await db.update(partnersTable).set({
      adFeePaid: true,
      updatedAt: new Date(),
    }).where(eq(partnersTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(partnerToAdmin(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating ad payment");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const [deleted] = await db.delete(partnersTable).where(eq(partnersTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "not_found" });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting partner");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
