import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

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

// GET returns a masked summary — never the full bank account number back
// to the client once saved, same principle as never re-displaying a full
// card number after checkout.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  if (!provider.payoutMethod) {
    return NextResponse.json({ payoutMethod: null });
  }

  if (provider.payoutMethod === "BANK") {
    return NextResponse.json({
      payoutMethod: "BANK",
      bankAccountHolderName: provider.bankAccountHolderName,
      bankAccountMasked: provider.bankAccountNumber ? maskAccountNumber(provider.bankAccountNumber) : null,
      bankIFSC: provider.bankIFSC,
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

  return NextResponse.json({ success: true });
}