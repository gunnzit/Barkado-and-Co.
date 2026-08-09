import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const statusSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

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
    include: { provider: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isProvider = booking.provider.userId === user.id;
  const isOwner = booking.ownerId === user.id;
  if (!isProvider && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Owners can only cancel; providers can accept/decline/progress/complete
  if (isOwner && !isProvider && parsed.data.status !== "CANCELLED") {
    return NextResponse.json({ error: "Owners may only cancel" }, { status: 403 });
  }

  const updated = await prisma.booking.update({
    where: { id: resolvedParams.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
