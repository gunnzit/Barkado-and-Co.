import { prisma } from "./prisma";
import { sendBookingEmail } from "./sendBookingEmail";
import { computeServiceCommission } from "./commission";
import { calculateEarnedPoints } from "./pawPoints";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};

// Converts a paid Order's current cart into real OrderItem/Booking records
// and clears the cart. Called from two places: the client-side verify route
// (right after the Razorpay Checkout widget reports success) and the
// Razorpay webhook (as a guaranteed backstop if the client never calls
// verify — e.g. the browser closes right after paying). Both paths can fire
// for the same order, so this checks order.status first and is a no-op if
// it's already PAID — never double-creates bookings or double-sends emails.
export async function finalizeRazorpayOrder(razorpayOrderId: string) {
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
    include: { user: true },
  });
  if (!order) return { success: false, reason: "order_not_found" as const };
  if (order.status === "PAID") return { success: true, alreadyProcessed: true as const };

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: order.userId },
    include: { product: true, provider: { include: { user: true } }, pet: true },
  });

  const paidAt = new Date();

  // PawPoints earned across the whole order — real product line prices
  // and real service booking base prices (priceAmount, before the
  // maintenance fee), summed into ONE ledger row per order rather than
  // one per line item. Simpler, and still fully traceable back to every
  // real item via order.items / order.bookings.
  //
  // NOTE: this is earning only. Clawback on refund/cancellation
  // (EARNED_REVERSED) is separate, not-yet-built work on the existing
  // cancellation/refund flow — flagged clearly, not silently assumed done.
  const totalEarnedPoints = cartItems.reduce((sum, item) => {
    if (item.kind === "PRODUCT" && item.product) {
      return sum + calculateEarnedPoints(item.product.price * item.quantity);
    }
    if (item.kind === "SERVICE") {
      return sum + calculateEarnedPoints(item.priceAmount ?? 0);
    }
    return sum;
  }, 0);

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt },
    }),
    ...(totalEarnedPoints > 0
      ? [
          prisma.pawPointsTransaction.create({
            data: {
              userId: order.userId,
              type: "EARNED",
              points: totalEarnedPoints,
              orderId: order.id,
            },
          }),
        ]
      : []),
    ...cartItems
      .filter((item) => item.kind === "PRODUCT" && item.product)
      .map((item) =>
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId!,
            quantity: item.quantity,
            priceAtPurchase: item.product!.price,
            // Real color/size selection, carried over from the cart item —
            // survives into order history even if the product's options
            // change later.
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
          },
        })
      ),
    ...cartItems
      .filter((item) => item.kind === "SERVICE")
      .map((item) => {
        const commission = computeServiceCommission(item.priceAmount ?? 0);
        return prisma.booking.create({
          data: {
            type: item.serviceType!,
            status: "REQUESTED",
            ownerId: order.userId,
            providerId: item.providerId!,
            petId: item.petId!,
            startTime: item.startTime!,
            endTime: item.endTime!,
            priceAmount: item.priceAmount ?? 0,
            maintenanceFeePaise: commission.maintenanceFeePaise,
            ownerTotalPaise: commission.ownerTotalPaise,
            providerPayoutPaise: commission.providerPayoutPaise,
            // Real grooming package/size snapshot, carried through from the
            // cart item — so the provider's Schedule and the owner's
            // booking history show exactly what was booked ("Base Bath &
            // Brush — Medium"), not just a price with no detail. Null for
            // every other service type.
            groomingPackageName: item.groomingPackageName,
            groomingSize: item.groomingSize,
            address: item.address,
            phone: item.phone,
            razorpayOrderId,
            paidAt,
            orderId: order.id,
            requestExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }),
    prisma.cartItem.deleteMany({ where: { userId: order.userId } }),
  ]);

  const serviceItems = cartItems.filter((item) => item.kind === "SERVICE" && item.provider && item.pet);
  await Promise.all(
    serviceItems.map((item) =>
      sendBookingEmail({
        type: "NEW_REQUEST",
        to: item.provider!.user.email,
        recipientName: item.provider!.user.name,
        serviceLabel: SERVICE_LABEL[item.serviceType!] ?? item.serviceType!,
        otherPartyName: order.user.name,
        petName: item.pet!.name,
      })
    )
  );

  return { success: true, alreadyProcessed: false as const };
}