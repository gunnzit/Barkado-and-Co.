"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, PawPrint, Home as HomeIcon, Scissors, GraduationCap, Calendar, Megaphone } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  services: ("WALKING" | "SITTING" | "GROOMING" | "TRAINING")[];
  dailyBudgetPaise: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate: string;
  endDate: string | null;
  createdAt: string;
};

const SERVICE_ICON: Record<string, any> = {
  WALKING: PawPrint,
  SITTING: HomeIcon,
  GROOMING: Scissors,
  TRAINING: GraduationCap,
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "rgba(22,40,31,0.1)", color: "var(--forest, #16281f)" },
  PAUSED: { bg: "rgba(196,110,45,0.12)", color: "var(--terracotta)" },
  COMPLETED: { bg: "var(--cream)", color: "var(--muted)" },
};

const FILTERS = ["All", "Active", "Paused", "Completed"] as const;

// Deliberately no "Total Spend / Total Reach / New Bookings" summary here
// (unlike the reference design) — none of that is trackable yet (no real
// ad-spend ledger, no impression/click data, no campaign-to-booking
// attribution). Showing what's actually real: each campaign's own
// configured details.
export default function ProviderCampaignHistory({ onBack }: { onBack: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    fetch("/api/provider/campaigns")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCampaigns)
      .catch(() => setCampaigns([]));
  }, []);

  const filtered = (campaigns ?? []).filter((c) => filter === "All" || c.status.toLowerCase() === filter.toLowerCase());

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="tap-scale p-1.5 rounded-full" style={{ color: "var(--forest, #16281f)" }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Campaign History</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="tap-scale shrink-0 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: active ? "var(--panel-dark)" : "var(--card)",
                color: active ? "white" : undefined,
                border: `1px solid ${active ? "var(--panel-dark)" : "var(--border)"}`,
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {campaigns === null ? (
        <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Megaphone size={28} color="var(--muted)" className="mx-auto mb-3" />
          <p className="font-semibold text-sm mb-1">
            {campaigns.length === 0 ? "No campaigns yet" : `No ${filter.toLowerCase()} campaigns`}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {campaigns.length === 0 ? "Launch your first campaign from the Promote tab." : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const statusStyle = STATUS_STYLE[c.status];
            return (
              <div key={c.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-base">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      <Calendar size={12} />
                      {new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {c.endDate ? ` – ${new Date(c.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {c.services.map((s) => {
                    const Icon = SERVICE_ICON[s];
                    return (
                      <span key={s} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: "var(--cream)" }}>
                        <Icon size={11} /> {s.charAt(0) + s.slice(1).toLowerCase()}
                      </span>
                    );
                  })}
                </div>
                <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>Daily Budget</p>
                  <p className="font-bold text-sm">₹{(c.dailyBudgetPaise / 100).toFixed(0)} / day</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}