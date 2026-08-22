import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { sendProviderApprovalEmail } from "@/lib/sendProviderApprovalEmail";

const schema = z.object({ verified: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getOrCreateUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.provider.findUnique({ where: { id }, include: { user: true } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const provider = await prisma.provider.update({
    where: { id },
    data: { verified: parsed.data.verified },
  });

  // Only fires on the false -> true transition, not on every toggle.
  if (parsed.data.verified && !before.verified) {
    await sendProviderApprovalEmail(before.user.email, before.user.name);
  }

  return NextResponse.json(provider);
}