import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "active_pet_id";

export async function GET() {
  const store = await cookies();
  const petId = store.get(COOKIE_NAME)?.value ?? null;
  return NextResponse.json({ petId });
}

export async function POST(req: NextRequest) {
  const { petId } = await req.json();
  if (!petId || typeof petId !== "string") {
    return NextResponse.json({ error: "petId is required" }, { status: 400 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, petId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  return res;
}