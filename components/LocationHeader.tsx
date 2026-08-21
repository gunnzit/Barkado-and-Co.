"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Navigation, Plus, ChevronRight, Home as HomeIcon, Briefcase, Building2, Users, Loader2 } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

type Address = {
  id: string;
  label: string;
  fullAddress: string;
  receiverName: string;
  receiverPhone: string;
  isDefault: boolean;
};

const LABEL_ICON: Record<string, any> = { Home: HomeIcon, Work: Briefcase, Hotel: Building2, Other: Users };

export default function LocationHeader({
  currentAddressSnippet,
  userPhone,
  headline = "Book in a few taps",
}: {
  currentAddressSnippet: string | null;
  userPhone: string | null;
  headline?: string;
}) {
  const [view, setView] = useState<"closed" | "select" | "confirm-current" | "add-new">("closed");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState("");
  const router = useRouter();

  const loadAddresses = () => {
    fetch("/api/addresses")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAddresses)
      .catch(() => {});
  };

  useEffect(() => {
    if (view === "select") loadAddresses();
  }, [view]);

  const openSelect = () => setView("select");
  const close = () => setView("closed");

  const useCurrentLocation = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          setDetectedAddress(data.display_name || "Current location");
        } catch {
          setDetectedAddress("Current location");
        }
        setDetecting(false);
        setView("confirm-current");
      },
      () => {
        setDetecting(false);
        alert("Couldn't get your location — check location permissions.");
      }
    );
  };

  const selectAddress = async (id: string) => {
    await fetch(`/api/addresses/${id}/set-default`, { method: "PATCH" });
    close();
    router.refresh();
  };

  const filtered = query.trim()
    ? addresses.filter((a) => a.fullAddress.toLowerCase().includes(query.toLowerCase()))
    : addresses;

  return (
    <>
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-wide" style={{ color: "var(--muted)" }}>Barkado & Co.</span>
        <span className="text-base font-extrabold leading-tight">{headline}</span>
        <button onClick={openSelect} className="flex items-center gap-1 mt-0.5 tap-scale w-fit">
          <span className="text-xs font-semibold truncate max-w-[50vw] sm:max-w-xs" style={{ color: "var(--terracotta)" }}>
            {currentAddressSnippet ? `HOME - ${currentAddressSnippet}` : "Add delivery address"}
          </span>
          <ChevronRight size={12} color="var(--terracotta)" />
        </button>
      </div>

      {view === "select" && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", zIndex: 100 }} onClick={close}>
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Select delivery location</h3>
              <button onClick={close} className="tap-scale"><X size={20} /></button>
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ background: "var(--cream)" }}>
              <Search size={15} color="var(--muted)" />
              <input
                type="text"
                placeholder="Search for area, street name…"
                className="flex-1 bg-transparent text-sm outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button onClick={useCurrentLocation} disabled={detecting} className="w-full flex items-center gap-3 py-2.5 tap-scale text-left">
              {detecting ? <Loader2 size={16} className="animate-spin" color="var(--terracotta)" /> : <Navigation size={16} color="var(--terracotta)" />}
              <span className="text-sm font-semibold" style={{ color: "var(--terracotta)" }}>
                {detecting ? "Finding your location…" : "Use your current location"}
              </span>
            </button>

            <button onClick={() => setView("add-new")} className="w-full flex items-center gap-3 py-2.5 tap-scale text-left border-t" style={{ borderColor: "var(--border)" }}>
              <Plus size={16} color="var(--terracotta)" />
              <span className="text-sm font-semibold" style={{ color: "var(--terracotta)" }}>Add new address</span>
            </button>

            {filtered.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-2" style={{ color: "var(--muted)" }}>Your saved addresses</p>
                <div className="space-y-2">
                  {filtered.map((a) => {
                    const Icon = LABEL_ICON[a.label] ?? HomeIcon;
                    return (
                      <button
                        key={a.id}
                        onClick={() => selectAddress(a.id)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl text-left tap-scale"
                        style={{ background: a.isDefault ? "var(--cream)" : "transparent", border: "1px solid var(--border)" }}
                      >
                        <Icon size={16} color="var(--muted)" className="mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{a.label}</p>
                          <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{a.fullAddress}</p>
                          <p className="text-xs" style={{ color: "var(--muted)" }}>Phone: {a.receiverPhone}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {view === "confirm-current" && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", zIndex: 110 }}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 text-center" style={{ background: "var(--card)" }}>
            <Navigation size={40} color="var(--terracotta)" className="mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-4">Do you want this order at your current location?</h3>
            <button
              onClick={() => setView("add-new")}
              className="w-full text-left px-4 py-3 rounded-xl mb-2"
              style={{ border: "1px solid var(--terracotta)" }}
            >
              <span className="text-sm font-bold block" style={{ color: "var(--terracotta)" }}>Yes, deliver at my current location</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{detectedAddress}</span>
            </button>
            <button
              onClick={() => setView("add-new")}
              className="w-full text-center px-4 py-3 rounded-xl font-bold text-sm"
              style={{ border: "1px solid var(--border)" }}
            >
              No, at some other location
            </button>
          </div>
        </div>
      )}

      {view === "add-new" && (
        <AddNewAddressForm
          prefillAddress={detectedAddress}
          prefillPhone={userPhone}
          onClose={close}
          onSaved={() => { close(); router.refresh(); }}
        />
      )}
    </>
  );
}

function AddNewAddressForm({
  prefillAddress,
  prefillPhone,
  onClose,
  onSaved,
}: {
  prefillAddress: string;
  prefillPhone: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullAddress, setFullAddress] = useState(prefillAddress);
  const [mapsLink, setMapsLink] = useState("");
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState(prefillPhone ?? "");
  const [label, setLabel] = useState("Home");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        fullAddress,
        googleMapsLink: mapsLink,
        receiverName,
        receiverPhone,
        isDefault: true,
      }),
    });
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save address.");
    }
    setSaving(false);
  };

  const canSave = fullAddress.trim() && receiverName.trim() && receiverPhone.trim();

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: "var(--cream)", zIndex: 120 }}>
      <div className="flex items-center gap-3 px-5 py-4 sticky top-0" style={{ background: "var(--cream)" }}>
        <button onClick={onClose} className="tap-scale">
          <X size={20} />
        </button>
        <h3 className="font-bold text-lg">Add address details</h3>
      </div>

      <div className="px-5 pb-32">
        <div className="card mb-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Address details</p>
          <AddressAutocomplete value={fullAddress} onChange={setFullAddress} placeholder="Enter complete address" />
          <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>Example: 4th Floor, Plot No. B-17, Block B</p>
          <input
            type="text"
            placeholder="Google Maps link (optional)"
            className="w-full border rounded-xl px-3 py-2 text-sm mt-3"
            style={{ borderColor: "var(--border)" }}
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
          />
        </div>

        <div className="card mb-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Contact details</p>
          <div className="flex gap-4 mb-3">
            <button onClick={() => setForSomeoneElse(false)} className="flex items-center gap-2 tap-scale">
              <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: `2px solid ${!forSomeoneElse ? "var(--terracotta)" : "var(--border)"}` }}>
                {!forSomeoneElse && <span className="w-2 h-2 rounded-full" style={{ background: "var(--terracotta)" }} />}
              </span>
              <span className="text-sm">Myself</span>
            </button>
            <button onClick={() => setForSomeoneElse(true)} className="flex items-center gap-2 tap-scale">
              <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: `2px solid ${forSomeoneElse ? "var(--terracotta)" : "var(--border)"}` }}>
                {forSomeoneElse && <span className="w-2 h-2 rounded-full" style={{ background: "var(--terracotta)" }} />}
              </span>
              <span className="text-sm">Someone else</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="Receiver's name"
            className="w-full border rounded-xl px-3 py-2 text-sm mb-2"
            style={{ borderColor: "var(--border)" }}
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Receiver's phone number"
            className="w-full border rounded-xl px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
          />

          <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-2" style={{ color: "var(--muted)" }}>Save address as</p>
          <div className="flex gap-2 flex-wrap">
            {["Home", "Work", "Hotel", "Other"].map((l) => {
              const Icon = LABEL_ICON[l];
              const active = label === l;
              return (
                <button
                  key={l}
                  onClick={() => setLabel(l)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg tap-scale text-xs font-semibold"
                  style={{ border: `1px solid ${active ? "var(--terracotta)" : "var(--border)"}`, color: active ? "var(--terracotta)" : "inherit" }}
                >
                  <Icon size={13} />
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-xs mb-3" style={{ color: "var(--terracotta)" }}>{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "var(--cream)" }}>
        <button onClick={save} disabled={!canSave || saving} className="btn-primary w-full tap-scale" style={{ opacity: canSave ? 1 : 0.5 }}>
          {saving ? "Saving…" : "Next"}
        </button>
      </div>
    </div>
  );
}