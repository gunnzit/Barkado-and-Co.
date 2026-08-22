"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Target } from "lucide-react";

type Earnings = {
  today: { totalPaise: number; count: number };
  week: { totalPaise: number; count: number };
  month: { totalPaise: number; count: number };
  acceptanceRate: number | null;
  completionRate: number | null;
  totalBookings: number;
  streak: { goal: number; current: number };
};

function rupees(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

export default function ProviderEarningsPanel() {
  const [data, setData] = useState<Earnings | null>(null);

  useEffect(() => {
    fetch("/api/provider/earnings")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm px-1" style={{ color: "var(--muted)" }}>Loading…</p>;

  const streakPct = Math.min(100, (data.streak.current / data.streak.goal) * 100);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center">
          <p className="text-[10px] font-semibold" style={{ color: "var(--muted)" }}>Today</p>
          <p className="text-lg font-bold mt-1">{rupees(data.today.totalPaise)}</p>
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>{data.today.count} completed</p>
        </div>
        <div className="card text-center">
          <p className="text-[10px] font-semibold" style={{ color: "var(--muted)" }}>This week</p>
          <p className="text-lg font-bold mt-1">{rupees(data.week.totalPaise)}</p>
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>{data.week.count} completed</p>
        </div>
        <div className="card text-center">
          <p className="text-[10px] font-semibold" style={{ color: "var(--muted)" }}>This month</p>
          <p className="text-lg font-bold mt-1">{rupees(data.month.totalPaise)}</p>
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>{data.month.count} completed</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Target size={15} color="var(--terracotta)" />
          <p className="font-semibold text-sm">Weekly goal</p>
        </div>
        <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
          {data.streak.current} of {data.streak.goal} walks/sessions this week
        </p>
        <div className="w-full h-2 rounded-full" style={{ background: "var(--cream)" }}>
          <div
            className="h-2 rounded-full"
            style={{ width: `${streakPct}%`, background: "var(--terracotta)", transition: "width 400ms ease" }}
          />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} color="var(--terracotta)" />
          <p className="font-semibold text-sm">Your stats</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Acceptance rate</p>
            <p className="font-bold text-base">
              {data.acceptanceRate != null ? `${Math.round(data.acceptanceRate * 100)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Completion rate</p>
            <p className="font-bold text-base">
              {data.completionRate != null ? `${Math.round(data.completionRate * 100)}%` : "—"}
            </p>
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>{data.totalBookings} total bookings all-time</p>
      </div>
    </div>
  );
}