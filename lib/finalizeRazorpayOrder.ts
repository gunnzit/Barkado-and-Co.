import { prisma } from "./prisma";
import { sendBookingEmail } from "./sendBookingEmail";
import { computeServiceCommission } from "./commission";

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