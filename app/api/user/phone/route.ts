import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { normalizeIndianMobile } from "@/lib/phone";

const schema = z.object({ phone: z.string().min(6) });

export async function PATCH(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a phone number" }, { status: 400 });

  const phone = normalizeIndianMobile(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { phone } });
  return NextResponse.json({ phone: updated.phone });
}