import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public — fired client-side when an owner taps "Choose" / "View Plans" /
// "View Profile" on a provider card that's showing because of an active
// campaign. No auth required (same as impression logging in
// /api/providers), but does verify the campaign actually exists before
// writing, to avoid junk rows from a stale or malformed id.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id }, select: { id: true } });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.campaignClick.create({ data: { campaignId: id } });
  return NextResponse.json({ ok: true }, { status: 201 });
}