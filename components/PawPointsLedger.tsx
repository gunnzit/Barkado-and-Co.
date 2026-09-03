"use client";

import { useState } from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";

type Transaction = { id: string; type: string; points: number; createdAt: string };

const TYPE_META: Record<string, { label: string; icon: any; sign: "+" | "-"; color: string }> = {
  EARNED: { label: "Earned", icon: Plus, sign: "+", color: "var(--forest, #16281f)" },
  REDEEMED: { label: "Redeemed", icon: Minus, sign: "-", color: "var(--terracotta)" },
  EARNED_REVERSED: { label: "Refund adjustment", icon: RotateCcw, sign: "-", color: "var(--heritage-red, #c0392b)" },
  REDEEMED_REVERSED: { label: "Refund adjustment", icon: RotateCcw, sign: "+", color: "var(--forest, #16281f)" },
};

export default function PawPointsLedger({ transactions }: { transactions: Transaction[] }) {
  const [filter, setFilter] = useState<"all" | "earned" | "spent">("all");

  const filtered = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "earned") return t.type === "EARNED" || t.type === "REDEEMED_REVERSED";
    return t.type === "REDEEMED" || t.type === "EARNED_REVERSED";
  });

  return (
    <section className="px-6 mt-8 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">PawPoints Activity</h2>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "var(--cream)" }}>
          {(["all", "earned", "spent"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="tap-scale px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize"
              style={{ background: filter === f ? "var(--card)" : "transparent", color: filter === f ? "var(--forest, #16281f)" : "var(--muted)" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-sm" style={{ color: "var(--muted)" }}>No activity in this filter yet.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((t) => {
              const meta = TYPE_META[t.type] ?? TYPE_META.EARNED;
              const Icon = meta.icon;
              return (
                <div key={t.id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                    <Icon size={14} color={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{meta.label}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className="font-bold text-sm shrink-0" style={{ color: meta.color }}>{meta.sign}{t.points} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}