import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Setting this address as default/active — real, and the only place
  // that writes to the real User.address field used everywhere else in
  // the app (headers, booking forms, etc.).
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
    prisma.user.update({ where: { id: user.id }, data: { address: address.fullAddress } }),
  ]);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ success: true });
}