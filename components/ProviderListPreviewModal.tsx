"use client";

import { useEffect, useState } from "react";
import { X, ShieldCheck, Sparkles, Star, Clock } from "lucide-react";

type Provider = {
  id: string;
  ratingAvg: number;
  user: { name: string };
  _count: { bookings: number };
  availableAtRequestedTime: boolean | null;
  isSponsored?: boolean;
};

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Walking",
  SITTING: "Sitting",
  GROOMING: "Grooming",
  TRAINING: "Training",
};

export default function ProviderListPreviewModal({
  service,
  providerId,
  onClose,
}: {
  service: "WALKING" | "SITTING" | "GROOMING" | "TRAINING";
  providerId: string;
  onClose: () => void;
}) {
  const [providers, setProviders] = useState<Provider[] | null>(null);

  useEffect(() => {
    fetch(`/api/providers?service=${service}`)
      .then((r) => r.json())
      .then((list: Provider[]) => {
        // Boost this provider to sponsored, keeping everyone else's real
        // relative order — the API already returns results correctly
        // pre-sorted (sponsored group first, then by rank).
        const mine = list.find((p) => p.id === providerId);
        const others = list.filter((p) => p.id !== providerId);
        if (!mine) {
          setProviders(list);
          return;
        }
        const boosted = { ...mine, isSponsored: true };
        const firstNonSponsoredIndex = others.findIndex((p) => !p.isSponsored);
        const insertAt = firstNonSponsoredIndex === -1 ? others.length : firstNonSponsoredIndex;
        const merged = [...others.slice(0, insertAt), boosted, ...others.slice(insertAt)];
        setProviders(merged);
      })
      .catch(() => setProviders([]));
  }, [service, providerId]);

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ background: "rgba(0,0,0,0.6)", zIndex: 200 }} onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: "var(--cream)", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--terracotta)" }}>Preview</p>
            <p className="font-bold text-sm">How owners see {SERVICE_LABEL[service]} results</p>
          </div>
          <button onClick={onClose} className="tap-scale p-1"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3" style={{ maxHeight: "calc(85vh - 64px)" }}>
          {providers === null ? (
            <div className="animate-pulse space-y-3">
              <div className="card" style={{ height: 70, background: "var(--card)" }} />
              <div className="card" style={{ height: 70, background: "var(--card)" }} />
            </div>
          ) : providers.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>No providers to show yet.</p>
          ) : (
            providers.map((p) => (
              <div key={p.id} className="card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm">{p.user.name}</p>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                      <ShieldCheck size={10} /> Verified
                    </span>
                    {p.isSponsored && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>
                        <Sparkles size={10} /> Sponsored
                      </span>
                    )}
                    {p.availableAtRequestedTime === false && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "#fdece0", color: "#a5652a" }}>
                        <Clock size={10} /> Outside their hours
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                    <span className="flex items-center gap-1"><Star size={11} fill="var(--gold)" color="var(--gold)" /> {p.ratingAvg.toFixed(1)}</span>
                    <span>· {p._count.bookings} completed</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}