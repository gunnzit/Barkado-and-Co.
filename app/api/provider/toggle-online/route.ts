import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const schema = z.object({ isAvailableNow: z.boolean() });

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { isAvailableNow: true } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  return NextResponse.json(provider);
}

export async function PATCH(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: { isAvailableNow: parsed.data.isAvailableNow },
  });

  return NextResponse.json({ isAvailableNow: updated.isAvailableNow });
}