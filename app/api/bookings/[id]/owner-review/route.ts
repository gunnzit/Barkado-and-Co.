import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const schema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { provider: true, ownerReview: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.provider.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== "COMPLETED") return NextResponse.json({ error: "Booking isn't completed yet" }, { status: 400 });
  if (booking.ownerReview) return NextResponse.json({ error: "Already rated" }, { status: 400 });

  await prisma.ownerReview.create({
    data: { bookingId: booking.id, rating: parsed.data.rating, comment: parsed.data.comment },
  });

  const agg = await prisma.ownerReview.aggregate({
    where: { booking: { ownerId: booking.ownerId } },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.user.update({
    where: { id: booking.ownerId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
  });

  return NextResponse.json({ success: true });
}