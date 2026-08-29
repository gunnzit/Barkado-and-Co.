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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED", cancelledBy: "OWNER", cancellationFeePaid: true },
  });

  return NextResponse.json(updated);
}