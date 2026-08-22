"use client";

import { useEffect, useState } from "react";
import { PawPrint, Scissors, GraduationCap, Home as HomeIcon } from "lucide-react";

const SERVICE_OPTIONS: { type: "WALKING" | "SITTING" | "GROOMING" | "TRAINING"; label: string; icon: any; priceField: string }[] = [
  { type: "WALKING", label: "Walking", icon: PawPrint, priceField: "pricePerWalk" },
  { type: "SITTING", label: "Sitting", icon: HomeIcon, priceField: "pricePerSitDay" },
  { type: "GROOMING", label: "Grooming", icon: Scissors, priceField: "pricePerGroom" },
  { type: "TRAINING", label: "Training", icon: GraduationCap, priceField: "pricePerTrain" },
];

export default function ProviderServicesEditor() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/provider/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((provider) => {
        if (!provider) return;
        setSelected(new Set(provider.servicesOffered));
        setBio(provider.bio ?? "");
        const priceMap: Record<string, string> = {};
        for (const opt of SERVICE_OPTIONS) {
          const paise = provider[opt.priceField];
          if (paise != null) priceMap[opt.priceField] = String(paise / 100);
        }
        setPrices(priceMap);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const save = async () => {
    if (selected.size === 0) {
      setError("Pick at least one service you offer.");
      return;
    }
    setSaving(true);
    setSaved(false);
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

    const res = await fetch("/api/provider/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save changes.");
    }
  };

  if (loading) return <p className="text-sm px-1" style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs px-1 mb-1" style={{ color: "var(--muted)" }}>
        Choose any combination of services — one, a few, or all of them — and set your price for each.
      </p>
      {SERVICE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = selected.has(opt.type);
        return (
          <div key={opt.type} className="card">
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

      <div className="card">
        <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Bio</label>
        <textarea
          className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
          style={{ borderColor: "var(--border)" }}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      {error && <p className="text-xs" style={{ color: "var(--terracotta)" }}>{error}</p>}

      <button onClick={save} disabled={saving} className="btn-primary w-full tap-scale" style={{ opacity: saving ? 0.6 : 1 }}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
      </button>
    </div>
  );
}