import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.vaccination.findMany({
    where: { pet: { ownerId: user.id } },
    include: { pet: { select: { id: true, name: true } } },
    orderBy: { dateGiven: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { petId, vaccineName, type, dateGiven, nextDueDate } = body;

  if (!petId || !vaccineName || !dateGiven) {
    return NextResponse.json({ error: "petId, vaccineName, and dateGiven are required" }, { status: 400 });
  }

  // Confirm the pet actually belongs to this user before logging anything against it.
  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: user.id } });
  if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

  const entry = await prisma.vaccination.create({
    data: {
      petId,
      vaccineName,
      type: type === "MEDICINE" ? "MEDICINE" : "VACCINE",
      dateGiven: new Date(dateGiven),
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}