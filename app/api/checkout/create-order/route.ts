import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { computeServiceCommission } from "@/lib/commission";
import { computeCartTotals } from "@/lib/checkoutPricing";
import { getPawPointsBalance } from "@/lib/pawPoints";

const bodySchema = z.object({
  couponCode: z.string().optional(),
  redeemPoints: z.number().nonnegative().optional(),
  deliveryInstructions: z.string().optional(),
  gateCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawBody = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { couponCode, redeemPoints, deliveryInstructions, gateCode } = parsed.data;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });
    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const productSubtotalPaise = cartItems.reduce((sum, item) => {
      if (item.kind === "PRODUCT" && item.product) return sum + item.product.price * item.quantity;
      return sum;
    }, 0);

    const serviceItems = cartItems.filter((i) => i.kind === "SERVICE");
    const serviceSellingPaise = serviceItems.reduce(
      (sum, i) => sum + computeServiceCommission(i.priceAmount ?? 0).sellingPricePaise,
      0
    );
    const maintenanceFeePaise = serviceItems.reduce(
      (sum, i) => sum + computeServiceCommission(i.priceAmount ?? 0).maintenanceFeePaise,
      0
    );

    const pawPointsBalance = await getPawPointsBalance(user.id);

    const totals = computeCartTotals({
      productSubtotalPaise,
      serviceSellingPaise,
      maintenanceFeePaise,
      couponCode: couponCode ?? null,
      redeemPoints: redeemPoints ?? 0,
      pawPointsBalance,
    });

    if (totals.grandTotalPaise <= 0) {
      return NextResponse.json({ error: "Order total is invalid" }, { status: 400 });
    }

    const localOrder = await prisma.order.create({
      data: {
        userId: user.id,
        status: "PENDING",
        totalAmount: totals.grandTotalPaise,
        couponCode: totals.couponValid ? couponCode!.trim().toUpperCase() : null,
        couponDiscountPaise: totals.couponDiscountPaise,
        deliveryFeePaise: totals.deliveryFeePaise,
        gstPaise: totals.gstPaise,
        pawPointsRedeemed: totals.actualPointsSpent,
        deliveryInstructions: deliveryInstructions?.trim() || null,
        gateCode: gateCode?.trim() || null,
      },
    });

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: totals.grandTotalPaise,
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
      amount: totals.grandTotalPaise,
      currency: "INR",
    });
  } catch (err) {
    console.error("[create-order] Unexpected error:", err);
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${detail}` }, { status: 500 });
  }
}