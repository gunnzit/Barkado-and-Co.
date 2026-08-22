"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminProviderVerifyButton({ providerId, verified }: { providerId: string; verified: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setBusy(true);
    await fetch(`/api/admin/providers/${providerId}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: !verified }),
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
        verified
          ? { background: "var(--cream)", color: "var(--muted)", border: "1px solid var(--border)" }
          : { background: "var(--terracotta)", color: "white" }
      }
    >
      {busy ? "…" : verified ? "Revoke" : "Approve"}
    </button>
  );
}