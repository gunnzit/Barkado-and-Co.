"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, X } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

export default function AddressBadge({ address }: { address: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(address ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!address && !editing) return null;

  const save = async () => {
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: value }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="fixed top-3 left-3 sm:top-5 sm:left-5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full tap-scale max-w-[65vw] sm:max-w-xs"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <MapPin size={12} color="var(--terracotta)" className="shrink-0" />
        <span className="text-xs font-medium truncate">{address}</span>
      </button>

      {editing && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6 vaccine-modal-backdrop"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 100 }}
          onClick={() => setEditing(false)}
        >
          <div className="card w-full max-w-sm vaccine-modal-pop" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Update address</h3>
              <button onClick={() => setEditing(false)} className="tap-scale">
                <X size={18} />
              </button>
            </div>
            <AddressAutocomplete value={value} onChange={setValue} placeholder="Address" />
            <button onClick={save} disabled={saving || !value.trim()} className="btn-primary w-full tap-scale mt-3">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}