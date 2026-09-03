import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const addSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  // Real, only meaningful if the product actually has color/size options.
  // Validated below against the product's own real option lists — never
  // trusted as an arbitrary string.
  selectedColor: z.string().optional(),
  selectedSize: z.string().optional(),
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
//
// NOTE — a real, known limitation: CartItem has a single @@unique
// constraint on [userId, productId], so there's only ever one cart row per
// product per user. If the product has color/size options and someone
// re-adds it with a DIFFERENT selection, this updates the existing row's
// selection (last choice wins) rather than creating a second cart line —
// there's no way to hold "Red" and "Blue" of the same product as separate
// lines simultaneously without widening that constraint in a future
// migration.
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

  // Real server-side validation — a selection is only valid if it's
  // actually one of the product's own real options.
  if (parsed.data.selectedColor && !product.colorOptions.includes(parsed.data.selectedColor)) {
    return NextResponse.json({ error: "Invalid color selection." }, { status: 400 });
  }
  if (parsed.data.selectedSize && !product.sizeOptions.includes(parsed.data.selectedSize)) {
    return NextResponse.json({ error: "Invalid size selection." }, { status: 400 });
  }
  if (product.colorOptions.length > 0 && !parsed.data.selectedColor) {
    return NextResponse.json({ error: "Please choose a color." }, { status: 400 });
  }
  if (product.sizeOptions.length > 0 && !parsed.data.selectedSize) {
    return NextResponse.json({ error: "Please choose a size." }, { status: 400 });
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: product.id } },
  });

  const item = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + parsed.data.quantity,
          selectedColor: parsed.data.selectedColor ?? existing.selectedColor,
          selectedSize: parsed.data.selectedSize ?? existing.selectedSize,
        },
      })
    : await prisma.cartItem.create({
        data: {
          userId: user.id,
          kind: "PRODUCT",
          productId: product.id,
          quantity: parsed.data.quantity,
          selectedColor: parsed.data.selectedColor,
          selectedSize: parsed.data.selectedSize,
        },
      });

  return NextResponse.json(item, { status: 201 });
}