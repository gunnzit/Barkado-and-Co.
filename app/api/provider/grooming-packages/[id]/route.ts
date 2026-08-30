import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  pricesBySize: z.record(z.enum(["SMALL", "MEDIUM", "LARGE"]), z.number().int().positive()).optional(),
});

async function ownedPackage(userId: string, id: string) {
  const provider = await prisma.provider.findUnique({ where: { userId } });
  if (!provider) return null;
  const pkg = await prisma.groomingPackage.findUnique({ where: { id } });
  if (!pkg || pkg.providerId !== provider.id) return null;
  return pkg;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await ownedPackage(user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.groomingPackage.update({ where: { id }, data: parsed.data as any });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await ownedPackage(user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.groomingPackage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}