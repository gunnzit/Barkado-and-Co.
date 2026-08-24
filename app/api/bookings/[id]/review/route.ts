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

  const booking = await prisma.booking.findUnique({ where: { id }, include: { review: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== "COMPLETED") return NextResponse.json({ error: "Booking isn't completed yet" }, { status: 400 });
  if (booking.review) return NextResponse.json({ error: "Already rated" }, { status: 400 });

  await prisma.review.create({
    data: { bookingId: booking.id, rating: parsed.data.rating, comment: parsed.data.comment },
  });

  const agg = await prisma.review.aggregate({
    where: { booking: { providerId: booking.providerId } },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.provider.update({
    where: { id: booking.providerId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
  });

  return NextResponse.json({ success: true });
}