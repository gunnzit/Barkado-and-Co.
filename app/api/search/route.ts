import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SERVICE_KEYWORDS: { type: "WALKING" | "GROOMING" | "TRAINING" | "SITTING"; label: string; href: string; icon: string; words: string[] }[] = [
  { type: "WALKING", label: "Adventure Walk", href: "/walk-booking", icon: "paw", words: ["walk", "walking", "walker"] },
  { type: "GROOMING", label: "Luxury Spa Session", href: "/grooming", icon: "scissors", words: ["groom", "grooming", "spa", "bath", "brush"] },
  { type: "TRAINING", label: "Good Manners Programme", href: "/training", icon: "graduation", words: ["train", "training", "obedience", "manners"] },
  { type: "SITTING", label: "Home Staycation", href: "/sitting", icon: "home", words: ["sit", "sitting", "boarding", "staycation", "stay"] },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ products: [], services: [] });
  }

  const qLower = q.toLowerCase();

  const services = SERVICE_KEYWORDS.filter((s) => s.words.some((w) => w.includes(qLower) || qLower.includes(w)));

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 12,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price / 100,
      description: p.description ?? "",
      icon: p.icon ?? "toy",
      imageUrls: p.imageUrls,
    })),
    services,
  });
}