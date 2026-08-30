import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { lookupIFSC, isValidVpaFormat, isValidAccountNumberFormat } from "@/lib/verifyPayoutInfo";

const payoutInfoSchema = z.discriminatedUnion("payoutMethod", [
  z.object({
    payoutMethod: z.literal("BANK"),
    bankAccountNumber: z.string().trim().min(4),
    bankIFSC: z.string().trim().min(4),
    bankAccountHolderName: z.string().trim().min(1),
  }),
  z.object({
    payoutMethod: z.literal("UPI"),
    upiVpa: z.string().trim().min(3),
  }),
]);

function maskAccountNumber(num: string) {
  return `••••${num.slice(-4)}`;
}

// Always fetch fresh — same reasoning as earnings/route.ts.
export const dynamic = "force-dynamic";

// GET returns a masked summary — never the full bank account number back
// to the client once saved, same principle as never re-displaying a full
// card number after checkout. For BANK, also does a live IFSC lookup so
// the real bank/branch name shows every time this is read, not just once
// at save time.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  if (!provider.payoutMethod) {
    return NextResponse.json({ payoutMethod: null });
  }

  if (provider.payoutMethod === "BANK") {
    const lookup = provider.bankIFSC ? await lookupIFSC(provider.bankIFSC) : { valid: false as const };
    return NextResponse.json({
      payoutMethod: "BANK",
      bankAccountHolderName: provider.bankAccountHolderName,
      bankAccountMasked: provider.bankAccountNumber ? maskAccountNumber(provider.bankAccountNumber) : null,
      bankIFSC: provider.bankIFSC,
      bankName: lookup.valid ? lookup.bankName : null,
      bankBranch: lookup.valid ? lookup.branch : null,
      updatedAt: provider.payoutInfoUpdatedAt,
    });
  }

  return NextResponse.json({
    payoutMethod: "UPI",
    upiVpa: provider.upiVpa,
    updatedAt: provider.payoutInfoUpdatedAt,
  });
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = payoutInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Real, format-level verification before saving. This confirms a
  // genuine bank branch exists / the UPI ID is correctly shaped — it does
  // NOT confirm the account belongs to this specific person. That
  // stronger check (Reverse Penny Drop) needs RazorpayX access, which
  // isn't available yet.
  let bankName: string | null = null;
  let bankBranch: string | null = null;

  if (data.payoutMethod === "BANK") {
    if (!isValidAccountNumberFormat(data.bankAccountNumber)) {
      return NextResponse.json({ error: "That doesn't look like a valid account number." }, { status: 400 });
    }
    const lookup = await lookupIFSC(data.bankIFSC);
    if (!lookup.valid) {
      return NextResponse.json({ error: "That IFSC code doesn't match any real bank branch — please double-check it." }, { status: 400 });
    }
    bankName = lookup.bankName;
    bankBranch = lookup.branch;
  } else {
    if (!isValidVpaFormat(data.upiVpa)) {
      return NextResponse.json({ error: "That doesn't look like a valid UPI ID (e.g. name@bank)." }, { status: 400 });
    }
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      payoutMethod: data.payoutMethod,
      bankAccountNumber: data.payoutMethod === "BANK" ? data.bankAccountNumber : null,
      bankIFSC: data.payoutMethod === "BANK" ? data.bankIFSC : null,
      bankAccountHolderName: data.payoutMethod === "BANK" ? data.bankAccountHolderName : null,
      upiVpa: data.payoutMethod === "UPI" ? data.upiVpa : null,
      payoutInfoUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, bankName, bankBranch });
}