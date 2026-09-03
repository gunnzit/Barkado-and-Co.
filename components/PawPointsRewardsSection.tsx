"use client";

import { useState } from "react";
import { Gift, Ticket, Check, Lock } from "lucide-react";

type Reward = {
  id: string;
  name: string;
  description: string | null;
  costPoints: number;
  rewardType: "FLAT_DISCOUNT" | "FREE_PRODUCT";
  discountValuePaise: number | null;
  applicableServiceType: string | null;
  productName: string | null;
};

export default function PawPointsRewardsSection({ rewards, balance }: { rewards: Reward[]; balance: number }) {
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [localBalance, setLocalBalance] = useState(balance);
  const [error, setError] = useState("");

  if (rewards.length === 0) return null;

  const claim = async (reward: Reward) => {
    setClaimingId(reward.id);
    setError("");
    const res = await fetch("/api/owner/pawpoints/redeem-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId: reward.id }),
    });
    setClaimingId(null);
    if (res.ok) {
      setClaimedIds((s) => new Set(s).add(reward.id));
      setLocalBalance((b) => b - reward.costPoints);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Couldn't claim that reward.");
    }
  };

  return (
    <section className="px-6 mt-8" id="vouchers-section">
      <h2 className="text-lg font-bold mb-1">Redeem Available Perks</h2>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
        Claim one of these, or use flexible redemption at checkout to apply any number of points as a discount instead.
      </p>
      {error && <p className="text-xs mb-3" style={{ color: "var(--terracotta)" }}>{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rewards.map((r) => {
          const isClaimed = claimedIds.has(r.id);
          const affordable = localBalance >= r.costPoints;
          const Icon = r.rewardType === "FREE_PRODUCT" ? Gift : Ticket;
          return (
            <div key={r.id} className="card flex flex-col" style={{ opacity: affordable || isClaimed ? 1 : 0.6 }}>
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                  <Icon size={17} color="var(--terracotta)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{r.name}</p>
                  {r.description && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{r.description}</p>}
                </div>
              </div>
              <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "var(--cream)" }}>{r.costPoints} pts</span>
                <button
                  onClick={() => claim(r)}
                  disabled={!affordable || isClaimed || claimingId === r.id}
                  className="tap-scale flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    background: isClaimed ? "var(--cream)" : affordable ? "var(--panel-dark)" : "var(--muted)",
                    color: isClaimed ? "var(--forest, #16281f)" : "white",
                  }}
                >
                  {isClaimed ? (<><Check size={12} /> Claimed</>) : !affordable ? (<><Lock size={12} /> Locked</>) : claimingId === r.id ? "…" : "Claim"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}