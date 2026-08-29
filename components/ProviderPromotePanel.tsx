"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

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

export default function ProviderPromotePanel({ sponsoredUntil }: { sponsoredUntil: string | null }) {
  const [busy, setBusy] = useState<7 | 30 | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const isActive = sponsoredUntil && new Date(sponsoredUntil).getTime() > Date.now();

  const buy = async (durationDays: 7 | 30) => {
    setBusy(durationDays);
    setError("");
    try {
      await loadRazorpayScript();
      const orderRes = await fetch("/api/provider/sponsorship/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays }),
      });
      if (!orderRes.ok) throw new Error("order_failed");
      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        order_id: order.razorpayOrderId,
        name: "Barkado & Co.",
        description: `Featured listing — ${durationDays} days`,
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

  return (
    <div className="px-6 space-y-4">
      <div className="card" style={{ background: isActive ? "var(--panel-dark)" : "var(--card)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} color={isActive ? "var(--gold)" : "var(--terracotta)"} />
          <p className="font-bold text-sm" style={{ color: isActive ? "white" : undefined }}>
            {isActive ? "You're featured" : "Get featured"}
          </p>
        </div>
        <p className="text-xs" style={{ color: isActive ? "rgba(255,255,255,0.75)" : "var(--muted)" }}>
          {isActive
            ? `Your listing shows first to owners until ${formatDate(new Date(sponsoredUntil!))}.`
            : "Show up first when owners browse providers, with a small \"Sponsored\" badge on your listing."}
        </p>
      </div>

      <div className="card">
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>
          {isActive ? "Extend your featured listing" : "Choose a plan"}
        </p>
        <div className="space-y-2">
          <button
            onClick={() => buy(7)}
            disabled={busy !== null}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl tap-scale"
            style={{ background: "var(--cream)", border: "1px solid var(--border)", opacity: busy !== null ? 0.6 : 1 }}
          >
            <span className="text-sm font-semibold">1 week</span>
            <span className="text-sm font-bold">{busy === 7 ? "…" : "₹50"}</span>
          </button>
          <button
            onClick={() => buy(30)}
            disabled={busy !== null}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl tap-scale"
            style={{ background: "var(--cream)", border: "1px solid var(--border)", opacity: busy !== null ? 0.6 : 1 }}
          >
            <span className="text-sm font-semibold">1 month</span>
            <span className="text-sm font-bold">{busy === 30 ? "…" : "₹120"}</span>
          </button>
        </div>
        {error && <p className="text-xs mt-3" style={{ color: "var(--terracotta)" }}>{error}</p>}
      </div>
    </div>
  );
}