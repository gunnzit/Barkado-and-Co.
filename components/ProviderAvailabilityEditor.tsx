"use client";

import { useEffect, useState } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayHours = { dayOfWeek: number; startTime: string; endTime: string } | null;

export default function ProviderAvailabilityEditor() {
  const [days, setDays] = useState<DayHours[]>(DAYS.map((_, i) => (i >= 1 && i <= 5 ? { dayOfWeek: i, startTime: "09:00", endTime: "18:00" } : null)));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/provider/availability")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { dayOfWeek: number; startTime: string; endTime: string }[]) => {
        if (rows.length === 0) return; // keep the Mon-Fri 9-6 default shown pre-save
        setDays(DAYS.map((_, i) => rows.find((r) => r.dayOfWeek === i) ?? null));
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (i: number) => {
    setDays((prev) => {
      const next = [...prev];
      next[i] = next[i] ? null : { dayOfWeek: i, startTime: "09:00", endTime: "18:00" };
      return next;
    });
  };

  const updateTime = (i: number, field: "startTime" | "endTime", value: string) => {
    setDays((prev) => {
      const next = [...prev];
      const day = next[i];
      if (day) next[i] = { ...day, [field]: value };
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const payload = days.filter((d): d is NonNullable<DayHours> => d !== null);
    const res = await fetch("/api/provider/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) return <p className="text-sm px-1" style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs px-1 mb-2" style={{ color: "var(--muted)" }}>
        Set the days and hours you're actually free to work — owners will see when you're outside these hours.
      </p>
      {DAYS.map((label, i) => {
        const day = days[i];
        return (
          <div key={label} className="card">
            <div className="flex items-center justify-between">
              <button onClick={() => toggleDay(i)} className="flex items-center gap-2.5 tap-scale text-left">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ border: `2px solid ${day ? "var(--terracotta)" : "var(--border)"}`, background: day ? "var(--terracotta)" : "transparent" }}
                />
                <span className="font-semibold text-sm">{label}</span>
              </button>
              {!day && <span className="text-xs" style={{ color: "var(--muted)" }}>Off</span>}
            </div>
            {day && (
              <div className="flex items-center gap-2 mt-2 pl-7">
                <input
                  type="time"
                  value={day.startTime}
                  onChange={(e) => updateTime(i, "startTime", e.target.value)}
                  className="border rounded-lg px-2 py-1 text-xs"
                  style={{ borderColor: "var(--border)" }}
                />
                <span className="text-xs" style={{ color: "var(--muted)" }}>to</span>
                <input
                  type="time"
                  value={day.endTime}
                  onChange={(e) => updateTime(i, "endTime", e.target.value)}
                  className="border rounded-lg px-2 py-1 text-xs"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            )}
          </div>
        );
      })}

      <button onClick={save} disabled={saving} className="btn-primary w-full tap-scale mt-2" style={{ opacity: saving ? 0.6 : 1 }}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save hours"}
      </button>
    </div>
  );
}