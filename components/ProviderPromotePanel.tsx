"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, PawPrint, Home as HomeIcon, Scissors, GraduationCap, Globe } from "lucide-react";

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
  servicesOffered,
  sponsoredUntil,
}: {
  servicesOffered: ("WALKING" | "SITTING" | "GROOMING" | "TRAINING")[];
  sponsoredUntil: Partial<Record<Scope, string | null>>;
}) {
  const scopeOptions: Scope[] = [...servicesOffered, "HOMEPAGE"];
  const [selectedScope, setSelectedScope] = useState<Scope>(scopeOptions[0]);
  const [busy, setBusy] = useState<7 | 30 | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

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

  return (
    <div className="px-6 space-y-4">
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Where do you want to be featured?</p>
        <div className="space-y-2">
          {scopeOptions.map((scope) => {
            const meta = SCOPE_META[scope];
            const Icon = meta.icon;
            const status = statusFor(scope);
            const active = selectedScope === scope;
            return (
              <button
                key={scope}
                onClick={() => setSelectedScope(scope)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl tap-scale text-left"
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
              </button>
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
  );
}