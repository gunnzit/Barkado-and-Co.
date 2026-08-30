"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Eye, TrendingUp, CheckCircle2 } from "lucide-react";

type Earnings = {
  today: { totalPaise: number; count: number };
  week: { totalPaise: number; count: number };
  month: { totalPaise: number; count: number };
  acceptanceRate: number | null;
  completionRate: number | null;
  totalBookings: number;
  streak: { goal: number; current: number };
  profileViews: number;
};

// Real metrics only. The reference design's "Booking Conversion 4.2%" and
// "Industry avg: 3.8%" have no basis in this app's data — no defined
// conversion formula exists, and there's no external benchmark to compare
// against. Acceptance rate and completion rate (both already computed
// server-side) are the honest equivalents, so those are what's shown here
// instead, in the same bento-card visual style.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card animate-pulse" style={{ height: 110, background: "var(--cream)" }} />
        ))}
      </div>
    );
  }

  const chartData = [
    { label: "Today", value: data.today.totalPaise / 100 },
    { label: "This week", value: data.week.totalPaise / 100 },
    { label: "This month", value: data.month.totalPaise / 100 },
  ];

  const goalPct = Math.min(100, Math.round((data.streak.current / data.streak.goal) * 100));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Performance Stats</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card relative overflow-hidden">
            <Eye size={44} color="var(--border)" className="absolute -top-1 -right-1" />
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Profile Views</p>
            <p className="text-3xl font-bold">{data.profileViews}</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>Last 30 days</p>
          </div>
          <div className="card relative overflow-hidden">
            <TrendingUp size={44} color="var(--border)" className="absolute -top-1 -right-1" />
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Acceptance Rate</p>
            <p className="text-3xl font-bold">{data.acceptanceRate != null ? `${Math.round(data.acceptanceRate * 100)}%` : "—"}</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>Of requests responded to</p>
          </div>
          <div className="card relative overflow-hidden">
            <CheckCircle2 size={44} color="var(--border)" className="absolute -top-1 -right-1" />
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>Completion Rate</p>
            <p className="text-3xl font-bold">{data.completionRate != null ? `${Math.round(data.completionRate * 100)}%` : "—"}</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>Of accepted bookings</p>
          </div>
        </div>
      </div>

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
    </div>
  );
}