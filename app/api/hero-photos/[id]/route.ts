import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photo = await prisma.heroPhoto.findUnique({ where: { id: params.id } });
  if (!photo || photo.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.heroPhoto.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}