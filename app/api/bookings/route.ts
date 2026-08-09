import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const bookingSchema = z.object({
  providerId: z.string(),
  petId: z.string(),
  type: z.enum(["WALKING", "SITTING"]),
  startTime: z.string(),
  endTime: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// List bookings — as owner (mine) or as provider (bookings for me)
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });

  const bookings = await prisma.booking.findMany({
    where: provider ? { providerId: provider.id } : { ownerId: user.id },
    include: { pet: true, provider: { include: { user: true } }, owner: true },
    orderBy: { startTime: "desc" },
  });
  return NextResponse.json(bookings);
}

// Create a booking request (status = REQUESTED, payment happens after provider accepts)
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pet = await prisma.pet.findFirst({
    where: { id: parsed.data.petId, ownerId: user.id },
  });
  if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

  const provider = await prisma.provider.findUnique({
    where: { id: parsed.data.providerId },
  });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const start = new Date(parsed.data.startTime);
  const end = new Date(parsed.data.endTime);

  let priceAmount = 0;
  let isFreeFirstWalk = false;
  if (parsed.data.type === "WALKING") {
    const priorWalkCount = await prisma.booking.count({
      where: { petId: pet.id, type: "WALKING" },
    });
    if (priorWalkCount === 0) {
      isFreeFirstWalk = true;
      priceAmount = 0;
    } else {
      priceAmount = provider.pricePerWalk ?? 0;
    }
  } else {
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    priceAmount = (provider.pricePerSitDay ?? 0) * days;
  }

  const booking = await prisma.booking.create({
    data: {
      type: parsed.data.type,
      ownerId: user.id,
      providerId: provider.id,
      petId: pet.id,
      startTime: start,
      endTime: end,
      priceAmount,
      address: parsed.data.address,
      phone: parsed.data.phone,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}