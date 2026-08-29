import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";

const SCOPES = ["WALKING", "SITTING", "GROOMING", "TRAINING", "HOMEPAGE"] as const;

// Single-category promotion is cheaper than the broader homepage tier,
// which counts as sponsored everywhere regardless of category.
const PRICING: Record<(typeof SCOPES)[number], Record<7 | 30, number>> = {
  WALKING: { 7: 5000, 30: 12000 },   // ₹50 / ₹120
  SITTING: { 7: 5000, 30: 12000 },
  GROOMING: { 7: 5000, 30: 12000 },
  TRAINING: { 7: 5000, 30: 12000 },
  HOMEPAGE: { 7: 12000, 30: 30000 }, // ₹120 / ₹300
};

const schema = z.object({
  scope: z.enum(SCOPES),
  durationDays: z.union([z.literal(7), z.literal(30)]),
});

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Can't promote a category you don't actually offer.
  if (parsed.data.scope !== "HOMEPAGE" && !provider.servicesOffered.includes(parsed.data.scope as any)) {
    return NextResponse.json({ error: "You don't offer this service" }, { status: 400 });
  }

  const amount = PRICING[parsed.data.scope][parsed.data.durationDays];

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      notes: { providerId: provider.id, purpose: "sponsorship", scope: parsed.data.scope, durationDays: String(parsed.data.durationDays) },
    });

    await prisma.sponsorshipPurchase.create({
      data: {
        providerId: provider.id,
        scope: parsed.data.scope,
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