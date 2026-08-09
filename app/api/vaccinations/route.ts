import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const vaccineSchema = z.object({
  petId: z.string(),
  vaccineName: z.string().min(1),
  dateGiven: z.string(), // ISO date
  nextDueDate: z.string(), // ISO date
});

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vaccinations = await prisma.vaccination.findMany({
    where: { pet: { ownerId: user.id } },
    include: { pet: true },
    orderBy: { nextDueDate: "asc" },
  });
  return NextResponse.json(vaccinations);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = vaccineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Confirm the pet belongs to this owner
  const pet = await prisma.pet.findFirst({
    where: { id: parsed.data.petId, ownerId: user.id },
  });
  if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

  const vaccination = await prisma.vaccination.create({
    data: {
      petId: parsed.data.petId,
      vaccineName: parsed.data.vaccineName,
      dateGiven: new Date(parsed.data.dateGiven),
      nextDueDate: new Date(parsed.data.nextDueDate),
    },
  });
  return NextResponse.json(vaccination, { status: 201 });
}
