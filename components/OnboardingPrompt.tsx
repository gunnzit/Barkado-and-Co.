"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddressAutocomplete from "@/components/AddressAutocomplete";

export default function OnboardingPrompt({
  needsPhone,
  needsAddress,
}: {
  needsPhone: boolean;
  needsAddress: boolean;
}) {
  const [open, setOpen] = useState(needsPhone || needsAddress);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!open) return null;

  const canSave = (!needsPhone || phone.trim()) && (!needsAddress || address.trim());

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, address }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save — try again.");
      }
    } catch {
      setError("Couldn't save — try again.");
    }
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6 vaccine-modal-backdrop"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 100 }}
    >
      <div className="card w-full max-w-sm vaccine-modal-pop" style={{ background: "var(--card)" }}>
        <h3 className="font-bold text-lg mb-1">Just one quick thing</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          We'll only ask for this once — it'll be used automatically for every booking after this.
        </p>

        {needsPhone && (
          <div className="mb-3">
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted)" }}>Mobile number</label>
            <input
              type="tel"
              placeholder="98765 43210"
              className="w-full border rounded-xl px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        {needsAddress && (
          <div className="mb-4">
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted)" }}>Address</label>
            <AddressAutocomplete value={address} onChange={setAddress} placeholder="Address" />
          </div>
        )}

        {error && <p className="text-xs mb-2" style={{ color: "var(--terracotta)" }}>{error}</p>}

        <button
          onClick={save}
          disabled={!canSave || saving}
          className="btn-primary w-full tap-scale"
          style={{ opacity: canSave ? 1 : 0.5 }}
        >
          {saving ? "Saving…" : "Save and continue"}
        </button>
      </div>
    </div>
  );
}