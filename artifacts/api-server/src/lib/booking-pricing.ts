/**
 * Single source of truth for booking price math.
 * Both POST /quote and POST /bookings call into this so the displayed price
 * always matches what gets persisted and charged.
 */
export interface PriceInput {
  pricePerDay: number;
  cleaningFee: number;
  depositAmount: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  insuranceAdded: boolean;
  deliveryFee?: number;
}

export interface PriceBreakdown {
  days: number;
  pricePerDay: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  insuranceFee: number;
  deliveryFee: number;
  depositAmount: number;
  totalAmount: number;
  // Host receives: subtotal + cleaning + delivery (NOT service or insurance)
  hostReceives: number;
  platformFee: number;
}

const SERVICE_FEE_RATE = 0.12;
const INSURANCE_RATE_PER_DAY = 0.18;

export function calculateBookingPrice(input: PriceInput): PriceBreakdown {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const subtotal = Math.round(input.pricePerDay * days);
  const cleaningFee = Math.round(input.cleaningFee || 0);
  const deliveryFee = Math.round(input.deliveryFee || 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const insuranceFee = input.insuranceAdded
    ? Math.round(input.pricePerDay * INSURANCE_RATE_PER_DAY * days)
    : 0;
  const totalAmount = subtotal + cleaningFee + deliveryFee + serviceFee + insuranceFee;

  // Service fee is the platform's cut. Insurance fee, when collected, also
  // belongs to the platform (it pays the underwriter). Everything else flows
  // to the host.
  const platformFee = serviceFee + insuranceFee;
  const hostReceives = totalAmount - platformFee;

  return {
    days,
    pricePerDay: input.pricePerDay,
    subtotal,
    cleaningFee,
    serviceFee,
    insuranceFee,
    deliveryFee,
    depositAmount: Math.round(input.depositAmount || 0),
    totalAmount,
    hostReceives,
    platformFee,
  };
}

/** Returns false if any host-blocked date falls inside [start, end] (inclusive). */
export function isCarAvailable(blockedDates: string[], startDate: string, endDate: string): boolean {
  if (!blockedDates || blockedDates.length === 0) return true;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  for (const d of blockedDates) {
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= start && t <= end) return false;
  }
  return true;
}
