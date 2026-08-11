import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const photos = await prisma.heroPhoto.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(photos);
  } catch (err: any) {
    console.error("GET /api/hero-photos failed:", err);
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingCount = await prisma.heroPhoto.count({ where: { userId: user.id } });
    if (existingCount >= 3) {
      return NextResponse.json({ error: "You can upload up to 3 photos" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const blob = await put(`hero-photos/${user.id}-${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    const photo = await prisma.heroPhoto.create({
      data: { userId: user.id, url: blob.url },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/hero-photos failed:", err);
    return NextResponse.json({ error: err?.message || "Unknown server error" }, { status: 500 });
  }
}