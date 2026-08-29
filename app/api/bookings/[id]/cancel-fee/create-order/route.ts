import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { getOwnerCancellationStatus } from "@/lib/cancellationPolicy";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== "REQUESTED" && booking.status !== "ACCEPTED") {
    return NextResponse.json({ error: "This booking can't be cancelled anymore" }, { status: 400 });
  }

  const feeStatus = await getOwnerCancellationStatus(user.id);
  if (!feeStatus.feeRequired) {
    return NextResponse.json({ error: "No fee required — use the normal cancel action instead" }, { status: 400 });
  }

  try {
    const order = await razorpay.orders.create({
      amount: feeStatus.feeAmount,
      currency: "INR",
      notes: { bookingId: booking.id, purpose: "cancellation_fee" },
    });
    return NextResponse.json({ razorpayOrderId: order.id, amount: feeStatus.feeAmount });
  } catch (err) {
    console.error("Failed to create cancellation fee order:", err);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}