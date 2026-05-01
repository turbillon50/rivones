import { Router, type IRouter } from "express";
import { getUncachableStripeClient, getStripePublishableKey, getStripeSecretKey } from "../lib/stripeClient";
import { db } from "@workspace/db";
import { bookingsTable, carsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { logger } from "../lib/logger";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { dispatchNotification } from "../lib/notifications";
import { calculateBookingPrice } from "../lib/booking-pricing";

const router: IRouter = Router();

const PLATFORM_BASE_URL = process.env.PLATFORM_BASE_URL ?? "https://rentamerapido.autos";

// GET /api/stripe/config — publishable key for the frontend
router.get("/config", async (_req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err) {
    logger.error({ err }, "Error getting Stripe config");
    res.status(500).json({ error: "stripe_unavailable" });
  }
});

// POST /api/stripe/create-payment-intent — rental payment, with Connect splits when host has account
router.post("/create-payment-intent", requireAuth, async (req, res) => {
  try {
    const { bookingId, currency = "mxn" } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "bad_request", message: "bookingId requerido" });
    }

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parseInt(bookingId)));
    if (!booking) return res.status(404).json({ error: "booking_not_found" });
    if (booking.renterId !== req.auth!.userId && req.auth?.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }

    // Re-derive the price from the source-of-truth fn so the client can't tamper with the amount.
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    if (!car) return res.status(404).json({ error: "car_not_found" });

    const pricing = calculateBookingPrice({
      pricePerDay: Number(car.pricePerDay),
      cleaningFee: Number(car.cleaningFee ?? 0),
      depositAmount: Number(car.depositAmount ?? 0),
      startDate: booking.startDate,
      endDate: booking.endDate,
      insuranceAdded: booking.insuranceAdded,
      deliveryFee: booking.deliveryRequested ? Number(car.deliveryFee ?? 0) : 0,
    });

    const stripe = await getUncachableStripeClient();

    const piParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(pricing.totalAmount * 100),
      currency,
      metadata: {
        type: "rental_payment",
        bookingId: String(booking.id),
        carId: String(car.id),
        renterId: booking.renterId,
        hostUserId: car.hostUserId ?? "",
      },
      automatic_payment_methods: { enabled: true },
      description: `Renta ${car.title} · Reserva #${booking.id}`,
    };

    // If the host has a Connect account ready, split funds at capture time.
    if (car.hostUserId) {
      const [host] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, car.hostUserId));
      if (host?.stripeAccountId && host.payoutsEnabled) {
        piParams.application_fee_amount = Math.round(pricing.platformFee * 100);
        piParams.transfer_data = { destination: host.stripeAccountId };
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(piParams);

    await db.update(bookingsTable).set({
      rentalPaymentIntentId: paymentIntent.id,
      rentalPaymentStatus: "pending",
      updatedAt: new Date(),
    }).where(eq(bookingsTable.id, booking.id));

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: pricing.totalAmount,
    });
  } catch (err: any) {
    logger.error({ err }, "Error creating payment intent");
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

// POST /api/stripe/create-deposit-hold — pre-authorize the security deposit
router.post("/create-deposit-hold", requireAuth, async (req, res) => {
  try {
    const { bookingId, currency = "mxn" } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "bad_request", message: "bookingId requerido" });
    }

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, parseInt(bookingId)));
    if (!booking) return res.status(404).json({ error: "booking_not_found" });
    if (booking.renterId !== req.auth!.userId && req.auth?.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }

    const amount = Number(booking.depositAmount ?? 0);
    if (amount <= 0) {
      return res.status(400).json({ error: "no_deposit_required", message: "Esta reserva no requiere depósito" });
    }

    const stripe = await getUncachableStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      capture_method: "manual",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        type: "deposit_hold",
        bookingId: String(booking.id),
      },
      description: `Depósito en garantía — Reserva #${booking.id}`,
    });

    await db.update(bookingsTable)
      .set({
        depositPaymentIntentId: paymentIntent.id,
        depositStatus: "pending_authorization",
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, booking.id));

    logger.info({ bookingId: booking.id, paymentIntentId: paymentIntent.id }, "Deposit hold created");
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

// POST /api/stripe/release-deposit/:bookingId
router.post("/release-deposit/:bookingId", requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!booking) return res.status(404).json({ error: "booking_not_found" });
    if (!booking.depositPaymentIntentId) {
      return res.status(400).json({ error: "no_deposit", message: "Esta reserva no tiene depósito registrado" });
    }

    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === "admin" || userId === "admin-key" || userId === "admin-legacy";
    const isHost = car?.hostUserId === userId;
    if (!isAdmin && !isHost) return res.status(403).json({ error: "forbidden" });

    const stripe = await getUncachableStripeClient();
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

// POST /api/stripe/capture-deposit/:bookingId
router.post("/capture-deposit/:bookingId", requireAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const { amountToCapture } = req.body;

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!booking) return res.status(404).json({ error: "booking_not_found" });
    if (!booking.depositPaymentIntentId) {
      return res.status(400).json({ error: "no_deposit" });
    }

    const stripe = await getUncachableStripeClient();
    const captureParams: any = {};
    if (amountToCapture) {
      captureParams.amount_to_capture = Math.round(amountToCapture * 100);
    }
    const captured = await stripe.paymentIntents.capture(booking.depositPaymentIntentId, captureParams);

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

