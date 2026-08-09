import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function POST() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });
  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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
  });
}
