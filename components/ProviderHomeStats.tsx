"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Earnings = {
  today: { totalPaise: number; count: number };
  week: { totalPaise: number; count: number };
  month: { totalPaise: number; count: number };
  acceptanceRate: number | null;
  completionRate: number | null;
  totalBookings: number;
  streak: { goal: number; current: number };
};

export default function ProviderHomeStats() {
  const [data, setData] = useState<Earnings | null>(null);

  useEffect(() => {
    fetch("/api/provider/earnings")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="card animate-pulse" style={{ height: 180, background: "var(--cream)" }} />
    );
  }

  const chartData = [
    { label: "Today", value: data.today.totalPaise / 100 },
    { label: "This week", value: data.week.totalPaise / 100 },
    { label: "This month", value: data.month.totalPaise / 100 },
  ];

  const goalPct = Math.min(100, Math.round((data.streak.current / data.streak.goal) * 100));

  return (
    <div className="card">
      <p className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>Your earnings</p>
      <div style={{ width: "100%", height: 120 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              formatter={(v: any) => [`₹${v}`, "Earned"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <Bar dataKey="value" fill="var(--terracotta)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl p-3" style={{ background: "var(--cream)" }}>
          <p className="text-lg font-bold">{data.acceptanceRate != null ? `${Math.round(data.acceptanceRate * 100)}%` : "—"}</p>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Acceptance rate</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "var(--cream)" }}>
          <p className="text-lg font-bold">{data.completionRate != null ? `${Math.round(data.completionRate * 100)}%` : "—"}</p>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Completion rate</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>Weekly goal</p>
          <p className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>{data.streak.current} / {data.streak.goal}</p>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "var(--cream)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${goalPct}%`, background: "var(--terracotta)", transition: "width 500ms ease" }}
          />
        </div>
      </div>
    </div>
  );
}