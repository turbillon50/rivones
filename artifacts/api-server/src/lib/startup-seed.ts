import { db } from "@workspace/db";
import { carsTable } from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";
import { logger } from "./logger";

const exampleCars = [
  {
    title: "Toyota Corolla Híbrido 2024",
    pricePerDay: "850", depositAmount: "3000",
    lat: "19.4326", lng: "-99.1332",
    address: "Condesa, Ciudad de México", city: "Ciudad de México",
    images: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80",
      "https://images.unsplash.com/photo-1583267746897-2cf415887172?w=800&q=80",
    ],
    video: null,
    specs: { brand: "Toyota", model: "Corolla Híbrido", year: 2024, km: 12000, transmission: "automatic", fuel: "hybrid", color: "Blanco Perla", doors: 4, horsepower: 140, engine: "1.8L Híbrido", seats: 5 },
    description: "Toyota Corolla Híbrido en excelente estado. Consumo ultra bajo, perfecto para ciudad y carretera. Apple CarPlay, cámara trasera, asientos de tela premium. Entrega en Condesa o aeropuerto CDMX.",
    host: { id: "demo-host-001", name: "Rivones Demo", phone: "+52 55 0000 0000", whatsapp: "+52 55 0000 0000", rating: 5.0, totalListings: 2, memberSince: "2025", avatar: null, responseTime: "menos de 1 hora", tripsCompleted: 0 },
    features: ["GPS", "Bluetooth", "CarPlay", "Cámara Trasera", "Híbrido", "Bajo Consumo"],
    tags: ["económico", "ciudad", "híbrido"],
    category: "economico", status: "active", featured: true, badge: "ejemplo",
    isFavorited: false, hasVideo: false, instantBook: true,
    deliveryAvailable: true, deliveryFee: "200",
    minDays: 1, maxDays: 30, mileageLimit: 300, fuelPolicy: "full_to_full",
    cleaningFee: "150", rating: "0", reviewCount: 0, tripsCount: 0,
  },
  {
    title: "Mazda CX-5 Signature 2023",
    pricePerDay: "1400", depositAmount: "5000",
    lat: "20.6597", lng: "-103.3496",
    address: "Providencia, Guadalajara", city: "Guadalajara",
    images: [
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
      "https://images.unsplash.com/photo-1551522435-a13afa10f103?w=800&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
    ],
    video: null,
    specs: { brand: "Mazda", model: "CX-5 Signature", year: 2023, km: 22000, transmission: "automatic", fuel: "gasoline", color: "Rojo Soul Crystal", doors: 5, horsepower: 256, engine: "2.5L Turbo", seats: 5 },
    description: "Mazda CX-5 Signature con motor turbo. Asientos de piel Nappa, Bose premium, Head-Up Display, tracción AWD. Perfecta para viajes en familia o negocios. Disponible en Guadalajara.",
    host: { id: "demo-host-001", name: "Rivones Demo", phone: "+52 55 0000 0000", whatsapp: "+52 55 0000 0000", rating: 5.0, totalListings: 2, memberSince: "2025", avatar: null, responseTime: "menos de 1 hora", tripsCompleted: 0 },
    features: ["GPS", "Bluetooth", "CarPlay", "Bose Audio", "AWD", "Head-Up Display", "Asientos de Piel"],
    tags: ["suv", "familia", "premium"],
    category: "suv", status: "active", featured: true, badge: "ejemplo",
    isFavorited: false, hasVideo: false, instantBook: true,
    deliveryAvailable: false, deliveryFee: null,
    minDays: 1, maxDays: 14, mileageLimit: 250, fuelPolicy: "full_to_full",
    cleaningFee: "250", rating: "0", reviewCount: 0, tripsCount: 0,
  },
];

export async function autoSeedIfEmpty(): Promise<void> {
  try {
    const [row] = await db.select({ total: count() }).from(carsTable);
    const total = row?.total ?? 0;

    if (total === 0) {
      logger.info("Database empty — adding 2 example cars");
      await db.insert(carsTable).values(exampleCars as any[]);
      logger.info("Example cars added successfully");
    } else {
      const hasDemoCars = await db.select({ total: count() }).from(carsTable).where(eq(carsTable.badge, "ejemplo"));
      const hasOldSeed = total > 0 && (hasDemoCars[0]?.total ?? 0) === 0;

      if (hasOldSeed) {
        logger.info({ total }, "Cleaning old seed data and replacing with 2 example cars...");
        await db.delete(carsTable);
        await db.insert(carsTable).values(exampleCars as any[]);
        logger.info("Old seed replaced with example cars");
      } else {
        logger.info({ total }, "Database has cars, skipping seed");
      }
    }
  } catch (err) {
    logger.error({ err }, "Auto-seed failed");
  }
}
