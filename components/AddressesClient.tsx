"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Check, Trash2, Home, Briefcase, Loader2 } from "lucide-react";

type Address = { id: string; label: string; fullAddress: string; receiverName: string; receiverPhone: string; isDefault: boolean };

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const MUTED = "#5e4752";
const YELLOW = "#f9dd8a";
const H = { fontFamily: "var(--font-heading)" } as const;
const LABELS = ["Home", "Work", "Other"] as const;

export default function AddressesClient({
  initial,
  currentAddress,
  defaultName,
  defaultPhone,
}: {
  initial: Address[];
  currentAddress: string | null;
  defaultName: string;
  defaultPhone: string | null;
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(initial.length === 0);
  const [error, setError] = useState<string | null>(null);

  // A delivery address typed elsewhere (older accounts) that isn't saved as a card yet.
  const legacy = currentAddress && !addresses.some((a) => a.fullAddress.trim() === currentAddress.trim()) ? currentAddress : null;

  const [form, setForm] = useState({ label: "Home", fullAddress: legacy ?? "", receiverName: defaultName, receiverPhone: defaultPhone ?? "" });

  const reload = async () => {
    const res = await fetch("/api/addresses");
    if (res.ok) setAddresses(await res.json());
    router.refresh();
  };

  const makeDefault = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/addresses/${id}`, { method: "PATCH" });
    await reload();
    setBusyId(null);
  };

  const remove = async (a: Address) => {
    if (!window.confirm(`Remove "${a.label}" address?`)) return;
    setBusyId(a.id);
    await fetch(`/api/addresses/${a.id}`, { method: "DELETE" });
    await reload();
    setBusyId(null);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.fullAddress.trim().length < 8) return setError("Please enter the full address, with house number and area.");
    if (form.receiverName.trim().length < 2) return setError("Who should the pro ask for?");
    if (form.receiverPhone.replace(/\D/g, "").length < 10) return setError("Please enter a 10-digit mobile number.");
    setBusyId("new");
    const res = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setBusyId(null);
    if (!res.ok) return setError("Couldn't save that address. Please check the details.");
    setAdding(false);
    setForm({ label: "Home", fullAddress: "", receiverName: defaultName, receiverPhone: defaultPhone ?? "" });
    await reload();
  };

  return (
    <div className="space-y-3">
      {legacy && !adding && (
        <div className="enter-up rounded-[1.5rem] p-4" style={{ background: "#fef3dc", border: "1px dashed rgba(61,20,38,0.2)" }}>
          <p className="text-xs font-bold" style={{ color: MUTED }}>Current delivery address</p>
          <p className="text-sm mt-1" style={{ color: INK }}>{legacy}</p>
          <button type="button" onClick={() => { setForm((f) => ({ ...f, fullAddress: legacy })); setAdding(true); }} className="mt-3 text-xs font-bold underline underline-offset-2" style={{ color: PLUM }}>
            Save it as a card
          </button>
        </div>
      )}

      {addresses.map((a, i) => {
        const Icon = a.label === "Work" ? Briefcase : a.label === "Home" ? Home : MapPin;
        return (
          <div key={a.id} className="enter-up motion-select rounded-[1.5rem] p-4" style={{ ["--d" as string]: `${i * 40}ms`, background: "#ffffff", border: `1.5px solid ${a.isDefault ? PLUM : "rgba(61,20,38,0.08)"}`, boxShadow: "0 8px 24px -4px rgba(61,20,38,0.06)" }}>
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: a.isDefault ? PLUM : "#fef3dc" }}>
                <Icon size={17} color={a.isDefault ? YELLOW : PLUM} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-bold text-sm" style={{ ...H, color: INK }}>
                  {a.label}
                  {a.isDefault && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: YELLOW, color: INK }}>In use</span>}
                </p>
                <p className="text-sm mt-0.5" style={{ color: INK }}>{a.fullAddress}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>{a.receiverName} · {a.receiverPhone}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              {!a.isDefault && (
                <button type="button" disabled={busyId !== null} onClick={() => makeDefault(a.id)} className="tap-scale inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold" style={{ background: PLUM, color: "white" }}>
                  {busyId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Use this address
                </button>
              )}
              <button type="button" disabled={busyId !== null} onClick={() => remove(a)} aria-label={`Remove ${a.label} address`} className="tap-scale w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.1)" }}>
                <Trash2 size={14} color={MUTED} />
              </button>
            </div>
          </div>
        );
      })}

      {adding ? (
        <form onSubmit={add} className="enter-up rounded-[1.5rem] p-4 space-y-3" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.08)" }}>
          <p className="font-bold text-sm" style={{ ...H, color: PLUM }}>New address</p>
          <div className="flex gap-2">
            {LABELS.map((l) => (
              <button key={l} type="button" onClick={() => setForm({ ...form, label: l })} aria-pressed={form.label === l} className="motion-select tap-scale px-4 py-2 rounded-full text-xs font-bold" style={{ background: form.label === l ? PLUM : "#fffaf0", color: form.label === l ? "white" : INK, border: `1px solid ${form.label === l ? PLUM : "rgba(61,20,38,0.12)"}` }}>
                {l}
              </button>
            ))}
          </div>
          <textarea value={form.fullAddress} onChange={(e) => setForm({ ...form, fullAddress: e.target.value })} rows={3} placeholder="House 599, Sector 16, Chandigarh" aria-label="Full address" className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none" style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.12)", color: INK }} />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} placeholder="Contact name" aria-label="Contact name" className="h-11 px-4 rounded-2xl text-sm outline-none" style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.12)", color: INK }} />
            <input value={form.receiverPhone} onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })} placeholder="Mobile" inputMode="tel" aria-label="Contact mobile" className="h-11 px-4 rounded-2xl text-sm outline-none" style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.12)", color: INK }} />
          </div>
          {error && <p className="enter-fade text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: "#fdf1d6", color: "#8a2a4d" }}>{error}</p>}
          <div className="flex gap-2">
            {addresses.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className="tap-scale flex-1 h-11 rounded-full text-sm font-bold" style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.12)", color: INK }}>Cancel</button>
            )}
            <button type="submit" disabled={busyId === "new"} className="tap-scale flex-1 h-11 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2" style={{ background: PLUM, color: "white", ...H }}>
              {busyId === "new" ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : "Save address"}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="hover-lift tap-scale w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-bold" style={{ border: "2px dashed rgba(61,20,38,0.2)", color: PLUM }}>
          <Plus size={16} /> Add an address
        </button>
      )}
    </div>
  );
}
