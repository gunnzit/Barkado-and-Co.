import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  schedule: z.string().optional(),
  instructions: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pet = await prisma.pet.findFirst({ where: { id: resolvedParams.id, ownerId: user.id } });
  if (!pet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const medication = await prisma.medication.create({
    data: { petId: pet.id, ...parsed.data },
  });

  return NextResponse.json(medication, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pet = await prisma.pet.findFirst({ where: { id: resolvedParams.id, ownerId: user.id } });
  if (!pet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const medicationId = searchParams.get("medicationId");
  if (!medicationId) return NextResponse.json({ error: "medicationId required" }, { status: 400 });

  const medication = await prisma.medication.findFirst({ where: { id: medicationId, petId: pet.id } });
  if (!medication) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete via active:false rather than a real row delete, so a
  // removed medication doesn't silently vanish from any historical record
  // that might reference it later.
  await prisma.medication.update({ where: { id: medicationId }, data: { active: false } });
  return NextResponse.json({ success: true });
}