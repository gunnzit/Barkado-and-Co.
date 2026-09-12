import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const createSchema = z.object({
  label: z.string().min(1),
  fullAddress: z.string().min(1),
  receiverName: z.string().min(1),
  receiverPhone: z.string().min(1),
  googleMapsLink: z.string().optional(),
});

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(addresses);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingCount = await prisma.address.count({ where: { userId: user.id } });

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      ...parsed.data,
      // First address a user ever adds becomes their default automatically.
      isDefault: existingCount === 0,
    },
  });

  // If this is the user's first address, it also becomes their real
  // active address string immediately — same rule as isDefault above.
  if (existingCount === 0) {
    await prisma.user.update({ where: { id: user.id }, data: { address: address.fullAddress } });
  }

  return NextResponse.json(address, { status: 201 });
}