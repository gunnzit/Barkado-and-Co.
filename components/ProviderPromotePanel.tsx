"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles, PawPrint, Home as HomeIcon, Scissors, GraduationCap, Eye,
  Plus, Megaphone, MousePointerClick, Wallet, Award, Zap, ArrowLeft, HelpCircle,
  Check, TrendingUp, Rocket, Star, X, History,
} from "lucide-react";
import ProviderCampaignHistory from "@/components/ProviderCampaignHistory";

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

type Scope = "WALKING" | "SITTING" | "GROOMING" | "TRAINING";

const SERVICE_META: Record<Scope, { label: string; icon: any; color: string }> = {
  WALKING: { label: "Adventure Walking", icon: PawPrint, color: "var(--forest, #16281f)" },
  SITTING: { label: "Home Staycation", icon: HomeIcon, color: "var(--terracotta)" },
  GROOMING: { label: "Luxury Grooming", icon: Scissors, color: "var(--gold)" },
  TRAINING: { label: "Professional Training", icon: GraduationCap, color: "var(--heritage-red, #c0392b)" },
};

// Purely a placeholder formula, carried over verbatim from the reference
// design (whose own source literally commented "Fictional calculation for
// demonstration" on this same number). Not a real prediction — there's no
// ad-delivery system behind it.
function estimatedReach(dailyBudget: number) {
  return { min: Math.floor(dailyBudget * 20), max: Math.floor(dailyBudget * 33.3) };
}

