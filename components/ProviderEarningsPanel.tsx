"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Target, Landmark, CalendarClock, Lock, Receipt, PiggyBank, Banknote } from "lucide-react";

type Transaction = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  grossPaise: number;
  netPaise: number;
};

type Earnings = {
  today: { totalPaise: number; count: number };
  week: { totalPaise: number; count: number };
  month: { totalPaise: number; count: number; grossPaise: number; feePaise: number };
  lifetimeNetPaise: number;
  acceptanceRate: number | null;
  completionRate: number | null;
  totalBookings: number;
  streak: { goal: number; current: number };
  transactions: Transaction[];
};

function rupees(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}

function formatRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  const dateLabel = start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const timeLabel = start.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} • ${timeLabel} • ${mins} mins`;
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
    <div className="space-y-4">
      {/* ===== Total Earned — lifetime net. Deliberately not labeled
          "Available Balance": no payout ledger exists yet to track what's
          actually been paid out vs. still owed, so "balance" would imply
          something this app can't yet back up. ===== */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "var(--card)", boxShadow: "0 4px 20px -2px rgba(22,40,31,0.06)" }}>
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full" style={{ background: "rgba(201,122,86,0.08)" }} />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Total Earned</p>
          <h2 className="text-4xl font-bold mb-4">{rupees(data.lifetimeNetPaise)}</h2>
          <button
            disabled
            className="tap-scale flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
            style={{ background: "var(--muted)", color: "white", opacity: 0.5, cursor: "not-allowed" }}
            title="Payouts are coming soon"
          >
            <Landmark size={16} /> Request Payout
          </button>
        </div>
      </div>

      {/* ===== This month's real gross / fee / net breakdown ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>Gross Earnings</p>
            <Receipt size={16} color="var(--border)" />
          </div>
          <p className="text-xl font-bold">{rupees(data.month.grossPaise)}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>This month</p>
        </div>
        <div className="card" style={{ background: "#fdeceb" }}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-semibold" style={{ color: "#c0392b" }}>Barkado Service Fee</p>
            <Receipt size={16} color="#c0392b" style={{ opacity: 0.4 }} />
          </div>
          <p className="text-xl font-bold" style={{ color: "#c0392b" }}>−{rupees(data.month.feePaise)}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#c0392b", opacity: 0.7 }}>This month</p>
        </div>
        <div className="card" style={{ background: "var(--cream)" }}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-semibold">Net Payouts</p>
            <PiggyBank size={16} color="var(--forest, #16281f)" style={{ opacity: 0.5 }} />
          </div>
          <p className="text-xl font-bold">{rupees(data.month.totalPaise)}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>This month</p>
        </div>
      </div>

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

      {/* ===== Payout Status — same structure/icons as the reference
          design, but honest content: no real payout schedule or linked
          account exists yet, so those rows say so plainly rather than
          showing an invented bank account number. ===== */}
      <div className="card">
        <h4 className="font-bold text-sm mb-4">Payout Status</h4>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
            <CalendarClock size={18} color="var(--muted)" />
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>Next Payout Date</p>
            <p className="text-sm font-medium flex items-center gap-2">
              Not scheduled yet
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>
                Coming soon
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
            <Banknote size={18} color="var(--muted)" />
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>Linked Account</p>
            <p className="text-sm font-medium flex items-center gap-2">
              No account linked yet
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>
                Coming soon
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
            <Lock size={12} /> Payouts will be secured via Razorpay
          </span>
          <button disabled className="font-semibold" style={{ color: "var(--muted)", opacity: 0.6, cursor: "not-allowed" }} title="Coming soon">
            Manage
          </button>
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

      {/* ===== Recent Transactions — real completed bookings ===== */}
      <div>
        <p className="font-bold text-sm mb-3">Recent Transactions</p>
        {data.transactions.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm" style={{ color: "var(--muted)" }}>No completed bookings yet.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {data.transactions.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{t.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{formatRange(t.startTime, t.endTime)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">+{rupees(t.netPaise)}</p>
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>Gross: {rupees(t.grossPaise)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}