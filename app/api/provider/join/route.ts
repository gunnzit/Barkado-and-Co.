import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const joinSchema = z.object({
  servicesOffered: z.array(z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"])).min(1),
});

// Creates the Provider row with just the chosen services — no pricing here
// anymore (that's set later, after approval, via the dashboard's Services
// tab). New providers start unverified, pending admin review.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json(existing, { status: 200 });

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const provider = await prisma.provider.create({
    data: {
      userId: user.id,
      servicesOffered: parsed.data.servicesOffered,
    },
  });

  return NextResponse.json(provider, { status: 201 });
}