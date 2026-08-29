"use client";

import { useState } from "react";
import { Check } from "lucide-react";

// Training "Plans" (recurring weekly/monthly packages) are a deferred
// feature — providers will build their own real plans later. This shows
// SAMPLE tiers so the profile page isn't empty in the meantime. The
// prices below are derived from the provider's real pricePerTrain (their
// actual per-session rate), scaled into rough weekly/monthly figures —
// so at least the base number is tied to something true about this
// specific provider, even though the tier names/features/session counts
// themselves are entirely placeholder.
export default function ProviderPlansTabs({ basePricePaise }: { basePricePaise: number }) {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const baseRupees = Math.round(basePricePaise / 100);

  const weeklyPlans = [
    {
      badge: "1 Session / Week",
      name: "Basic Manners",
      price: baseRupees,
      unit: "/ wk",
      features: ["Essential commands (sit, stay, come)", "Basic leash etiquette", "Progress tracking notes"],
      accent: "var(--heritage-red, #c0392b)",
    },
    {
      badge: "2 Sessions / Week",
      name: "Pro Obedience",
      price: Math.round(baseRupees * 1.8),
      unit: "/ wk",
      features: ["Advanced command mastery", "Distraction proofing in parks", "Priority text support"],
      accent: "var(--forest, #16281f)",
      dark: true,
    },
  ];

  const monthlyPlans = [
    {
      badge: "4 Sessions Total",
      name: "Puppy Foundation",
      price: Math.round(baseRupees * 3.6),
      unit: "/ mo",
      features: ["Potty & crate training", "Socialization exercises", "Bite inhibition"],
      accent: "var(--gold)",
    },
    {
      badge: "8 Sessions Total",
      name: "Total Transformation",
      price: Math.round(baseRupees * 6.6),
      unit: "/ mo",
      features: ["Behavior modification", "Off-leash reliability", "Custom training plan"],
      accent: "var(--terracotta)",
    },
  ];

  const plans = tab === "weekly" ? weeklyPlans : monthlyPlans;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h3 className="font-bold text-lg">Training Plans</h3>
        <div className="flex p-1 rounded-full" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
          {(["weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="tap-scale px-4 py-1.5 rounded-full text-xs font-semibold capitalize"
              style={{
                background: tab === t ? "var(--card)" : "transparent",
                color: tab === t ? "var(--forest, #16281f)" : "var(--muted)",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t} Plans
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="rounded-xl p-5 relative overflow-hidden"
            style={
              plan.dark
                ? { background: "var(--panel-dark)", color: "white" }
                : { border: "1px solid var(--border)", background: "var(--card)" }
            }
          >
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: plan.accent }} />
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3"
              style={plan.dark ? { background: "rgba(255,255,255,0.15)" } : { background: `${plan.accent}1A`, color: plan.accent }}
            >
              {plan.badge}
            </span>
            <p className="font-bold text-base mb-1">{plan.name}</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="font-bold text-2xl">₹{plan.price}</span>
              <span className="text-sm" style={{ opacity: 0.7 }}>{plan.unit}</span>
            </div>
            <ul className="space-y-2 mb-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={14} style={{ marginTop: 3, flexShrink: 0, color: plan.dark ? "white" : plan.accent }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-2.5 rounded-lg text-sm font-semibold"
              style={
                plan.dark
                  ? { background: "white", color: "var(--panel-dark)" }
                  : { border: `2px solid ${plan.accent}`, color: plan.accent, background: "transparent" }
              }
              title="Real plan booking is coming soon"
            >
              Select Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}