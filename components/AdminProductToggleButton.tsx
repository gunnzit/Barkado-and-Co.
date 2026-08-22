"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminProductToggleButton({ productId, active }: { productId: string; active: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setBusy(true);
    await fetch(`/api/admin/products/${productId}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="tap-scale text-xs font-semibold px-3 py-1.5 rounded-full"
      style={
        active
          ? { background: "var(--cream)", color: "var(--muted)", border: "1px solid var(--border)" }
          : { background: "var(--terracotta)", color: "white" }
      }
    >
      {busy ? "…" : active ? "Deactivate" : "Activate"}
    </button>
  );
}