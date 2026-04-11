import { Router, type IRouter } from "express";
import { sendWelcomeEmail } from "../lib/email";

const router: IRouter = Router();

const sentEmails = new Set<string>();
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

router.post("/welcome", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "missing_email", message: "Email is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (sentEmails.has(normalizedEmail)) {
      res.json({ success: true, message: "already_sent" });
      return;
    }

    const lastSent = rateLimitMap.get(normalizedEmail);
    if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
      res.status(429).json({ error: "rate_limited", message: "Too many requests" });
      return;
    }

    if (!process.env.RESEND_API_KEY) {
      req.log.warn("RESEND_API_KEY not configured, skipping welcome email");
      res.json({ success: true, message: "email_disabled" });
      return;
    }

    rateLimitMap.set(normalizedEmail, Date.now());
    const result = await sendWelcomeEmail(normalizedEmail, name || "");
    sentEmails.add(normalizedEmail);
    res.json({ success: true, id: result?.id });
  } catch (err) {
    req.log.error({ err }, "Error sending welcome email");
    res.status(500).json({ error: "email_error", message: "Failed to send welcome email" });
  }
});

export default router;
