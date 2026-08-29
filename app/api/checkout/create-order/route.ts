import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { computeServiceCommission } from "@/lib/commission";

// Computes the current cart total, opens a matching order on Razorpay, and
// records a local PENDING Order row linking the two. The client uses the
// returned razorpayOrderId to open the Razorpay Checkout widget.
export async function POST() {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });
    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      if (item.kind === "PRODUCT" && item.product) {
        return sum + item.product.price * item.quantity;
      }
      if (item.kind === "SERVICE") {
        // priceAmount on the cart item is the BASE price — the owner
        // actually pays base + 8% (split as selling-price markup +
        // separate maintenance fee, itemized in the cart UI).
        return sum + computeServiceCommission(item.priceAmount ?? 0).ownerTotalPaise;
      }
      return sum;
    }, 0);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Cart total is invalid" }, { status: 400 });
    }

    const localOrder = await prisma.order.create({
      data: { userId: user.id, status: "PENDING", totalAmount },
    });

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: totalAmount,
        currency: "INR",
        receipt: localOrder.id,
      });
    } catch (err) {
      console.error("[create-order] Razorpay order creation failed:", err);
      await prisma.order.delete({ where: { id: localOrder.id } });
      const detail = err instanceof Error ? err.message : "Unknown Razorpay error";
      return NextResponse.json({ error: `Could not create payment order: ${detail}` }, { status: 502 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: localOrder.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return NextResponse.json({
      localOrderId: updatedOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: "INR",
    });
  } catch (err) {
    console.error("[create-order] Unexpected error:", err);
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${detail}` }, { status: 500 });
  }
}