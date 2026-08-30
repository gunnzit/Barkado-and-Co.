"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, PawPrint, Home as HomeIcon, Scissors, GraduationCap, Globe, Eye, Plus, Megaphone, MousePointerClick, Wallet, Award, Zap } from "lucide-react";
import ProviderListPreviewModal from "@/components/ProviderListPreviewModal";
import ProviderHomepagePreviewModal from "@/components/ProviderHomepagePreviewModal";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load payment widget"));
    document.body.appendChild(script);
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type Scope = "WALKING" | "SITTING" | "GROOMING" | "TRAINING" | "HOMEPAGE";

const SCOPE_META: Record<Scope, { label: string; icon: any; prices: { 7: number; 30: number } }> = {
  WALKING: { label: "Walking", icon: PawPrint, prices: { 7: 50, 30: 120 } },
  SITTING: { label: "Sitting", icon: HomeIcon, prices: { 7: 50, 30: 120 } },
  GROOMING: { label: "Grooming", icon: Scissors, prices: { 7: 50, 30: 120 } },
  TRAINING: { label: "Training", icon: GraduationCap, prices: { 7: 50, 30: 120 } },
  HOMEPAGE: { label: "Homepage (all categories)", icon: Globe, prices: { 7: 120, 30: 300 } },
};

