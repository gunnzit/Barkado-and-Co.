"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Prefs = { notifyBookingUpdates: boolean; notifyVaccineReminders: boolean; notifyPromotions: boolean };

const ROWS: { key: keyof Prefs; label: string; sub: string }[] = [
  { key: "notifyBookingUpdates", label: "Booking updates", sub: "Accepted, started, completed, and cancelled bookings" },
  { key: "notifyVaccineReminders", label: "Vaccine reminders", sub: "When a booster is coming due or overdue" },
  { key: "notifyPromotions", label: "Offers & promotions", sub: "Occasional deals and PawPoints rewards" },
];

export default function NotificationsClient({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);

  const toggle = async (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(key);
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
    setSaving(null);
  };

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto px-6 py-10">
        <Link href="/owner/profile" className="flex items-center gap-2 tap-scale mb-4" style={{ color: "var(--muted)" }}>
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to profile</span>
        </Link>
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>

        <div className="card p-0 divide-y" style={{ borderColor: "var(--border)" }}>
          {ROWS.map((row, i) => (
            <div key={row.key} className="flex items-center justify-between gap-3 px-5 py-4" style={i !== ROWS.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}>
              <div>
                <p className="text-sm font-semibold">{row.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{row.sub}</p>
              </div>
              <button
                onClick={() => toggle(row.key)}
                disabled={saving === row.key}
                className="w-11 h-6 rounded-full relative tap-scale shrink-0"
                style={{ background: prefs[row.key] ? "var(--terracotta)" : "var(--border)" }}
                aria-label={`Toggle ${row.label}`}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: prefs[row.key] ? 22 : 2 }}
                />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}