"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Search, LocateFixed, Home as HomeIcon, Building2, Users, MoreVertical, Plus, ArrowRight, PawPrint } from "lucide-react";

const H = { fontFamily: "var(--font-heading)" } as const;

type Address = {
  id: string;
  label: string;
  fullAddress: string;
  receiverName: string;
  receiverPhone: string;
  isDefault: boolean;
};

function iconFor(label: string) {
  const l = label.toLowerCase();
  if (l.includes("work") || l.includes("office") || l.includes("studio")) return Building2;
  if (l.includes("family") || l.includes("parent")) return Users;
  return HomeIcon;
}

export default function LocationPickerModal({
  addresses: initialAddresses,
  onClose,
}: {
  addresses: Address[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null);
  const [confirming, setConfirming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newForm, setNewForm] = useState({ label: "", fullAddress: "", receiverName: "", receiverPhone: "" });

  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "ok" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ok");
      },
      () => setGpsStatus("error"),
      { timeout: 8000 }
    );
  };

  const filtered = addresses.filter((a) =>
    query.trim() === "" ||
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.fullAddress.toLowerCase().includes(query.toLowerCase())
  );

  const selected = addresses.find((a) => a.id === selectedId);

  const confirm = async () => {
    if (!selectedId) return;
    setConfirming(true);
    const res = await fetch(`/api/addresses/${selectedId}`, { method: "PATCH" });
    setConfirming(false);
    if (res.ok) {
      router.refresh();
      onClose();
    }
  };

  const saveNewAddress = async () => {
    if (!newForm.label.trim() || !newForm.fullAddress.trim() || !newForm.receiverName.trim() || !newForm.receiverPhone.trim()) return;
    setSavingNew(true);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      const created = await res.json();
      setAddresses((prev) => [...prev, created]);
      setSelectedId(created.id);
      setNewForm({ label: "", fullAddress: "", receiverName: "", receiverPhone: "" });
      setAdding(false);
    }
    setSavingNew(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "rgba(2,18,10,0.5)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden" style={{ background: "#fbfaee" }}>
        <div className="px-5 pt-5 pb-3 flex items-start justify-between shrink-0">
          <div>
            <h2 className="font-extrabold text-lg" style={{ ...H, color: "#02120a" }}>Select Service Location</h2>
            <p className="text-xs mt-0.5" style={{ color: "#424844" }}>For seamless doorstep grooming, walks &amp; deliveries</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 tap-scale" style={{ background: "#efeee3" }}>
            <X size={16} color="#02120a" />
          </button>
        </div>

        <div className="px-5 pb-3 overflow-y-auto flex-1">
          <div className="relative mb-3">
            <Search size={16} color="#737874" className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl text-sm"
              style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.4)" }}
              placeholder="Search area, apartment, street or landmark..."
            />
          </div>

          <button
            onClick={useCurrentLocation}
            className="w-full flex items-center justify-between p-3 rounded-xl mb-4 tap-scale"
            style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.3)" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fdece5" }}>
                <LocateFixed size={17} color="#904c2c" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-xs" style={{ ...H, color: "#02120a" }}>Use Current Location</p>
                <p className="text-[11px] truncate" style={{ color: "#424844" }}>
                  {gpsStatus === "idle" && "Tap to detect your location"}
                  {gpsStatus === "locating" && "Locating…"}
                  {gpsStatus === "ok" && coords && `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} — address lookup not set up yet`}
                  {gpsStatus === "error" && "Couldn't get your location"}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: gpsStatus === "ok" ? "#d2e8d9" : "#e9e9dd", color: gpsStatus === "ok" ? "#0d1f16" : "#424844" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: gpsStatus === "ok" ? "#10b981" : "#737874" }} />
              {gpsStatus === "ok" ? "GPS FIX" : "GPS"}
            </span>
          </button>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#737874" }}>Saved Addresses</span>
          </div>

          <div className="flex flex-col gap-2.5 mb-3">
            {filtered.map((a) => {
              const Icon = iconFor(a.label);
              const isSelected = a.id === selectedId;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className="w-full text-left p-3 rounded-xl tap-scale"
                  style={{ background: "#ffffff", border: isSelected ? "1.5px solid #904c2c" : "1px solid rgba(194,200,194,0.3)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fdece5" }}>
                        <Icon size={16} color="#904c2c" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs" style={{ ...H, color: "#02120a" }}>{a.label}</span>
                          {a.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background: "#ffdbcd", color: "#904c2c" }}>Primary</span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: "#424844" }}>{a.fullAddress}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#737874" }}>{a.receiverName} · {a.receiverPhone}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#904c2c", color: "white" }}>✓</span>
                    ) : (
                      <MoreVertical size={16} color="#737874" className="shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {adding ? (
            <div className="p-3 rounded-xl flex flex-col gap-2" style={{ background: "#ffffff", border: "1px dashed rgba(194,200,194,0.5)" }}>
              <input className="h-9 px-3 rounded-lg text-xs" style={{ border: "1px solid rgba(194,200,194,0.4)" }} placeholder="Label (e.g. Home, Office)" value={newForm.label} onChange={(e) => setNewForm({ ...newForm, label: e.target.value })} />
              <input className="h-9 px-3 rounded-lg text-xs" style={{ border: "1px solid rgba(194,200,194,0.4)" }} placeholder="Full address" value={newForm.fullAddress} onChange={(e) => setNewForm({ ...newForm, fullAddress: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="h-9 px-3 rounded-lg text-xs" style={{ border: "1px solid rgba(194,200,194,0.4)" }} placeholder="Receiver name" value={newForm.receiverName} onChange={(e) => setNewForm({ ...newForm, receiverName: e.target.value })} />
                <input className="h-9 px-3 rounded-lg text-xs" style={{ border: "1px solid rgba(194,200,194,0.4)" }} placeholder="Phone" value={newForm.receiverPhone} onChange={(e) => setNewForm({ ...newForm, receiverPhone: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAdding(false)} className="flex-1 h-9 rounded-lg text-xs font-semibold" style={{ background: "#efeee3", color: "#02120a" }}>Cancel</button>
                <button onClick={saveNewAddress} disabled={savingNew} className="flex-1 h-9 rounded-lg text-xs font-bold" style={{ background: "#02120a", color: "white" }}>{savingNew ? "Saving…" : "Save Address"}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl font-bold text-xs tap-scale" style={{ background: "#fdece5", color: "#904c2c" }}>
              <Plus size={15} /> Add New Address
            </button>
          )}

          <div className="flex items-start gap-2.5 p-3 rounded-xl mt-3 opacity-70" style={{ background: "#efeee3" }} title="Placeholder — real access notes/gate codes not built yet">
            <PawPrint size={16} color="#904c2c" className="shrink-0 mt-0.5" />
            <p className="text-[10px] leading-snug" style={{ color: "#424844" }}>
              <span className="font-bold">Pet-Specific Access Notes</span> — gate codes, lift instructions, and handling cues aren't tracked per-address yet.
            </p>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between gap-3 shrink-0" style={{ background: "#02120a" }}>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(228,227,215,0.7)" }}>Selected Location</p>
            <p className="text-xs font-bold truncate" style={{ color: "white", ...H }}>{selected ? `${selected.fullAddress.split(",")[0]} • ${selected.label}` : "No address selected"}</p>
          </div>
          <button
            onClick={confirm}
            disabled={!selectedId || confirming}
            className="shrink-0 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 tap-scale"
            style={{ background: "#904c2c", color: "white", ...H, opacity: selectedId ? 1 : 0.5 }}
          >
            {confirming ? "Saving…" : "Confirm Location"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}