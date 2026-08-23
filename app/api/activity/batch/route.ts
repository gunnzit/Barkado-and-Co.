import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const eventSchema = z.object({
  type: z.enum(["PAGE_VIEW", "CLICK"]),
  path: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
});

// Deliberately not behind Clerk's protected-route middleware — activity
// should still be logged for signed-out visitors, just without a userId.
export async function POST(req: Request) {
  const user = await getOrCreateUser().catch(() => null);

  const body = await req.json().catch(() => null);
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.activityEvent.createMany({
    data: parsed.data.events.map((e) => ({
      userId: user?.id ?? null,
      type: e.type,
      path: e.path,
      metadata: e.metadata ?? undefined,
    })),
  });

  return NextResponse.json({ success: true });
}