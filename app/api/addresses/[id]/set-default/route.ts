import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    await prisma.address.update({ where: { id }, data: { isDefault: true } });
    await prisma.user.update({
      where: { id: user.id },
      data: { address: address.fullAddress, phone: address.receiverPhone },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PATCH /api/addresses/[id]/set-default failed:", err);
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}