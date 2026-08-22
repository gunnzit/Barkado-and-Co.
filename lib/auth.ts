import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

// Ensures a User row exists for the signed-in Clerk user and returns it.
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existingByClerkId = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existingByClerkId) return existingByClerkId;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  // A row with this email can already exist under a different clerkId —
  // e.g. testing the same account across two Clerk instances/environments
  // (like localhost vs. the deployed site) that share the same database.
  // Re-link it to this session instead of failing on the unique email
  // constraint.
  if (email) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: { clerkId: userId },
      });
    }
  }

  return prisma.user.create({
    data: {
      clerkId: userId,
      email,
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "New User",
      phone: clerkUser.phoneNumbers[0]?.phoneNumber,
    },
  });
}