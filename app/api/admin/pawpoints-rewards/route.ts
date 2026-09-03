import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getOrCreateUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rewards = await prisma.pawPointsReward.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rewards);
}

const createSchema = z.discriminatedUnion("rewardType", [
  z.object({
    rewardType: z.literal("FLAT_DISCOUNT"),
    name: z.string().trim().min(1),
    description: z.string().trim().optional(),
    costPoints: z.number().int().positive(),
    discountValuePaise: z.number().int().positive(),
    applicableServiceType: z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"]).optional(),
  }),
  z.object({
    rewardType: z.literal("FREE_PRODUCT"),
    name: z.string().trim().min(1),
    description: z.string().trim().optional(),
    costPoints: z.number().int().positive(),
    productId: z.string(),
  }),
]);

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reward = await prisma.pawPointsReward.create({ data: parsed.data as any });
  return NextResponse.json(reward, { status: 201 });
}