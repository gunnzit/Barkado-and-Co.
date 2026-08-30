import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().trim().min(1),
  cadence: z.enum(["WEEKLY", "MONTHLY"]),
  pricePaise: z.number().int().positive(),
});

// A package can only be created under a cadence the provider has actually
// enabled (Provider.trainingCadences) — enforced here, not just in the UI,
// since the API is the real source of truth.
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

  if (!provider.trainingCadences.includes(parsed.data.cadence)) {
    return NextResponse.json({ error: `Enable ${parsed.data.cadence.toLowerCase()} plans before adding a package to it.` }, { status: 400 });
  }

  const pkg = await prisma.trainingPackage.create({
    data: { providerId: provider.id, ...parsed.data },
  });

  return NextResponse.json(pkg, { status: 201 });
}