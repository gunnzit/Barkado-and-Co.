"use client";

import { X, Sparkles } from "lucide-react";

export default function ProviderHomepagePreviewModal({
  providerName,
  photoUrl,
  ratingAvg,
  completedCount,
  onClose,
}: {
  providerName: string;
  photoUrl: string | null;
  ratingAvg: number;
  completedCount: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6" style={{ background: "rgba(0,0,0,0.6)", zIndex: 200 }} onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: "var(--cream)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--terracotta)" }}>Preview</p>
            <p className="font-bold text-sm">How you'll appear on the homepage</p>
          </div>
          <button onClick={onClose} className="tap-scale p-1"><X size={18} /></button>
        </div>

        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--terracotta)" }}>Offers</p>
          <p className="text-xl font-bold mb-4">On us, and 10% off.</p>

          <div className="rounded-2xl p-6 mb-4" style={{ background: "linear-gradient(135deg, #e8a94a 0%, #c97a56 100%)" }}>
            <p className="font-bold text-lg text-white">Your dog's first walk is free 🎉</p>
          </div>

          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "var(--panel-dark)" }}>
            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
              {photoUrl && <img src={photoUrl} alt={providerName} className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={12} color="var(--gold)" />
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--gold)" }}>Featured provider</p>
              </div>
              <p className="font-bold text-white text-sm truncate">{providerName}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                ★ {ratingAvg.toFixed(1)} · {completedCount} completed
              </p>
            </div>
          </div>

          <p className="text-[11px] mt-4" style={{ color: "var(--muted)" }}>
            This is exactly where your card sits on the real homepage, right under the offers.
          </p>
        </div>
      </div>
    </div>
  );
}
