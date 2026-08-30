import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().trim().min(1),
  pricesBySize: z.record(z.enum(["SMALL", "MEDIUM", "LARGE"]), z.number().int().positive()),
});

// Every size in pricesBySize must be one the provider actually grooms
// (Provider.groomingSizes) — enforced here, not just in the UI.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const givenSizes = Object.keys(parsed.data.pricesBySize);
  if (givenSizes.length === 0) {
    return NextResponse.json({ error: "Set a price for at least one size." }, { status: 400 });
  }
  const invalidSize = givenSizes.find((s) => !provider.groomingSizes.includes(s as any));
  if (invalidSize) {
    return NextResponse.json({ error: `You haven't enabled grooming for size: ${invalidSize}.` }, { status: 400 });
  }

  const pkg = await prisma.groomingPackage.create({
    data: { providerId: provider.id, name: parsed.data.name, pricesBySize: parsed.data.pricesBySize },
  });

  return NextResponse.json(pkg, { status: 201 });
}