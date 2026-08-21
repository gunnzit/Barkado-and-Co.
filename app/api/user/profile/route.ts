import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ phone: user.phone ?? null, address: user.address ?? null });
  } catch (err: any) {
    console.error("GET /api/user/profile failed:", err);
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { phone, address } = await req.json();
    const data: { phone?: string; address?: string } = {};
    if (typeof phone === "string" && phone.trim()) data.phone = phone.trim();
    if (typeof address === "string" && address.trim()) data.address = address.trim();

    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({ phone: updated.phone, address: updated.address });
  } catch (err: any) {
    console.error("PATCH /api/user/profile failed:", err);
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}