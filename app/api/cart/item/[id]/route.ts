import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// Removes a single cart row by its own id, regardless of kind. Used by the
// cart/checkout page's remove buttons. (Quantity changes on PRODUCT rows
// still go through /api/cart/[productId] — unchanged.)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.cartItem.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ success: true });
}