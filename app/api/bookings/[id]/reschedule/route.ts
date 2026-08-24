import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { sendBookingEmail } from "@/lib/sendBookingEmail";

const schema = z.object({
  startTime: z.string(),
  endTime: z.string(),
});

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};

const RESCHEDULABLE = ["REQUESTED", "ACCEPTED"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { provider: { include: { user: true } }, pet: { select: { name: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!RESCHEDULABLE.includes(booking.status)) {
    return NextResponse.json({ error: "This booking can't be rescheduled anymore" }, { status: 400 });
  }

  const newStart = new Date(parsed.data.startTime);
  const newEnd = new Date(parsed.data.endTime);
  if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // Moving the time is a real change to what the provider agreed to, so it
  // goes back to REQUESTED with a fresh response window rather than staying
  // silently ACCEPTED at a time the provider never actually confirmed.
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      startTime: newStart,
      endTime: newEnd,
      status: "REQUESTED",
      requestExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendBookingEmail({
    type: "RESCHEDULED",
    to: booking.provider.user.email,
    recipientName: booking.provider.user.name,
    serviceLabel: SERVICE_LABEL[booking.type] ?? booking.type,
    otherPartyName: user.name,
    petName: booking.pet.name,
    newTime: newStart.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
  });

  return NextResponse.json(updated);
}