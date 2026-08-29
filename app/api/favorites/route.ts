import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const toggleSchema = z
  .object({
    productId: z.string().optional(),
    providerId: z.string().optional(),
  })
  .refine((data) => (data.productId ? !data.providerId : !!data.providerId), {
    message: "Provide exactly one of productId or providerId",
  });

// Returns the current user's full wishlist — both favorited products and
// favorited providers in one call, since the wishlist page shows both
// together and the heart-toggle buttons need to know current state
// regardless of which type they're attached to.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      product: true,
      provider: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

// Toggle a single product or provider in/out of the current user's
// wishlist. One endpoint handles both add and remove — if a matching
// Favorite row already exists it's deleted, otherwise one is created.
// This is what both the heart icon (anywhere in the app) and the
// wishlist page's own "Remove" button call — same action either way,
// just triggered from different UI.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { productId, providerId } = parsed.data;

  const existing = await prisma.favorite.findFirst({
    where: {
      userId: user.id,
      ...(productId ? { productId } : { providerId }),
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: {
      userId: user.id,
      productId: productId ?? undefined,
      providerId: providerId ?? undefined,
    },
  });
  return NextResponse.json({ favorited: true });
}