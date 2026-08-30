"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Target, Landmark, CalendarClock, Lock, Receipt, PiggyBank, Banknote, CheckCircle2 } from "lucide-react";
import ProviderPayoutInfoForm from "@/components/ProviderPayoutInfoForm";

type Transaction = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  grossPaise: number;
  netPaise: number;
};

type PayoutInfo =
  | { method: "BANK"; accountMasked: string | null; holderName: string | null }
  | { method: "UPI"; vpa: string | null }
  | null;

type Earnings = {
  today: { totalPaise: number; count: number };
  week: { totalPaise: number; count: number };
  month: { totalPaise: number; count: number; grossPaise: number; feePaise: number };
  lifetimeNetPaise: number;
  amountOwedPaise: number;
  payoutInfo: PayoutInfo;
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
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [justRequested, setJustRequested] = useState(false);

  const load = () => {
    fetch("/api/provider/earnings")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) return <p className="text-sm px-1" style={{ color: "var(--muted)" }}>Loading…</p>;

  const streakPct = Math.min(100, (data.streak.current / data.streak.goal) * 100);
  const hasPayoutInfo = data.payoutInfo != null;
  const canRequestPayout = hasPayoutInfo && data.amountOwedPaise > 0;

  const requestPayout = async () => {
    setRequesting(true);
    setRequestError("");
    const res = await fetch("/api/provider/payouts", { method: "POST" });
    setRequesting(false);
    if (res.ok) {
      setJustRequested(true);
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setRequestError(body.error || "Couldn't request payout — please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {/* ===== Total Earned — lifetime net. Kept separate from "Amount
          Owed" below, since they're genuinely different numbers: lifetime
          earned vs. what's currently unclaimed and requestable. ===== */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "var(--card)", boxShadow: "0 4px 20px -2px rgba(22,40,31,0.06)" }}>
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full" style={{ background: "rgba(201,122,86,0.08)" }} />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Total Earned</p>
          <h2 className="text-4xl font-bold mb-1">{rupees(data.lifetimeNetPaise)}</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            <span className="font-semibold" style={{ color: "var(--forest, #16281f)" }}>{rupees(data.amountOwedPaise)}</span> owed right now
          </p>

          {justRequested ? (
            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--forest, #16281f)" }}>
              <CheckCircle2 size={16} /> Payout requested — we'll be in touch.
            </p>
          ) : (
            <button
              onClick={canRequestPayout ? requestPayout : () => setShowPayoutForm(true)}
              disabled={requesting || (!hasPayoutInfo ? false : data.amountOwedPaise <= 0)}
              className="tap-scale flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
              style={{
                background: canRequestPayout ? "var(--panel-dark)" : "var(--muted)",
                color: "white",
                opacity: !hasPayoutInfo ? 1 : data.amountOwedPaise <= 0 ? 0.5 : 1,
                cursor: !hasPayoutInfo ? "pointer" : data.amountOwedPaise <= 0 ? "not-allowed" : "pointer",
              }}
            >
              <Landmark size={16} />
              {requesting ? "Requesting…" : !hasPayoutInfo ? "Add payout details" : "Request Payout"}
            </button>
          )}
          {requestError && <p className="text-xs mt-2" style={{ color: "var(--terracotta)" }}>{requestError}</p>}
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

      {/* ===== Payout Status — now real. "Next Payout Date" is described
          honestly (no fixed schedule exists — this is a manual, on-request
          flow by design, not a placeholder), and "Linked Account" shows
          the provider's real saved bank/UPI info, masked. ===== */}
      <div className="card">
        <h4 className="font-bold text-sm mb-4">Payout Status</h4>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
            <CalendarClock size={18} color="var(--muted)" />
          </div>
          <div>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>Payout Schedule</p>
            <p className="text-sm font-medium">No fixed date — processed manually after you request one</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
            <Banknote size={18} color="var(--muted)" />
          </div>
          <div className="flex-1">
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>Linked Account</p>
            {data.payoutInfo == null ? (
              <p className="text-sm font-medium">No account linked yet</p>
            ) : data.payoutInfo.method === "BANK" ? (
              <p className="text-sm font-medium">{data.payoutInfo.holderName} · {data.payoutInfo.accountMasked}</p>
            ) : (
              <p className="text-sm font-medium">{data.payoutInfo.vpa}</p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
            <Lock size={12} /> Transferred manually by our team for now
          </span>
          <button onClick={() => setShowPayoutForm((v) => !v)} className="font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
            {hasPayoutInfo ? "Edit" : "Add details"}
          </button>
        </div>
        {showPayoutForm && (
          <ProviderPayoutInfoForm
            onSaved={() => {
              setShowPayoutForm(false);
              load();
            }}
          />
        )}
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