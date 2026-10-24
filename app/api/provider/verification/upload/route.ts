import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { putPrivateDoc } from "@/lib/privateDocs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
// Vercel rejects request bodies over 4.5MB before this code even runs, so the
// limit here is set just under it to give a clear message instead of a generic failure.
const MAX_SIZE = 4 * 1024 * 1024;
const MAX_DOCS = 6;

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  if (provider.verificationDocs.length >= MAX_DOCS) {
    return NextResponse.json({ error: `You can upload up to ${MAX_DOCS} documents.` }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, or PDF files are accepted" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File is too large (max 4MB). Try a smaller photo." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-60) || "document";
  const blob = await putPrivateDoc(`verification-docs/${provider.id}/${safeName}`, file);

  // Stores the private PATHNAME (not a URL) — it only resolves through
  // /api/provider/verification/file, which checks who is asking.
  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      verificationDocs: { push: blob.pathname },
      verificationSubmittedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, count: updated.verificationDocs.length, index: updated.verificationDocs.length - 1 });
}