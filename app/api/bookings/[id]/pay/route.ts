import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: resolvedParams.id } });
  if (!booking || booking.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Booking not accepted yet" }, { status: 400 });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const order = await razorpay.orders.create({
    amount: booking.priceAmount, // paise
    currency: "INR",
    receipt: booking.id,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { razorpayOrderId: order.id },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID });
}
