import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  relationship: z.string().optional(),
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

  const contact = await prisma.emergencyContact.create({
    data: { petId: pet.id, ...parsed.data },
  });

  return NextResponse.json(contact, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pet = await prisma.pet.findFirst({ where: { id: resolvedParams.id, ownerId: user.id } });
  if (!pet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");
  if (!contactId) return NextResponse.json({ error: "contactId required" }, { status: 400 });

  const contact = await prisma.emergencyContact.findFirst({ where: { id: contactId, petId: pet.id } });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emergencyContact.delete({ where: { id: contactId } });
  return NextResponse.json({ success: true });
}