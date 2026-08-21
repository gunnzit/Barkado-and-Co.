import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const addSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
});

// Returns every cart row for the signed-in user — both PRODUCT and SERVICE
// kinds — with the relations the checkout page needs to render each one
// (product details, or provider/pet details for a service-in-progress).
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: true,
      provider: { include: { user: { select: { name: true } } } },
      pet: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

// Add a product to cart, or bump quantity if it's already there.
// (Adding a SERVICE item goes through /api/cart/service instead.)
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: product.id } },
  });

  const item = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + parsed.data.quantity },
      })
    : await prisma.cartItem.create({
        data: { userId: user.id, kind: "PRODUCT", productId: product.id, quantity: parsed.data.quantity },
      });

  return NextResponse.json(item, { status: 201 });
}