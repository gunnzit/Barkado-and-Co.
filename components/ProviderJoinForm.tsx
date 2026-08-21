"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Scissors, GraduationCap, Home as HomeIcon } from "lucide-react";

const SERVICE_OPTIONS: { type: "WALKING" | "SITTING" | "GROOMING" | "TRAINING"; label: string; icon: any; priceField: string }[] = [
  { type: "WALKING", label: "Walking", icon: PawPrint, priceField: "pricePerWalk" },
  { type: "SITTING", label: "Sitting", icon: HomeIcon, priceField: "pricePerSitDay" },
  { type: "GROOMING", label: "Grooming", icon: Scissors, priceField: "pricePerGroom" },
  { type: "TRAINING", label: "Training", icon: GraduationCap, priceField: "pricePerTrain" },
];

export default function ProviderJoinForm() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggle = (type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0) {
      setError("Pick at least one service you'll offer.");
      return;
    }
    setSubmitting(true);
    setError("");

    const body: Record<string, any> = {
      bio: bio || undefined,
      servicesOffered: Array.from(selected),
    };
    for (const opt of SERVICE_OPTIONS) {
      if (selected.has(opt.type) && prices[opt.priceField]) {
        body[opt.priceField] = Number(prices[opt.priceField]);
      }
    }

    const res = await fetch("/api/provider/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/provider");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't set up your provider profile.");
      setSubmitting(false);
    }
  };

  return (
    <div className="px-6">
      <div className="card space-y-3 mb-4">
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Services you'll offer</p>
        {SERVICE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = selected.has(opt.type);
          return (
            <div key={opt.type} className="rounded-xl p-3" style={{ border: `1px solid ${active ? "var(--terracotta)" : "var(--border)"}` }}>
              <button onClick={() => toggle(opt.type)} className="w-full flex items-center gap-3 tap-scale text-left">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                  <Icon size={16} color="var(--terracotta)" />
                </div>
                <span className="font-semibold text-sm flex-1">{opt.label}</span>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ border: `2px solid ${active ? "var(--terracotta)" : "var(--border)"}`, background: active ? "var(--terracotta)" : "transparent" }}
                />
              </button>
              {active && (
                <div className="mt-2 pl-12">
                  <label className="text-xs" style={{ color: "var(--muted)" }}>Price (₹)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full border rounded-lg px-3 py-1.5 text-sm mt-1"
                    style={{ borderColor: "var(--border)" }}
                    value={prices[opt.priceField] ?? ""}
                    onChange={(e) => setPrices((p) => ({ ...p, [opt.priceField]: e.target.value }))}
                    placeholder="e.g. 299"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card mb-4">
        <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Short bio (optional)</label>
        <textarea
          className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
          style={{ borderColor: "var(--border)" }}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A line or two about yourself"
        />
      </div>

      {error && <p className="text-xs mb-3" style={{ color: "var(--terracotta)" }}>{error}</p>}

      <button onClick={submit} disabled={submitting} className="btn-primary w-full tap-scale" style={{ opacity: submitting ? 0.6 : 1 }}>
        {submitting ? "Setting up…" : "Start providing services"}
      </button>
    </div>
  );
}