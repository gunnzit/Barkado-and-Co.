import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  const { quantity } = await req.json();

  if (typeof quantity !== "number") {
    return NextResponse.json({ error: "quantity is required" }, { status: 400 });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (!existing) return NextResponse.json({ error: "Not in cart" }, { status: 404 });

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  }

  const item = await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  await prisma.cartItem.deleteMany({ where: { userId: user.id, productId } });
  return NextResponse.json({ success: true });
}