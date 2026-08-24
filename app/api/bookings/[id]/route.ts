import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { sendBookingEmail } from "@/lib/sendBookingEmail";

const statusSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: resolvedParams.id },
    include: {
      provider: { include: { user: true } },
      owner: true,
      pet: { select: { name: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isProvider = booking.provider.userId === user.id;
  const isOwner = booking.ownerId === user.id;
  if (!isProvider && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isOwner && !isProvider && parsed.data.status !== "CANCELLED") {
    return NextResponse.json({ error: "Owners may only cancel" }, { status: 403 });
  }

  const updated = await prisma.booking.update({
    where: { id: resolvedParams.id },
    data: { status: parsed.data.status },
  });

  // Notify the owner on the transitions that actually matter to them.
  // sendBookingEmail never throws — a missing key or a Resend hiccup logs
  // and moves on, it never fails the status update itself. Awaited (not
  // fire-and-forget) so the serverless function doesn't exit before the
  // send completes.
  const serviceLabel = SERVICE_LABEL[booking.type] ?? booking.type;
  const emailType =
    parsed.data.status === "ACCEPTED" ? "ACCEPTED" :
    parsed.data.status === "DECLINED" ? "DECLINED" :
    parsed.data.status === "COMPLETED" ? "COMPLETED" :
    null;

  if (emailType) {
    await sendBookingEmail({
      type: emailType,
      to: booking.owner.email,
      recipientName: booking.owner.name,
      serviceLabel,
      otherPartyName: booking.provider.user.name,
      petName: booking.pet.name,
    });
  }

  return NextResponse.json(updated);
}