import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const orderId = event.payload.payment.entity.order_id;
    await prisma.booking.updateMany({
      where: { razorpayOrderId: orderId },
      data: { paidAt: new Date() },
    });
    await prisma.order.updateMany({
      where: { razorpayOrderId: orderId },
      data: { paidAt: new Date(), status: "PAID" },
    });
  }

  return NextResponse.json({ received: true });
}
