import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";

const PRICING: Record<number, number> = {
  7: 5000,   // ₹50, in paise
  30: 12000, // ₹120, in paise
};

const schema = z.object({ durationDays: z.union([z.literal(7), z.literal(30)]) });

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const amount = PRICING[parsed.data.durationDays];

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      notes: { providerId: provider.id, purpose: "sponsorship", durationDays: String(parsed.data.durationDays) },
    });

    await prisma.sponsorshipPurchase.create({
      data: {
        providerId: provider.id,
        durationDays: parsed.data.durationDays,
        amount,
        razorpayOrderId: order.id,
      },
    });

    return NextResponse.json({ razorpayOrderId: order.id, amount });
  } catch (err) {
    console.error("Failed to create sponsorship order:", err);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}