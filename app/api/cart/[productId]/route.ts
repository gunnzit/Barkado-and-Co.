import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const updateSchema = z.object({
  quantity: z.number().int().min(0),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: resolvedParams.productId } },
  });
  if (!existing) return NextResponse.json({ error: "Not in cart" }, { status: 404 });

  if (parsed.data.quantity === 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ deleted: true });
  }

  const updated = await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity: parsed.data.quantity },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.cartItem.deleteMany({
    where: { userId: user.id, productId: resolvedParams.productId },
  });
  return NextResponse.json({ deleted: true });
}