// GET /api/stripe/deposit-status/:bookingId
router.get("/deposit-status/:bookingId", requireAuth, async (req, res) => {
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
  } catch {
    res.status(500).json({ error: "internal_error" });
  }
});

// ─── Stripe Connect (host payouts) ──────────────────────────────────────────

// POST /api/stripe/connect/onboard — create or refresh a Connect Express account onboarding link
router.post("/connect/onboard", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, userId));
    if (!user) return res.status(404).json({ error: "user_not_found", message: "Llama a /api/users/me primero" });

    const stripe = await getUncachableStripeClient();
    let accountId = user.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "MX",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { clerkUserId: userId },
      });
      accountId = account.id;
      await db.update(usersTable)
        .set({ stripeAccountId: accountId, updatedAt: new Date() })
        .where(eq(usersTable.clerkUserId, userId));
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${PLATFORM_BASE_URL}/profile?stripe=refresh`,
      return_url: `${PLATFORM_BASE_URL}/profile?stripe=connected`,
      type: "account_onboarding",
    });

    res.json({ url: link.url, accountId });
  } catch (err: any) {
    logger.error({ err }, "Error creating Connect onboarding link");
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

// GET /api/stripe/connect/status — check whether the user can receive payouts
router.get("/connect/status", requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, userId));
    if (!user?.stripeAccountId) {
      return res.json({ connected: false, payoutsEnabled: false });
    }

    const stripe = await getUncachableStripeClient();
    const acct = await stripe.accounts.retrieve(user.stripeAccountId);
    const payoutsEnabled = !!(acct.charges_enabled && acct.payouts_enabled && acct.details_submitted);

    if (payoutsEnabled !== user.payoutsEnabled) {
      await db.update(usersTable)
        .set({ payoutsEnabled, updatedAt: new Date() })
        .where(eq(usersTable.clerkUserId, userId));
    }

    res.json({
      connected: true,
      payoutsEnabled,
      accountId: user.stripeAccountId,
      requirements: acct.requirements?.currently_due ?? [],
    });
  } catch (err: any) {
    logger.error({ err }, "Error fetching Connect status");
    res.status(500).json({ error: "stripe_error", message: err.message });
  }
});

// ─── Webhook ────────────────────────────────────────────────────────────────

// POST /api/stripe/webhook — verify signature, handle payment lifecycle
router.post("/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn("STRIPE_WEBHOOK_SECRET not configured — rejecting webhook");
    return res.status(503).json({ error: "webhook_not_configured" });
  }
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "missing_signature" });
  }

  let event: Stripe.Event;
  try {
    const stripeSecretKey = await getStripeSecretKey();
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" as any });
    // req.body is a Buffer here because of the express.raw middleware in app.ts
    event = stripe.webhooks.constructEvent(req.body as unknown as Buffer, signature, secret);
  } catch (err: any) {
    logger.warn({ err: err.message }, "Webhook signature verification failed");
    return res.status(400).json({ error: "invalid_signature" });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = Number(pi.metadata?.bookingId);
        const type = pi.metadata?.type;
        if (!bookingId) break;

        if (type === "rental_payment") {
          const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
          if (!booking) break;
          await db.update(bookingsTable).set({
            rentalPaymentStatus: "paid",
            status: "confirmed",
            updatedAt: new Date(),
          }).where(eq(bookingsTable.id, bookingId));

          dispatchNotification({
            type: "booking_confirmed",
            title: "Reserva confirmada ✓",
            message: `Tu reserva #${bookingId} fue pagada y confirmada`,
            bookingId,
            recipientUserId: booking.renterId,
            email: booking.renterEmail ?? null,
          }).catch(() => {});
        } else if (type === "deposit_hold") {
          await db.update(bookingsTable).set({
            depositStatus: "authorized",
            updatedAt: new Date(),
          }).where(eq(bookingsTable.id, bookingId));
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = Number(pi.metadata?.bookingId);
        if (!bookingId) break;
        const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
        if (!booking) break;
        await db.update(bookingsTable).set({
          rentalPaymentStatus: "failed",
          status: "cancelled",
          updatedAt: new Date(),
        }).where(eq(bookingsTable.id, bookingId));

        dispatchNotification({
          type: "payment_failed",
          title: "Pago no procesado",
          message: `No pudimos cobrar tu reserva #${bookingId}. Intenta de nuevo o usa otra tarjeta.`,
          bookingId,
          recipientUserId: booking.renterId,
          email: booking.renterEmail ?? null,
        }).catch(() => {});
        break;
      }
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        const clerkUserId = acct.metadata?.clerkUserId;
        if (!clerkUserId) break;
        const payoutsEnabled = !!(acct.charges_enabled && acct.payouts_enabled && acct.details_submitted);
        await db.update(usersTable)
          .set({ payoutsEnabled, updatedAt: new Date() })
          .where(eq(usersTable.clerkUserId, clerkUserId));
        break;
      }
      default:
        // Silently ignore other events
        break;
    }
    res.json({ received: true });
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Webhook handler error");
    res.status(500).json({ error: "handler_error" });
  }
});

export default router;
