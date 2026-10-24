import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { getPrivateDoc } from "@/lib/privateDocs";

// Serves a private verification document.
//   Provider:  GET ?i=0                      -> their own document #0
//   Admin:     GET ?providerId=...&i=0       -> that provider's document #0
// Anyone else gets 403. The document's real storage path is never sent to the browser.
export async function GET(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const index = Number(searchParams.get("i") ?? "0");
  const providerId = searchParams.get("providerId");
  if (!Number.isInteger(index) || index < 0) return NextResponse.json({ error: "Bad index" }, { status: 400 });

  const isAdmin = user.role === "ADMIN";
  const provider = providerId
    ? isAdmin
      ? await prisma.provider.findUnique({ where: { id: providerId } })
      : null
    : await prisma.provider.findUnique({ where: { userId: user.id } });

  if (!provider) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const stored = provider.verificationDocs[index];
  if (!stored) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Documents uploaded before the private store existed are full public URLs.
  if (stored.startsWith("http")) return NextResponse.redirect(stored);

  const result = await getPrivateDoc(stored);
  if (!result || result.statusCode !== 200) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}