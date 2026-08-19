// Corrected version — re-run this to fix service assignments from the first pass.
// The 8-name master list is trainers (not generic providers); several also walk.
// Run with: npx tsx scripts/add-providers.ts
// Safe to re-run — uses upsert, so it won't create duplicates.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ProviderSeed = {
  name: string;
  services: ("WALKING" | "SITTING" | "GROOMING" | "TRAINING")[];
  bio: string;
  pricePerWalk?: number;
  pricePerGroom?: number;
  pricePerTrain?: number;
};

const PROVIDERS: ProviderSeed[] = [
  {
    name: "Negi",
    services: ["TRAINING", "WALKING"],
    bio: "Trainer, and walking coordinator — manages a small team of walkers.",
    pricePerWalk: 29900,
    pricePerTrain: 59900,
  },
  {
    name: "Tejinder Singh",
    services: ["TRAINING"],
    bio: "Dog trainer.",
    pricePerTrain: 59900,
  },
  {
    name: "Nirmal",
    services: ["TRAINING", "GROOMING", "WALKING"],
    bio: "Offers training, grooming, and dog walking services.",
    pricePerWalk: 29900,
    pricePerGroom: 49900,
    pricePerTrain: 59900,
  },
  {
    name: "Nitin Vaid",
    services: ["TRAINING", "WALKING"],
    bio: "Trainer, and walking coordinator — manages 2-3 walkers.",
    pricePerWalk: 29900,
    pricePerTrain: 59900,
  },
  {
    name: "Dilpreet Singh",
    services: ["TRAINING"],
    bio: "Dog trainer.",
    pricePerTrain: 59900,
  },
  {
    name: "Joginder",
    services: ["TRAINING", "WALKING"],
    bio: "Offers training and dog walking services.",
    pricePerWalk: 29900,
    pricePerTrain: 59900,
  },
  {
    name: "Dinesh Kumar",
    services: ["TRAINING"],
    bio: "Dog trainer.",
    pricePerTrain: 59900,
  },
  {
    name: "Mandeep Gill",
    services: ["TRAINING", "WALKING"],
    bio: "Trainer, and walking coordinator — manages 2-3 walkers.",
    pricePerWalk: 29900,
    pricePerTrain: 59900,
  },
  {
    name: "Ravi",
    services: ["GROOMING"],
    bio: "Professional pet groomer.",
    pricePerGroom: 49900,
  },
  {
    name: "Ankit",
    services: ["GROOMING"],
    bio: "Professional pet groomer.",
    pricePerGroom: 49900,
  },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  for (const p of PROVIDERS) {
    const slug = slugify(p.name);
    const placeholderClerkId = `staff-${slug}`;
    const placeholderEmail = `${slug}@staff.barkado.local`;

    const user = await prisma.user.upsert({
      where: { clerkId: placeholderClerkId },
      update: { name: p.name },
      create: {
        clerkId: placeholderClerkId,
        email: placeholderEmail,
        name: p.name,
        role: "PROVIDER",
      },
    });

    await prisma.provider.upsert({
      where: { userId: user.id },
      update: {
        bio: p.bio,
        servicesOffered: p.services,
        pricePerWalk: p.pricePerWalk,
        pricePerGroom: p.pricePerGroom,
        pricePerTrain: p.pricePerTrain,
        verified: true,
      },
      create: {
        userId: user.id,
        bio: p.bio,
        servicesOffered: p.services,
        pricePerWalk: p.pricePerWalk,
        pricePerGroom: p.pricePerGroom,
        pricePerTrain: p.pricePerTrain,
        verified: true,
      },
    });

    console.log(`Added/updated: ${p.name} (${p.services.join(", ")})`);
  }

  console.log("\nDone. All providers added/updated with corrected services.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });