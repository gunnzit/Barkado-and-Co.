import { NextResponse } from "next/server";
import crypto from "crypto";
import { finalizeRazorpayOrder } from "@/lib/finalizeRazorpayOrder";

// Razorpay calls this directly from its own servers — no Clerk session, so
// this must NOT be behind the auth middleware. It exists as a guaranteed
// backstop: if a payment succeeds but the browser closes/crashes before the
// client-side /api/checkout/verify call completes, this is what still
// converts the paid order into real bookings instead of it silently sitting
// as PENDING forever with Razorpay holding the money.
//
// Uses the *webhook* secret configured in Razorpay Dashboard → Settings →
// Webhooks — a different value from RAZORPAY_KEY_SECRET.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const orderId: string | undefined =
      event.payload?.payment?.entity?.order_id ?? event.payload?.order?.entity?.id;

    if (orderId) {
      await finalizeRazorpayOrder(orderId);
    }
  }

  // Always 200 for events we don't act on — Razorpay retries on non-2xx,
  // and there's nothing to retry for events like payment.failed here.
  return NextResponse.json({ received: true });
}