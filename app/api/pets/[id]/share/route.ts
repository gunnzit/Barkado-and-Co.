import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// Turn the public read-only PawPassport link on (POST) or off (DELETE).
// The link is a random, unguessable token; turning sharing off deletes it,
// so any old link or QR code stops working at once.

async function ownPet(id: string) {
  const user = await getOrCreateUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const pet = await prisma.pet.findFirst({ where: { id, ownerId: user.id }, select: { id: true, shareToken: true } });
  if (!pet) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { pet };
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { pet, error } = await ownPet(id);
  if (error) return error;
  if (pet.shareToken) return NextResponse.json({ shareToken: pet.shareToken });
  const updated = await prisma.pet.update({
    where: { id: pet.id },
    data: { shareToken: randomBytes(16).toString("base64url") },
    select: { shareToken: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { pet, error } = await ownPet(id);
  if (error) return error;
  await prisma.pet.update({ where: { id: pet.id }, data: { shareToken: null } });
  return NextResponse.json({ shareToken: null });
}
