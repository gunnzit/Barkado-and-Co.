"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

// Global, real, live balance badge — mounted once in layout.tsx (same
// pattern as CartPill), not per-page. Renders nothing for signed-out
// visitors or while loading, rather than showing a fake/zero placeholder.
export default function PawPointsBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/owner/pawpoints")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBalance(data ? data.balance : null))
      .catch(() => setBalance(null));
  }, []);

  if (balance === null) return null;

  return (
    <Link
      href="/owner/wallet"
      className="tap-scale flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      aria-label="PawPoints balance"
    >
      <Sparkles size={13} color="var(--gold)" />
      {balance.toLocaleString("en-IN")} <span className="font-medium" style={{ color: "var(--muted)" }}>pts</span>
    </Link>
  );
}