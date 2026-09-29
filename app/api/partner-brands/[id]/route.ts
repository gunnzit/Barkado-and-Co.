import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Real Google Business info for a partner brand — rating, review count,
// address, phone, hours, and a handful of real review excerpts, fetched
// live from Google's Place Details API using the brand's real
// googlePlaceId. Never fabricated; if the API key isn't configured or
// the request fails, this returns an error rather than fake data.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const brand = await prisma.partnerBrand.findUnique({ where: { id } });
  if (!brand) return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  if (!brand.googlePlaceId) return NextResponse.json({ error: "No Google listing linked for this partner yet" }, { status: 400 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY isn't configured — add it to your environment variables." },
      { status: 500 }
    );
  }

  const fields = "name,rating,user_ratings_total,formatted_address,formatted_phone_number,opening_hours,reviews,url";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(brand.googlePlaceId)}&fields=${fields}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK") {
      console.error("[partner-brand google-info] Google API error:", data.status, data.error_message);
      return NextResponse.json({ error: `Google Places API error: ${data.status}` }, { status: 502 });
    }
    const r = data.result;
    return NextResponse.json({
      name: r.name,
      rating: r.rating ?? null,
      reviewCount: r.user_ratings_total ?? null,
      address: r.formatted_address ?? null,
      phone: r.formatted_phone_number ?? null,
      openNow: r.opening_hours?.open_now ?? null,
      weekdayHours: r.opening_hours?.weekday_text ?? [],
      reviews: (r.reviews ?? []).slice(0, 3).map((rev: any) => ({
        author: rev.author_name,
        rating: rev.rating,
        text: rev.text,
        relativeTime: rev.relative_time_description,
      })),
      googleMapsUrl: r.url ?? null,
    });
  } catch (err) {
    console.error("[partner-brand google-info] fetch failed:", err);
    return NextResponse.json({ error: "Could not reach Google Places API" }, { status: 502 });
  }
}