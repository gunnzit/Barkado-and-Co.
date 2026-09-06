import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

// Real, one-time welcome bonus for genuinely new signups. Granted inside
// the same transaction as the user row's creation, so either both the
// user and the bonus transaction land, or neither does — never a user
// left half-signed-up with signupBonusGrantedAt set but no matching real
// PawPointsTransaction (or vice versa).
const SIGNUP_BONUS_POINTS = 100;

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
  // constraint. This is NOT a new signup, so no bonus here — the account
  // already exists, it's just being re-linked to a different Clerk session.
  if (email) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: { clerkId: userId },
      });
    }
  }

  // Genuinely new user — create the row and grant the real signup bonus
  // together, atomically.
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        clerkId: userId,
        email,
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "New User",
        phone: clerkUser.phoneNumbers[0]?.phoneNumber,
        signupBonusGrantedAt: new Date(),
      },
    });

    await tx.pawPointsTransaction.create({
      data: {
        userId: newUser.id,
        type: "EARNED",
        points: SIGNUP_BONUS_POINTS,
      },
    });

    return newUser;
  });
}