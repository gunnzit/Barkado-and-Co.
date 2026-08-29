import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}`)
    .digest("hex");
  if (expected !== parsed.data.razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const purchase = await prisma.sponsorshipPurchase.findFirst({
    where: { razorpayOrderId: parsed.data.razorpay_order_id, providerId: provider.id },
  });
  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  if (purchase.paidAt) {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  // Extending an active sponsorship adds to the remaining time rather than
  // resetting it — buying another week while 3 days are left gives you 10,
  // not a fresh 7.
  const base = provider.sponsoredUntil && provider.sponsoredUntil.getTime() > Date.now()
    ? provider.sponsoredUntil
    : new Date();
  const newSponsoredUntil = new Date(base.getTime() + purchase.durationDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.sponsorshipPurchase.update({ where: { id: purchase.id }, data: { paidAt: new Date() } }),
    prisma.provider.update({ where: { id: provider.id }, data: { sponsoredUntil: newSponsoredUntil } }),
  ]);

  return NextResponse.json({ success: true, sponsoredUntil: newSponsoredUntil });
}