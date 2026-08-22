"use client";

import { useEffect, useState } from "react";

export default function ProviderOnlineToggle() {
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/provider/toggle-online")
      .then((r) => (r.ok ? r.json() : { isAvailableNow: false }))
      .then((data) => setIsAvailableNow(data.isAvailableNow))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setToggling(true);
    const next = !isAvailableNow;
    setIsAvailableNow(next); // optimistic
    const res = await fetch("/api/provider/toggle-online", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailableNow: next }),
    });
    if (!res.ok) setIsAvailableNow(!next); // revert on failure
    setToggling(false);
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      className="tap-scale flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        background: isAvailableNow ? "#e3f0e6" : "var(--card)",
        color: isAvailableNow ? "#2f7a44" : "var(--muted)",
        border: `1px solid ${isAvailableNow ? "#2f7a44" : "var(--border)"}`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: isAvailableNow ? "#2f7a44" : "var(--border)" }}
      />
      {isAvailableNow ? "Available now" : "Offline"}
    </button>
  );
}