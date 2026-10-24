import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Vercel rejects request bodies over 4.5MB before this code runs, so the limit
// sits just under it to give a clear message instead of a generic failure.
const MAX_SIZE = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are accepted" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image is too large (max 4MB). Try a smaller photo." }, { status: 400 });
  }

  // Profile photos are shown to customers, so this one stays in the public store.
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-60) || "photo";
  const blob = await put(`provider-photos/${provider.id}/${Date.now()}-${safeName}`, file, {
    access: "public",
  });

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: { photoUrl: blob.url },
  });

  return NextResponse.json({ photoUrl: updated.photoUrl });
}