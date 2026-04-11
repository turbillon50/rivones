import { Router, type IRouter } from "express";
import { getUncachableStripeClient, getStripePublishableKey } from "../lib/stripeClient";
import { db } from "@workspace/db";
import { bookingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /api/stripe/config — publishable key
router.get("/config", async (_req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err) {
    logger.error({ err }, "Error getting Stripe config");
    res.status(500).json({ error: "stripe_unavailable" });
  }
});

// POST /api/stripe/create-payment-intent — rental payment (captured immediately)
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "mxn", metadata = {} } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "bad_request", message: "amount required (in MXN)" });
    }

    const stripe = await getUncachableStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // centavos
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err: any) {
    logger.error({ err }, "Error creating payment intent");
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

// POST /api/stripe/create-deposit-hold — depósito en garantía (pre-autorización, NO se cobra)
router.post("/create-deposit-hold", async (req, res) => {
  try {
    const { bookingId, amount, currency = "mxn" } = req.body;

    if (!bookingId || !amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "bad_request", message: "bookingId y amount son requeridos" });
    }

    const stripe = await getUncachableStripeClient();

    // capture_method: "manual" = hold funds, NOT charged yet
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // centavos
      currency,
      capture_method: "manual",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        type: "deposit_hold",
        bookingId: String(bookingId),
      },
      description: `Depósito en garantía — Reserva #${bookingId}`,
    });

    // Save paymentIntentId in booking record
    await db.update(bookingsTable)
      .set({
        depositPaymentIntentId: paymentIntent.id,
        depositStatus: "pending_authorization",
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, parseInt(bookingId)));

    logger.info({ bookingId, paymentIntentId: paymentIntent.id }, "Deposit hold created");
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
    });
  } catch (err: any) {
    logger.error({ err }, "Error creating deposit hold");
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

// POST /api/stripe/release-deposit/:bookingId — liberar depósito (viaje terminó sin daños)
router.post("/release-deposit/:bookingId", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));

    if (!booking) return res.status(404).json({ error: "booking_not_found" });
    if (!booking.depositPaymentIntentId) {
      return res.status(400).json({ error: "no_deposit", message: "Esta reserva no tiene depósito registrado" });
    }

    const stripe = await getUncachableStripeClient();

    // Cancel the PaymentIntent = releases the hold, no charge
    const cancelled = await stripe.paymentIntents.cancel(booking.depositPaymentIntentId);

    await db.update(bookingsTable)
      .set({ depositStatus: "released", updatedAt: new Date() })
      .where(eq(bookingsTable.id, bookingId));

    logger.info({ bookingId, paymentIntentId: cancelled.id }, "Deposit hold released");
    res.json({ success: true, status: "released", paymentIntentId: cancelled.id });
  } catch (err: any) {
    logger.error({ err }, "Error releasing deposit");
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

// POST /api/stripe/capture-deposit/:bookingId — cobrar depósito (hubo daños)
router.post("/capture-deposit/:bookingId", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const { amountToCapture } = req.body; // optional: partial capture

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!booking) return res.status(404).json({ error: "booking_not_found" });
    if (!booking.depositPaymentIntentId) {
      return res.status(400).json({ error: "no_deposit", message: "Esta reserva no tiene depósito registrado" });
    }

    const stripe = await getUncachableStripeClient();

    const captureParams: Record<string, any> = {};
    if (amountToCapture) {
      captureParams.amount_to_capture = Math.round(amountToCapture * 100);
    }

    // Capture = charges the hold (for the damage amount)
    const captured = await stripe.paymentIntents.capture(
      booking.depositPaymentIntentId,
      captureParams
    );

    await db.update(bookingsTable)
      .set({ depositStatus: "captured", updatedAt: new Date() })
      .where(eq(bookingsTable.id, bookingId));

    logger.info({ bookingId, paymentIntentId: captured.id }, "Deposit captured for damages");
    res.json({ success: true, status: "captured", paymentIntentId: captured.id });
  } catch (err: any) {
    logger.error({ err }, "Error capturing deposit");
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

// GET /api/stripe/deposit-status/:bookingId — estado del depósito
router.get("/deposit-status/:bookingId", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!booking) return res.status(404).json({ error: "booking_not_found" });

    res.json({
      bookingId,
      depositAmount: booking.depositAmount,
      depositStatus: booking.depositStatus,
      depositPaymentIntentId: booking.depositPaymentIntentId,
    });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
