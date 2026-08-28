import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { finalizeRazorpayOrder } from "@/lib/finalizeRazorpayOrder";

const verifySchema = z.object({
  localOrderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Called after the Razorpay Checkout widget reports success. Verifies the
// payment signature server-side (never trust the client callback alone),
// confirms the order actually belongs to this user, then delegates the
// actual cart-to-bookings conversion to finalizeRazorpayOrder — the same
// function the webhook calls, so there's exactly one place that logic lives.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { localOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: localOrderId } });
  if (!order || order.userId !== user.id || order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  const result = await finalizeRazorpayOrder(razorpay_order_id);
  if (!result.success) {
    return NextResponse.json({ error: "Could not finalize order" }, { status: 500 });
  }

  return NextResponse.json({ success: true, orderId: order.id });
}