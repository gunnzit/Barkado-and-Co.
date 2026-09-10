import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const updateSchema = z.object({
  notifyBookingUpdates: z.boolean().optional(),
  notifyVaccineReminders: z.boolean().optional(),
  notifyPromotions: z.boolean().optional(),
});

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    notifyBookingUpdates: user.notifyBookingUpdates,
    notifyVaccineReminders: user.notifyVaccineReminders,
    notifyPromotions: user.notifyPromotions,
  });
}

export async function PATCH(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return NextResponse.json({
    notifyBookingUpdates: updated.notifyBookingUpdates,
    notifyVaccineReminders: updated.notifyVaccineReminders,
    notifyPromotions: updated.notifyPromotions,
  });
}