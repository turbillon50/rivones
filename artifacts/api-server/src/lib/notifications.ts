import { db } from "@workspace/db";
import { notificationsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { logger } from "./logger";

export type NotificationType =
  | "booking_request"
  | "booking_confirmed"
  | "booking_cancelled"
  | "payment_succeeded"
  | "payment_failed"
  | "trip_starting_tomorrow"
  | "message_received"
  | "review_received"
  | "kyc_status_changed"
  | "system";

interface DispatchInput {
  type: NotificationType;
  title: string;
  message: string;
  carId?: number | null;
  bookingId?: number | null;
  recipientUserId?: string | null;
  email?: string | null;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Rivones <onboarding@resend.dev>";
const PLATFORM_BASE_URL = process.env.PLATFORM_BASE_URL ?? "https://example.com";

/**
 * Persist a notification row + (optionally) send a transactional email.
 * Best-effort: never throws so the calling write path stays atomic.
 */
export async function dispatchNotification(input: DispatchInput): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      type: input.type,
      title: input.title,
      message: input.message,
      carId: input.carId ?? null,
      // Note: notificationsTable currently has no userId column. The admin UI
      // sees all notifications, and per-user filtering uses recipientUserId
      // when we add it. For now we just store globally.
    });
  } catch (err) {
    logger.warn({ err }, "failed to insert notification row");
  }

  // Resolve recipient email if not provided directly
  let toEmail = input.email ?? null;
  if (!toEmail && input.recipientUserId) {
    try {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, input.recipientUserId));
      toEmail = u?.email ?? null;
    } catch {}
  }

  if (resend && toEmail) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject: `Rivones · ${input.title}`,
        html: renderEmail(input),
      });
    } catch (err) {
      logger.warn({ err, type: input.type }, "failed to send notification email");
    }
  }
}

function renderEmail(input: DispatchInput): string {
  const cta = input.bookingId
    ? `${PLATFORM_BASE_URL}/booking/${input.bookingId}`
    : `${PLATFORM_BASE_URL}/explore`;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f1629;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:32px auto;background:#1a2744;border-radius:16px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#0f1629,#1a2744);padding:32px;text-align:center;">
      <h1 style="color:#e0e4ea;font-size:24px;margin:0;font-style:italic;font-weight:900;letter-spacing:0.05em;">RIVONES</h1>
      <div style="width:60px;height:2px;background:linear-gradient(90deg,transparent,#00d4ff,transparent);margin:10px auto 0;"></div>
    </td></tr>
    <tr><td style="padding:32px;">
      <h2 style="color:#e0e4ea;font-size:20px;margin:0 0 12px;">${escape(input.title)}</h2>
      <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;">${escape(input.message)}</p>
      <a href="${cta}" style="display:inline-block;background:linear-gradient(135deg,#00b8d9,#00d4ff);color:#0f1629;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px;">Ver en Rivones</a>
    </td></tr>
    <tr><td style="background:#0f1629;padding:18px;text-align:center;color:#475569;font-size:11px;">
      © ${new Date().getFullYear()} Rivones
    </td></tr>
  </table>
</body></html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
