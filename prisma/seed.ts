import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCTS = [
  { name: "Everyday Leash", category: "Walking", price: 49900, description: "Padded handle, 5ft nylon webbing", icon: "leash" },
  { name: "Adjustable Collar", category: "Walking", price: 34900, description: "Soft-lined, fits neck 30–45cm", icon: "collar" },
  { name: "Reflective Harness", category: "Walking", price: 89900, description: "No-pull design, visible at night", icon: "collar" },
  { name: "Poop Bag Roll (6-pack)", category: "Walking", price: 19900, description: "Biodegradable, unscented", icon: "leash" },
  { name: "Ceramic Food Bowl", category: "Feeding", price: 59900, description: "Non-slip base, dishwasher safe", icon: "bowl" },
  { name: "Slow Feeder Bowl", category: "Feeding", price: 74900, description: "Reduces gulping, easy to clean", icon: "bowl" },
  { name: "Rope Chew Toy", category: "Toys", price: 24900, description: "Durable cotton rope, cleans teeth", icon: "toy" },
  { name: "Squeaky Plush Toy", category: "Toys", price: 29900, description: "Soft plush with built-in squeaker", icon: "toy" },
  { name: "Puzzle Feeder Toy", category: "Toys", price: 64900, description: "Mental stimulation, slows eating", icon: "toy" },
  { name: "Cozy Pet Bed", category: "Comfort", price: 149900, description: "Machine washable, orthopedic foam", icon: "bed" },
  { name: "Rain Coat", category: "Comfort", price: 99900, description: "Waterproof, adjustable fit", icon: "bed" },
  { name: "Grooming Brush", category: "Comfort", price: 44900, description: "De-shedding, gentle on skin", icon: "bed" },
  { name: "Travel Carrier Bag", category: "Travel", price: 189900, description: "Airline-friendly, ventilated sides", icon: "carrier" },
  { name: "Car Seat Cover", category: "Travel", price: 129900, description: "Waterproof, non-slip backing", icon: "carrier" },
];

async function main() {
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
      console.log(`Created: ${p.name}`);
    } else {
      console.log(`Skipped (already exists): ${p.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
