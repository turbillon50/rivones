import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { carsTable, bookingsTable, notificationsTable, reviewsTable, partnersTable, documentsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_KEY = "autos";

function requireAdmin(req: any, res: any, next: any) {
  if (req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

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
    specs: car.specs,
    description: car.description,
    host: car.host,
    features: (car.features as string[]) ?? [],
    tags: (car.tags as string[]) ?? [],
    category: car.category,
    status: car.status,
    featured: car.featured,
    badge: car.badge ?? null,
    instantBook: car.instantBook,
    deliveryAvailable: car.deliveryAvailable,
    rating: Number(car.rating ?? 5.0),
    reviewCount: car.reviewCount ?? 0,
    tripsCount: car.tripsCount ?? 0,
    createdAt: car.createdAt.toISOString(),
    updatedAt: car.updatedAt.toISOString(),
  };
}

router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const [cars, bookings, notifications, reviews, partners, documents] = await Promise.all([
      db.select().from(carsTable),
      db.select().from(bookingsTable),
      db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)),
      db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt)),
      db.select().from(partnersTable).orderBy(desc(partnersTable.createdAt)),
      db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt)),
    ]);

    const active = cars.filter(c => c.status === "active").length;
    const revenue = bookings
      .filter(b => b.status === "completed")
      .reduce((sum, b) => sum + Number(b.totalAmount ?? 0), 0);

    const byCity: Record<string, number> = {};
    for (const car of cars) {
      byCity[car.city] = (byCity[car.city] || 0) + 1;
    }

    const byCategory: Record<string, number> = {};
    for (const car of cars) {
      byCategory[car.category] = (byCategory[car.category] || 0) + 1;
    }

    const avgRating = cars.length > 0
      ? cars.reduce((s, c) => s + Number(c.rating ?? 0), 0) / cars.length
      : 0;

    res.json({
      stats: {
        totalCars: cars.length,
        activeCars: active,
        featuredCars: cars.filter(c => c.featured).length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === "pending").length,
        confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
        completedBookings: bookings.filter(b => b.status === "completed").length,
        cancelledBookings: bookings.filter(b => b.status === "cancelled").length,
        totalRevenue: revenue,
        totalNotifications: notifications.length,
        unreadNotifications: notifications.filter(n => !n.read).length,
        totalReviews: reviews.length,
        avgRating: Math.round(avgRating * 10) / 10,
        totalPartners: partners.length,
        pendingPartners: partners.filter(p => p.status === "pending").length,
        approvedPartners: partners.filter(p => p.status === "approved").length,
        totalDocuments: documents.length,
        pendingDocuments: documents.filter(d => d.status === "pending").length,
        byCity,
        byCategory,
      },
      cars: cars.map(carToApi),
      bookings: bookings.map(b => ({
        ...b,
        id: b.id.toString(),
        carId: b.carId?.toString(),
        pricePerDay: Number(b.pricePerDay ?? 0),
        subtotal: Number(b.subtotal ?? 0),
        totalAmount: Number(b.totalAmount ?? 0),
        serviceFee: Number(b.serviceFee ?? 0),
        cleaningFee: Number(b.cleaningFee ?? 0),
        insuranceFee: Number(b.insuranceFee ?? 0),
        depositAmount: Number(b.depositAmount ?? 0),
        createdAt: b.createdAt?.toISOString(),
        updatedAt: b.updatedAt?.toISOString(),
      })),
      notifications: notifications.map(n => ({
        id: n.id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        carId: n.carId?.toString(),
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
      reviews: reviews.map(r => ({
        id: r.id.toString(),
        carId: r.carId?.toString(),
        reviewerName: r.reviewerName,
        rating: Number(r.rating ?? 0),
        comment: r.comment,
        hostReply: r.hostReply,
        tripCity: r.tripCity,
        tripDays: r.tripDays,
        createdAt: r.createdAt.toISOString(),
      })),
      partners: partners.map(p => ({
        id: p.id.toString(),
        businessName: p.businessName,
        category: p.category,
        city: p.city,
        state: p.state,
        phone: p.phone,
        email: p.email,
        ownerName: p.ownerName,
        discountPercent: p.discountPercent,
        status: p.status,
        adFeePaid: p.adFeePaid,
        createdAt: p.createdAt.toISOString(),
      })),
      documents: documents.map(d => ({
        id: d.id.toString(),
        userId: d.userId,
        category: d.category,
        label: d.label,
        status: d.status,
        images: d.images,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching admin dashboard");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/export/:type", requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    let csvContent = "";
    let filename = "";

    if (type === "cars") {
      const cars = await db.select().from(carsTable);
      csvContent = "ID,Título,Precio/Día,Ciudad,Categoría,Estado,Rating,Viajes,Destacado,Reserva Instantánea,Creado\n";
      csvContent += cars.map(c =>
        `${c.id},"${c.title}",${c.pricePerDay},"${c.city}","${c.category}","${c.status}",${c.rating},${c.tripsCount},${c.featured},${c.instantBook},${c.createdAt.toISOString()}`
      ).join("\n");
      filename = "autospot_autos.csv";
    } else if (type === "bookings") {
      const bookings = await db.select().from(bookingsTable);
      csvContent = "ID,Auto ID,Nombre,Teléfono,Email,Fecha Inicio,Fecha Fin,Días,Total,Estado,Seguro,Creado\n";
      csvContent += bookings.map(b =>
        `${b.id},${b.carId},"${b.renterName ?? ''}","${b.renterPhone ?? ''}","${b.renterEmail ?? ''}",${b.startDate},${b.endDate},${b.days},${b.totalAmount},"${b.status}",${b.insuranceAdded},${b.createdAt?.toISOString()}`
      ).join("\n");
      filename = "autospot_reservas.csv";
    } else if (type === "reviews") {
      const reviews = await db.select().from(reviewsTable);
      csvContent = "ID,Auto ID,Nombre,Rating,Comentario,Ciudad,Días,Creado\n";
      csvContent += reviews.map(r =>
        `${r.id},${r.carId},"${r.reviewerName ?? ''}",${r.rating},"${(r.comment ?? '').replace(/"/g, '""')}","${r.tripCity ?? ''}",${r.tripDays ?? 0},${r.createdAt.toISOString()}`
      ).join("\n");
      filename = "autospot_resenas.csv";
    } else if (type === "partners") {
      const partners = await db.select().from(partnersTable);
      csvContent = "ID,Negocio,Categoría,Ciudad,Estado,Teléfono,Email,Dueño,Descuento %,Status,Fee Pagado,Creado\n";
      csvContent += partners.map(p =>
        `${p.id},"${p.businessName ?? ''}","${p.category ?? ''}","${p.city ?? ''}","${p.state ?? ''}","${p.phone ?? ''}","${p.email ?? ''}","${p.ownerName ?? ''}",${p.discountPercent ?? 0},"${p.status ?? ''}",${p.adFeePaid ?? false},${p.createdAt.toISOString()}`
      ).join("\n");
      filename = "autospot_socios.csv";
    } else if (type === "notifications") {
      const notifs = await db.select().from(notificationsTable);
      csvContent = "ID,Tipo,Título,Mensaje,Leído,Creado\n";
      csvContent += notifs.map(n =>
        `${n.id},"${n.type}","${(n.title ?? '').replace(/"/g, '""')}","${(n.message ?? '').replace(/"/g, '""')}",${n.read},${n.createdAt.toISOString()}`
      ).join("\n");
      filename = "autospot_avisos.csv";
    } else if (type === "documents") {
      const docs = await db.select().from(documentsTable);
      csvContent = "ID,User ID,Categoría,Label,Estado,Creado\n";
      csvContent += docs.map(d =>
        `${d.id},"${d.userId ?? ''}","${d.category ?? ''}","${d.label ?? ''}","${d.status ?? ''}",${d.createdAt.toISOString()}`
      ).join("\n");
      filename = "autospot_documentos.csv";
    } else if (type === "all") {
      const [cars, bookings, reviews, partners, notifs, docs] = await Promise.all([
        db.select().from(carsTable),
        db.select().from(bookingsTable),
        db.select().from(reviewsTable),
        db.select().from(partnersTable),
        db.select().from(notificationsTable),
        db.select().from(documentsTable),
      ]);

      csvContent = "=== AUTOS ===\n";
      csvContent += "ID,Título,Precio/Día,Ciudad,Categoría,Estado\n";
      csvContent += cars.map(c => `${c.id},"${c.title}",${c.pricePerDay},"${c.city}","${c.category}","${c.status}"`).join("\n");
      csvContent += "\n\n=== RESERVAS ===\n";
      csvContent += "ID,Auto ID,Nombre,Total,Estado,Inicio,Fin\n";
      csvContent += bookings.map(b => `${b.id},${b.carId},"${b.renterName ?? ''}",${b.totalAmount},"${b.status}",${b.startDate},${b.endDate}`).join("\n");
      csvContent += "\n\n=== RESEÑAS ===\n";
      csvContent += "ID,Auto ID,Nombre,Rating,Comentario\n";
      csvContent += reviews.map(r => `${r.id},${r.carId},"${r.reviewerName ?? ''}",${r.rating},"${(r.comment ?? '').replace(/"/g, '""')}"`).join("\n");
      csvContent += "\n\n=== SOCIOS ===\n";
      csvContent += "ID,Negocio,Ciudad,Estado,Status\n";
      csvContent += partners.map(p => `${p.id},"${p.businessName ?? ''}","${p.city ?? ''}","${p.state ?? ''}","${p.status ?? ''}"`).join("\n");
      csvContent += "\n\n=== AVISOS ===\n";
      csvContent += "ID,Tipo,Título,Mensaje\n";
      csvContent += notifs.map(n => `${n.id},"${n.type}","${n.title ?? ''}","${(n.message ?? '').replace(/"/g, '""')}"`).join("\n");
      csvContent += "\n\n=== DOCUMENTOS ===\n";
      csvContent += "ID,User ID,Categoría,Label,Estado\n";
      csvContent += docs.map(d => `${d.id},"${d.userId ?? ''}","${d.category ?? ''}","${d.label ?? ''}","${d.status ?? ''}"`).join("\n");

      filename = "autospot_expediente_completo.csv";
    } else {
      return res.status(400).json({ error: "invalid_type" });
    }

    const bom = "\uFEFF";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(bom + csvContent);
  } catch (err) {
    req.log.error({ err }, "Error exporting data");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/notifications", requireAdmin, async (req, res) => {
  try {
    const { type, title, message, carId } = req.body;
    if (!title || !message) return res.status(400).json({ error: "missing_fields" });
    const [notif] = await db.insert(notificationsTable).values({
      type: type ?? "system",
      title,
      message,
      carId: carId ? parseInt(carId) : null,
    }).returning();
    res.status(201).json(notif);
  } catch (err) {
    req.log.error({ err }, "Error creating notification");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const cars = await db.select().from(carsTable);
    const bookings = await db.select().from(bookingsTable);
    const active = cars.filter(c => c.status === "active").length;
    const revenue = bookings
      .filter(b => b.status === "completed")
      .reduce((sum, b) => sum + Number(b.totalAmount ?? 0), 0);

    const byCity: Record<string, number> = {};
    for (const car of cars) {
      byCity[car.city] = (byCity[car.city] || 0) + 1;
    }

    res.json({
      totalCars: cars.length,
      activeListing: active,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === "pending").length,
      featuredListings: cars.filter(c => c.featured).length,
      revenueThisMonth: revenue || 0,
      topCities: Object.entries(byCity)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching admin stats");
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/cars", requireAdmin, async (req, res) => {
  try {
    const cars = await db.select().from(carsTable);
    res.json(cars.map(carToApi));
  } catch (err) {
    req.log.error({ err }, "Error fetching admin cars");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/cars", requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const [car] = await db.insert(carsTable).values({
      title: b.title,
      pricePerDay: b.pricePerDay?.toString() ?? "0",
      depositAmount: b.depositAmount?.toString() ?? "0",
      lat: b.lat?.toString() ?? "19.4326",
      lng: b.lng?.toString() ?? "-99.1332",
      address: b.address ?? "",
      city: b.city ?? "",
      images: b.images ?? [],
      specs: b.specs ?? { brand: "", model: "", year: 2024, km: 0, transmission: "automatic", fuel: "gasoline" },
      description: b.description ?? "",
      host: b.host ?? { id: "admin", name: "Rivones", phone: "" },
      features: b.features ?? [],
      tags: b.tags ?? [],
      category: b.category ?? "economico",
      status: "active",
      featured: b.featured ?? false,
      badge: b.badge ?? null,
      instantBook: b.instantBook ?? true,
      deliveryAvailable: b.deliveryAvailable ?? false,
      deliveryFee: b.deliveryFee?.toString() ?? null,
      minDays: b.minDays ?? 1,
      maxDays: b.maxDays ?? 30,
      mileageLimit: b.mileageLimit ?? 300,
      fuelPolicy: b.fuelPolicy ?? "full_to_full",
      cleaningFee: b.cleaningFee?.toString() ?? "0",
    }).returning();
    res.status(201).json(carToApi(car));
  } catch (err) {
    req.log.error({ err }, "Error creating car from admin");
    res.status(500).json({ error: "internal_error" });
  }
});

router.put("/cars/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const b = req.body;
    const updates: any = { updatedAt: new Date() };
    if (b.title !== undefined) updates.title = b.title;
    if (b.pricePerDay !== undefined) updates.pricePerDay = b.pricePerDay.toString();
    if (b.depositAmount !== undefined) updates.depositAmount = b.depositAmount.toString();
    if (b.city !== undefined) updates.city = b.city;
    if (b.address !== undefined) updates.address = b.address;
    if (b.lat !== undefined) updates.lat = b.lat.toString();
    if (b.lng !== undefined) updates.lng = b.lng.toString();
    if (b.description !== undefined) updates.description = b.description;
    if (b.category !== undefined) updates.category = b.category;
    if (b.images !== undefined) updates.images = b.images;
    if (b.specs !== undefined) updates.specs = b.specs;
    if (b.features !== undefined) updates.features = b.features;
    if (b.tags !== undefined) updates.tags = b.tags;
    if (b.featured !== undefined) updates.featured = b.featured;
    if (b.instantBook !== undefined) updates.instantBook = b.instantBook;
    if (b.deliveryAvailable !== undefined) updates.deliveryAvailable = b.deliveryAvailable;
    if (b.deliveryFee !== undefined) updates.deliveryFee = b.deliveryFee?.toString() ?? null;
    if (b.minDays !== undefined) updates.minDays = b.minDays;
    if (b.maxDays !== undefined) updates.maxDays = b.maxDays;
    if (b.mileageLimit !== undefined) updates.mileageLimit = b.mileageLimit;
    if (b.cleaningFee !== undefined) updates.cleaningFee = b.cleaningFee.toString();
    if (b.host !== undefined) updates.host = b.host;
    if (b.badge !== undefined) updates.badge = b.badge;
    const [updated] = await db.update(carsTable).set(updates).where(eq(carsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(carToApi(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating car");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/cars/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    await db.delete(carsTable).where(eq(carsTable.id, id));
    res.json({ success: true, deletedId: id });
  } catch (err) {
    req.log.error({ err }, "Error deleting car");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/cars/:id/featured", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const { featured } = req.body;
    const [updated] = await db.update(carsTable).set({ featured: !!featured, updatedAt: new Date() }).where(eq(carsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(carToApi(updated));
  } catch (err) {
    req.log.error({ err }, "Error toggling featured");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/cars/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "bad_request" });
    const { status } = req.body;
    if (!["active", "rented", "paused"].includes(status)) {
      return res.status(400).json({ error: "bad_request" });
    }
    const [updated] = await db.update(carsTable).set({ status, updatedAt: new Date() }).where(eq(carsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(carToApi(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating status");
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/partners/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, rejectionReason } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }
    const updates: any = { status, updatedAt: new Date() };
    if (status === "approved") updates.approvedAt = new Date();
    if (status === "rejected" && rejectionReason) updates.rejectionReason = rejectionReason;
    const [updated] = await db.update(partnersTable).set(updates).where(eq(partnersTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/bookings/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["confirmed", "active", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }
    const [updated] = await db.update(bookingsTable).set({ status, updatedAt: new Date() }).where(eq(bookingsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
