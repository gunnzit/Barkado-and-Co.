import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// Real, functioning promo code — 10% off, matches the "WELCOME10" offer shown on the homepage.
const PROMO_CODES: Record<string, number> = {
  WELCOME10: 0.1,
};

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const promoCode = typeof body.promoCode === "string" ? body.promoCode.trim().toUpperCase() : "";

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });
  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountRate = PROMO_CODES[promoCode] ?? 0;
  const totalAmount = Math.round(subtotal * (1 - discountRate));

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      totalAmount,
      items: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
        })),
      },
    },
  });

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: totalAmount,
    currency: "INR",
    receipt: order.id,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  // Clear the cart now that it's been converted into an order
  await prisma.cartItem.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({
    orderId: razorpayOrder.id,
    internalOrderId: order.id,
    amount: razorpayOrder.amount,
    keyId: process.env.RAZORPAY_KEY_ID,
    discountApplied: discountRate > 0,
  });
}