export default function ProviderPromotePanel({
  providerId,
  servicesOffered,
  sponsoredUntil,
  providerName,
  photoUrl,
  ratingAvg,
  completedCount,
}: {
  providerId: string;
  servicesOffered: ("WALKING" | "SITTING" | "GROOMING" | "TRAINING")[];
  sponsoredUntil: Partial<Record<Scope, string | null>>;
  providerName: string;
  photoUrl: string | null;
  ratingAvg: number;
  completedCount: number;
}) {
  const scopeOptions: Scope[] = [...servicesOffered, "HOMEPAGE"];
  const [selectedScope, setSelectedScope] = useState<Scope>(scopeOptions[0]);
  const [previewScope, setPreviewScope] = useState<Scope | null>(null);
  const [busy, setBusy] = useState<7 | 30 | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const purchaseRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<{ profileViews: number; totalSpentPaise: number } | null>(null);
  useEffect(() => {
    fetch("/api/provider/promotion-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const statusFor = (scope: Scope) => {
    const until = sponsoredUntil[scope];
    return until && new Date(until).getTime() > Date.now() ? new Date(until) : null;
  };

  const buy = async (durationDays: 7 | 30) => {
    setBusy(durationDays);
    setError("");
    try {
      await loadRazorpayScript();
      const orderRes = await fetch("/api/provider/sponsorship/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: selectedScope, durationDays }),
      });
      if (!orderRes.ok) throw new Error("order_failed");
      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        order_id: order.razorpayOrderId,
        name: "Barkado & Co.",
        description: `Featured — ${SCOPE_META[selectedScope].label} — ${durationDays} days`,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/provider/sponsorship/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          setBusy(null);
          if (verifyRes.ok) {
            router.refresh();
          } else {
            setError("Payment succeeded but activation failed — contact support.");
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.open();
    } catch {
      setBusy(null);
      setError("Couldn't start payment — please try again.");
    }
  };

  const selectedStatus = statusFor(selectedScope);
  const selectedPrices = SCOPE_META[selectedScope].prices;
  const isTopRated = ratingAvg >= 4.5;

  return (
    <div className="px-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-1">Promote</h1>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Manage your sponsored listings and grow your business.</p>
        <button
          onClick={() => purchaseRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="btn-primary tap-scale flex items-center gap-2"
          style={{ background: "var(--terracotta)" }}
        >
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* ===== Campaign Performance — real numbers where they exist,
          honest "Coming soon" where they don't. No fake reach/click
          figures, no invented ad-budget concept (your real pricing is
          flat-fee per listing slot, not a spend-down budget). ===== */}
      <div className="card">
        <p className="font-bold text-base mb-4">Campaign Performance</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold mb-2" style={{ color: "var(--muted)" }}>
              <Eye size={13} /> Profile Views
            </p>
            <p className="text-2xl font-bold">{stats ? stats.profileViews : "—"}</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>Last 30 days</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--cream)", opacity: 0.6 }}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold mb-2" style={{ color: "var(--muted)" }}>
              <MousePointerClick size={13} /> Clicks
            </p>
            <p className="text-2xl font-bold">—</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide inline-block mt-1" style={{ background: "var(--card)", color: "var(--muted)" }}>
              Coming soon
            </span>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold mb-2" style={{ color: "var(--muted)" }}>
              <Wallet size={13} /> Total Spent
            </p>
            <p className="text-2xl font-bold">{stats ? `₹${(stats.totalSpentPaise / 100).toFixed(0)}` : "—"}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide inline-block mt-1" style={{ background: "var(--card)", color: "var(--muted)" }}>
              Budget caps coming soon
            </span>
          </div>
        </div>
      </div>

      {/* ===== Earned Badges — Top Rated is real (rating ≥ 4.5). Fast
          Responder needs response-time tracking that doesn't exist yet,
          shown disabled rather than dropped. ===== */}
      <div className="card">
        <p className="font-bold text-base mb-4">Earned Badges</p>
        <div className="space-y-3">
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: isTopRated ? "rgba(232,169,74,0.08)" : "var(--cream)",
              border: `1px solid ${isTopRated ? "rgba(232,169,74,0.3)" : "var(--border)"}`,
              opacity: isTopRated ? 1 : 0.6,
            }}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: isTopRated ? "rgba(232,169,74,0.2)" : "var(--card)" }}>
              <Award size={20} color={isTopRated ? "var(--gold)" : "var(--muted)"} />
            </div>
            <div>
              <p className="text-sm font-semibold">Top Rated</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {isTopRated ? `Earned — ${ratingAvg.toFixed(1)} average rating` : "Reach a 4.5+ rating to earn this"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--cream)", border: "1px solid var(--border)", opacity: 0.6 }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--card)" }}>
              <Zap size={20} color="var(--muted)" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                Fast Responder
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: "var(--card)", color: "var(--muted)" }}>
                  Coming soon
                </span>
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Response-time tracking isn't built yet</p>
            </div>
          </div>
        </div>
        <button disabled className="mt-4 w-full py-2 text-center text-xs font-semibold" style={{ color: "var(--muted)", opacity: 0.6, cursor: "not-allowed" }} title="Coming soon">
          View All Badges
        </button>
      </div>

      {/* ===== Real, already-working sponsorship purchase flow — untouched
          apart from being nested under the new header/stats above. ===== */}
      <div ref={purchaseRef} className="space-y-4 pt-1">
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Megaphone size={13} /> Where do you want to be featured?
          </p>
          <div className="space-y-2">
            {scopeOptions.map((scope) => {
              const meta = SCOPE_META[scope];
              const Icon = meta.icon;
              const status = statusFor(scope);
              const active = selectedScope === scope;
              return (
                <div
                  key={scope}
                  onClick={() => setSelectedScope(scope)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl tap-scale text-left cursor-pointer"
                  style={{
                    background: active ? "var(--panel-dark)" : "var(--card)",
                    border: `1px solid ${active ? "var(--panel-dark)" : "var(--border)"}`,
                  }}
                >
                  <Icon size={16} color={active ? "white" : "var(--terracotta)"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: active ? "white" : undefined }}>{meta.label}</p>
                    <p className="text-[11px]" style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>
                      {status ? `Featured until ${formatDate(status)}` : "Not featured"}
                    </p>
                  </div>
                  {status && <Sparkles size={14} color={active ? "var(--gold)" : "var(--terracotta)"} />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewScope(scope);
                    }}
                    className="tap-scale flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full shrink-0"
                    style={{
                      background: active ? "rgba(255,255,255,0.15)" : "var(--cream)",
                      color: active ? "white" : "var(--terracotta)",
                    }}
                  >
                    <Eye size={11} /> Preview
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>
            {selectedStatus ? `Extend ${SCOPE_META[selectedScope].label}` : `Promote ${SCOPE_META[selectedScope].label}`}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => buy(7)}
              disabled={busy !== null}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl tap-scale"
              style={{ background: "var(--cream)", border: "1px solid var(--border)", opacity: busy !== null ? 0.6 : 1 }}
            >
              <span className="text-sm font-semibold">1 week</span>
              <span className="text-sm font-bold">{busy === 7 ? "…" : `₹${selectedPrices[7]}`}</span>
            </button>
            <button
              onClick={() => buy(30)}
              disabled={busy !== null}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl tap-scale"
              style={{ background: "var(--cream)", border: "1px solid var(--border)", opacity: busy !== null ? 0.6 : 1 }}
            >
              <span className="text-sm font-semibold">1 month</span>
              <span className="text-sm font-bold">{busy === 30 ? "…" : `₹${selectedPrices[30]}`}</span>
            </button>
          </div>
          {error && <p className="text-xs mt-3" style={{ color: "var(--terracotta)" }}>{error}</p>}
        </div>
      </div>

      {previewScope && previewScope !== "HOMEPAGE" && (
        <ProviderListPreviewModal
          service={previewScope}
          providerId={providerId}
          onClose={() => setPreviewScope(null)}
        />
      )}
      {previewScope === "HOMEPAGE" && (
        <ProviderHomepagePreviewModal
          providerName={providerName}
          photoUrl={photoUrl}
          ratingAvg={ratingAvg}
          completedCount={completedCount}
          onClose={() => setPreviewScope(null)}
        />
      )}
    </div>
  );
}