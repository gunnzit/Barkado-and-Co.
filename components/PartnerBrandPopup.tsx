"use client";

import { useEffect, useState } from "react";
import { X, Star, MapPin, Phone, Clock, ExternalLink } from "lucide-react";

type GoogleInfo = {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
  openNow: boolean | null;
  weekdayHours: string[];
  reviews: { author: string; rating: number; text: string; relativeTime: string }[];
  googleMapsUrl: string | null;
};

export default function PartnerBrandPopup({
  partnerBrandId,
  partnerBrandName,
  onClose,
}: {
  partnerBrandId: string;
  partnerBrandName: string;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<GoogleInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/partner-brands/${partnerBrandId}/google-info`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Couldn't load business info");
        }
        return r.json();
      })
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [partnerBrandId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(2,18,10,0.5)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl" style={{ background: "var(--cream)" }}>
        <div className="sticky top-0 flex items-center justify-between p-4" style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold text-base">{partnerBrandName}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center tap-scale" style={{ background: "var(--card)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {loading && <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>Loading real business info…</p>}

          {error && (
            <p className="text-sm py-8 text-center" style={{ color: "var(--terracotta)" }}>{error}</p>
          )}

          {info && !loading && !error && (
            <div className="space-y-4">
              {info.rating != null && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-bold text-lg">
                    <Star size={18} fill="var(--gold)" color="var(--gold)" /> {info.rating.toFixed(1)}
                  </span>
                  {info.reviewCount != null && (
                    <span className="text-sm" style={{ color: "var(--muted)" }}>({info.reviewCount.toLocaleString("en-IN")} Google reviews)</span>
                  )}
                </div>
              )}

              {info.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin size={15} color="var(--muted)" className="shrink-0 mt-0.5" />
                  <span>{info.address}</span>
                </div>
              )}

              {info.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={15} color="var(--muted)" className="shrink-0" />
                  <a href={`tel:${info.phone}`}>{info.phone}</a>
                </div>
              )}

              {info.weekdayHours.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock size={15} color="var(--muted)" className="shrink-0 mt-0.5" />
                  <div>
                    {info.openNow != null && (
                      <p className="font-semibold mb-1" style={{ color: info.openNow ? "#1d693b" : "var(--terracotta)" }}>
                        {info.openNow ? "Open now" : "Closed now"}
                      </p>
                    )}
                    {info.weekdayHours.map((h) => (
                      <p key={h} style={{ color: "var(--muted)" }}>{h}</p>
                    ))}
                  </div>
                </div>
              )}

              {info.reviews.length > 0 && (
                <div>
                  <p className="font-bold text-sm mb-2">Recent Google reviews</p>
                  <div className="space-y-3">
                    {info.reviews.map((rev, i) => (
                      <div key={i} className="card">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">{rev.author}</span>
                          <span className="flex items-center gap-0.5 text-xs">
                            <Star size={11} fill="var(--gold)" color="var(--gold)" /> {rev.rating}
                          </span>
                        </div>
                        <p className="text-xs line-clamp-3" style={{ color: "var(--muted)" }}>{rev.text}</p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>{rev.relativeTime}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {info.googleMapsUrl && (
                <a
                  href={info.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 h-11 rounded-xl font-semibold text-sm w-full"
                  style={{ background: "var(--panel-dark)", color: "white" }}
                >
                  View on Google Maps <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}