function NewCampaignScreen({
  offeredServices,
  onBack,
  onLaunched,
  providerName,
  photoUrl,
  ratingAvg,
}: {
  offeredServices: Scope[];
  onBack: () => void;
  onLaunched: (name: string) => void;
  providerName: string;
  photoUrl: string | null;
  ratingAvg: number;
}) {
  const [name, setName] = useState("");
  const [selectedServices, setSelectedServices] = useState<Scope[]>(offeredServices.slice(0, 1));
  const [dailyBudget, setDailyBudget] = useState(15);
  // Now required — the one-time Razorpay charge on launch is for exactly
  // this amount, so there's nothing to charge for an uncapped campaign.
  const [totalCap, setTotalCap] = useState("");
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [laterStartDate, setLaterStartDate] = useState("");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");

  const toggleService = (s: Scope) => {
    setSelectedServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const reach = estimatedReach(dailyBudget);

  const capValue = Number(totalCap);
  const canLaunch =
    name.trim().length > 0 &&
    selectedServices.length > 0 &&
    (schedule === "now" || laterStartDate.length > 0) &&
    totalCap.trim().length > 0 &&
    !isNaN(capValue) &&
    capValue > 0;

  // Real one-time payment for the full budget cap, per product decision —
  // not a recurring daily charge (that's a separate, much larger future
  // build). Two-step, same pattern as cart checkout: create the order and
  // an unpaid Campaign row, open Razorpay, then verify the payment before
  // the campaign is treated as real anywhere in the app.
  const launch = async () => {
    setLaunching(true);
    setError("");
    const startDate = schedule === "now" ? new Date().toISOString() : new Date(laterStartDate).toISOString();

    try {
      const orderRes = await fetch("/api/provider/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          services: selectedServices,
          dailyBudgetPaise: dailyBudget * 100,
          totalBudgetCapPaise: Math.round(capValue * 100),
          startDate,
        }),
      });
      if (!orderRes.ok) throw new Error("order_failed");
      const order = await orderRes.json();

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        order_id: order.razorpayOrderId,
        name: "Barkado & Co.",
        description: `Campaign — ${name.trim()}`,
        handler: async (response: any) => {
          const verifyRes = await fetch(`/api/provider/campaigns/${order.campaignId}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          setLaunching(false);
          if (verifyRes.ok) {
            onLaunched(name.trim());
          } else {
            setError("Payment succeeded but activation failed — contact support.");
          }
        },
        modal: { ondismiss: () => setLaunching(false) },
      });
      rzp.open();
    } catch {
      setLaunching(false);
      setError("Couldn't start payment — please try again.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="tap-scale p-1.5 rounded-full" style={{ color: "var(--forest, #16281f)" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">New Campaign</h1>
        </div>
        <HelpCircle size={20} color="var(--muted)" />
      </div>

      <div className="mb-6">
        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--muted)" }}>Campaign Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spring Explorer Push"
          className="w-full border rounded-xl px-4 py-3 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      <div className="space-y-8">
        {/* ===== Step 1: Services ===== */}
        <div>
          <h2 className="font-bold text-lg mb-1">1. Select Services to Promote</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Choose which offerings you want to highlight in this campaign.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {offeredServices.map((s) => {
              const meta = SERVICE_META[s];
              const Icon = meta.icon;
              const selected = selectedServices.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleService(s)}
                  className="tap-scale rounded-xl p-4 flex flex-col items-center text-center gap-2"
                  style={{
                    background: selected ? `${meta.color}1A` : "var(--card)",
                    border: `2px solid ${selected ? meta.color : "var(--border)"}`,
                  }}
                >
                  <Icon size={26} color={meta.color} />
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center mt-1"
                    style={{ border: `2px solid ${selected ? meta.color : "var(--border)"}`, background: selected ? meta.color : "transparent" }}
                  >
                    {selected && <Check size={12} color="white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== Step 2: Budget ===== */}
        <div>
          <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="font-bold text-lg mb-1">2. Set Daily Budget</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Determine how much you want to spend per day.</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
              <Star size={12} fill="var(--gold)" color="var(--gold)" /> Recommended: ₹15
            </span>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>₹5</span>
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
                <span className="font-bold text-lg">₹</span>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={dailyBudget}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!isNaN(v)) setDailyBudget(Math.min(50, Math.max(5, v)));
                  }}
                  className="w-14 bg-transparent text-center font-bold text-lg outline-none"
                />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>₹50</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "var(--panel-dark)" }}
            />
          </div>

          {/* Real budget cap — optional. Blank means uncapped. When set,
              You'll pay this amount now via Razorpay — the campaign auto-
              pauses once real Budget Used reaches it (checked lazily on
              read, no cron job). This is a one-time charge, not a daily
              bill. */}
          <div className="card mt-3">
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--muted)" }}>
              Total Budget Cap
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--muted)" }}>₹</span>
              <input
                type="number"
                min={1}
                value={totalCap}
                onChange={(e) => setTotalCap(e.target.value)}
                placeholder="e.g. 500"
                className="flex-1 bg-transparent outline-none text-sm border rounded-lg px-3 py-2"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>
              Charged once, upfront, via Razorpay. Campaign auto-pauses once Budget Used reaches this amount.
            </p>
          </div>
        </div>

        {/* ===== Step 3: Estimated Reach — placeholder math, see comment
            on estimatedReach() above. ===== */}
        <div>
          <h2 className="font-bold text-lg mb-4">3. Estimated Reach</h2>
          <div className="rounded-xl p-6 relative overflow-hidden flex items-center gap-6" style={{ background: "var(--panel-dark)", color: "white" }}>
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="relative z-10 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>Estimated Daily Views</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{reach.min}</span>
                <span className="text-xl" style={{ color: "rgba(255,255,255,0.5)" }}>–</span>
                <span className="text-4xl font-bold">{reach.max}</span>
              </div>
              <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                Rough estimate based on a ₹{dailyBudget} daily budget — not a guarantee.
              </p>
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 relative z-10" style={{ background: "rgba(255,255,255,0.1)" }}>
              <TrendingUp size={24} color="var(--gold)" />
            </div>
          </div>
        </div>

        {/* ===== Step 4: Schedule ===== */}
        <div>
          <h2 className="font-bold text-lg mb-4">4. Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { key: "now", title: "Start Immediately", desc: "Campaign will go live upon approval" },
              { key: "later", title: "Schedule for Later", desc: "Set a specific start and end date" },
            ] as const).map((opt) => {
              const selected = schedule === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSchedule(opt.key)}
                  className="tap-scale flex items-center gap-4 p-4 rounded-xl text-left"
                  style={{ border: `1px solid ${selected ? "var(--panel-dark)" : "var(--border)"}`, background: "var(--card)" }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ border: `2px solid ${selected ? "var(--panel-dark)" : "var(--border)"}` }}
                  >
                    {selected && <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--panel-dark)" }} />}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{opt.title}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {schedule === "later" && (
            <div className="mt-3">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--muted)" }}>Start date</label>
              <input
                type="date"
                value={laterStartDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setLaterStartDate(e.target.value)}
                className="border rounded-xl px-4 py-2.5 text-sm"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
          )}
        </div>

        {/* ===== Preview — the provider's REAL name, photo, and rating,
            with the actual "Featured" badge styling used on real search
            results. Not a mockup redesign — an honest preview of exactly
            what their real card will look like once this campaign is paid
            for and active. */}
        <div>
          <h2 className="font-bold text-lg mb-3">Preview</h2>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            This is how your card will look to owners once this campaign is active.
          </p>
          <div className="card">
            <div className="flex items-center gap-3">
              <img
                src={photoUrl || `https://i.pravatar.cc/150?u=preview-${providerName}`}
                alt={providerName}
                className="w-12 h-12 rounded-full object-cover shrink-0"
                style={{ border: "1px solid var(--border)" }}
              />
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-sm">{providerName || "Your name"}</p>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                    <Check size={10} /> Verified
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--gold)", color: "var(--forest, #16281f)" }}>
                    <Star size={10} fill="var(--forest, #16281f)" /> Featured
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="flex items-center gap-1"><Star size={11} fill="var(--gold)" color="var(--gold)" /> {ratingAvg.toFixed(1)}</span>
                  {selectedServices.length > 0 && (
                    <span>{selectedServices.map((s) => SERVICE_META[s].label).join(", ")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: "var(--terracotta)" }}>{error}</p>}

        <button
          onClick={launch}
          disabled={!canLaunch || launching}
          className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 tap-scale"
          style={{
            background: canLaunch ? "var(--panel-dark)" : "var(--muted)",
            color: "white",
            opacity: !canLaunch || launching ? 0.5 : 1,
            cursor: !canLaunch || launching ? "not-allowed" : "pointer",
          }}
        >
          {launching ? "Processing payment…" : canLaunch ? `Pay ₹${capValue} & Launch` : "Launch Campaign"} <Rocket size={18} />
        </button>
      </div>
    </div>
  );
}

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
  sponsoredUntil: Partial<Record<"WALKING" | "SITTING" | "GROOMING" | "TRAINING" | "HOMEPAGE", string | null>>;
  providerName: string;
  photoUrl: string | null;
  ratingAvg: number;
  completedCount: number;
}) {
  const [view, setView] = useState<"overview" | "new-campaign" | "history">("overview");
  const [justLaunched, setJustLaunched] = useState<string | null>(null);

  const [stats, setStats] = useState<{ profileViews: number; totalSpentPaise: number; totalClicks: number } | null>(null);
  useEffect(() => {
    fetch("/api/provider/promotion-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const isTopRated = ratingAvg >= 4.5;

  if (view === "new-campaign") {
    return (
      <div className="px-6">
        <NewCampaignScreen
          offeredServices={servicesOffered}
          onBack={() => setView("overview")}
          onLaunched={(name) => {
            setJustLaunched(name);
            setView("overview");
          }}
          providerName={providerName}
          photoUrl={photoUrl}
          ratingAvg={ratingAvg}
        />
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="px-6">
        <ProviderCampaignHistory onBack={() => setView("overview")} />
      </div>
    );
  }

  return (
    <div className="px-6 space-y-5">
      {justLaunched && (
        <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(22,40,31,0.08)", border: "1px solid var(--panel-dark)" }}>
          <p className="text-sm font-semibold">"{justLaunched}" launched</p>
          <button onClick={() => setJustLaunched(null)} className="tap-scale" aria-label="Dismiss">
            <X size={16} color="var(--muted)" />
          </button>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold mb-1">Promote</h1>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Manage your sponsored listings and grow your business.</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setView("new-campaign")}
            className="btn-primary tap-scale flex items-center gap-2"
            style={{ background: "var(--terracotta)" }}
          >
            <Plus size={18} /> New Campaign
          </button>
          <button
            onClick={() => setView("history")}
            className="tap-scale flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ border: "1px solid var(--border)", color: "var(--forest, #16281f)" }}
          >
            <History size={16} /> Campaign History
          </button>
        </div>
      </div>

      {/* ===== Campaign Performance — real numbers where they exist,
          honest "Coming soon" where they don't. ===== */}
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
          <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold mb-2" style={{ color: "var(--muted)" }}>
              <MousePointerClick size={13} /> Clicks
            </p>
            <p className="text-2xl font-bold">{stats ? stats.totalClicks : "—"}</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>Across all campaigns</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold mb-2" style={{ color: "var(--muted)" }}>
              <Wallet size={13} /> Budget Used
            </p>
            <p className="text-2xl font-bold">{stats ? `₹${(stats.totalSpentPaise / 100).toFixed(0)}` : "—"}</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>Across all campaigns</p>
          </div>
        </div>
      </div>

      {/* ===== Earned Badges ===== */}
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
    </div>
  );
}