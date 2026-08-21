import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const reportSchema = z.object({
  distanceKm: z.number().nonnegative().optional(),
  durationMin: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

// Submits a walk report for a WALKING booking and marks it COMPLETED in the
// same step — only the assigned provider can do this.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { provider: true, report: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.provider.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.report) {
    return NextResponse.json({ error: "Report already submitted" }, { status: 400 });
  }

  const [report] = await prisma.$transaction([
    prisma.walkReport.create({
      data: {
        bookingId: booking.id,
        distanceKm: parsed.data.distanceKm,
        durationMin: parsed.data.durationMin,
        notes: parsed.data.notes,
        photos: [],
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED" },
    }),
  ]);

  return NextResponse.json(report, { status: 201 });
}