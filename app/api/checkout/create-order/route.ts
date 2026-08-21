import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const verifySchema = z.object({
  localOrderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Called after the Razorpay Checkout widget reports success. Verifies the
// payment signature server-side (never trust the client callback alone),
// then turns the cart into real records: OrderItem rows for accessories,
// Booking rows for services — all linked to the same Order — and clears
// the cart.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { localOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: localOrderId } });
  if (!order || order.userId !== user.id || order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }
  if (order.status === "PAID") {
    // Already processed (e.g. duplicate callback) — return success idempotently.
    return NextResponse.json({ success: true, orderId: order.id });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });

  const paidAt = new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt },
    }),
    ...cartItems
      .filter((item) => item.kind === "PRODUCT" && item.product)
      .map((item) =>
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId!,
            quantity: item.quantity,
            priceAtPurchase: item.product!.price,
          },
        })
      ),
    ...cartItems
      .filter((item) => item.kind === "SERVICE")
      .map((item) =>
        prisma.booking.create({
          data: {
            type: item.serviceType!,
            status: "REQUESTED",
            ownerId: user.id,
            providerId: item.providerId!,
            petId: item.petId!,
            startTime: item.startTime!,
            endTime: item.endTime!,
            priceAmount: item.priceAmount ?? 0,
            address: item.address,
            phone: item.phone,
            razorpayOrderId: razorpay_order_id,
            paidAt,
            orderId: order.id,
          },
        })
      ),
    prisma.cartItem.deleteMany({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ success: true, orderId: order.id });
}