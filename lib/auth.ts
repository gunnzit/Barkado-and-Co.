import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

// Ensures a User row exists for the signed-in Clerk user and returns it.
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "New User",
        phone: clerkUser.phoneNumbers[0]?.phoneNumber,
      },
    });
  }
  return user;
}
