import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(addresses);
  } catch (err: any) {
    console.error("GET /api/addresses failed:", err);
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { label, fullAddress, googleMapsLink, receiverName, receiverPhone, isDefault } = await req.json();
    if (!fullAddress?.trim() || !receiverName?.trim() || !receiverPhone?.trim()) {
      return NextResponse.json({ error: "Address, receiver name, and phone are required" }, { status: 400 });
    }

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: label || "Home",
        fullAddress: fullAddress.trim(),
        googleMapsLink: googleMapsLink?.trim() || null,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        isDefault: !!isDefault,
      },
    });

    if (isDefault) {
      await prisma.user.update({
        where: { id: user.id },
        data: { address: address.fullAddress, phone: address.receiverPhone },
      });
    }

    return NextResponse.json(address, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/addresses failed:", err);
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}