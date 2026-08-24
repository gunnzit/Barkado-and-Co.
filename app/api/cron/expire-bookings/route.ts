import { NextResponse } from "next/server";
import { expireStaleBookings } from "@/lib/expireStaleBookings";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await expireStaleBookings();
  return NextResponse.json({ expired: count });
}