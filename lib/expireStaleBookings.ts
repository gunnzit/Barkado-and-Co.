import { prisma } from "./prisma";
import { sendBookingEmail } from "./sendBookingEmail";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};

// Finds every REQUESTED booking whose response window has passed, flips it
// to EXPIRED, and emails the owner. Idempotent and cheap when there's
// nothing to expire — safe to call from page loads as well as the daily
// cron, since Vercel's Hobby plan can't run cron more than once a day.
export async function expireStaleBookings() {
  const stale = await prisma.booking.findMany({
    where: { status: "REQUESTED", requestExpiresAt: { lt: new Date() } },
    include: { owner: true, pet: { select: { name: true } }, provider: { include: { user: true } } },
  });
  if (stale.length === 0) return 0;

  await prisma.booking.updateMany({
    where: { id: { in: stale.map((b) => b.id) } },
    data: { status: "EXPIRED" },
  });

  await Promise.all(
    stale.map((b) =>
      sendBookingEmail({
        type: "EXPIRED",
        to: b.owner.email,
        recipientName: b.owner.name,
        serviceLabel: SERVICE_LABEL[b.type] ?? b.type,
        otherPartyName: b.provider.user.name,
        petName: b.pet.name,
      })
    )
  );

  return stale.length;
}