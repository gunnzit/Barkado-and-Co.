import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Step 2 of launching a real campaign — verifies the payment signature
// server-side (never trust the client callback alone, same as the cart
// checkout verify route), confirms the order actually belongs to this
// campaign and this provider, then marks it paid. This is the moment the
// campaign becomes real (search-boost eligible, visible in History).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign || campaign.providerId !== provider.id || campaign.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Campaign/order mismatch" }, { status: 400 });
  }
  if (campaign.paidAt) {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  await prisma.campaign.update({ where: { id }, data: { paidAt: new Date() } });

  return NextResponse.json({ success: true });
}