"use client";

import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import LocationPickerModal from "@/components/LocationPickerModal";

type Address = { id: string; label: string; fullAddress: string; receiverName: string; receiverPhone: string; isDefault: boolean };

export default function CartLocationPill({ userAddress }: { userAddress: string | null }) {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const label = userAddress ? userAddress.split(",")[0] : "Set location";

  const openPicker = async () => {
    setOpen(true);
    if (addresses === null) {
      setLoadingAddresses(true);
      const res = await fetch("/api/addresses");
      if (res.ok) setAddresses(await res.json());
      else setAddresses([]);
      setLoadingAddresses(false);
    }
  };

  return (
    <>
      <button
        onClick={openPicker}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tap-scale mt-1"
        style={{ background: "var(--cream)", color: "var(--muted)" }}
      >
        <MapPin size={11} />
        {label}
        <ChevronDown size={11} />
      </button>
      {open && !loadingAddresses && (
        <LocationPickerModal addresses={addresses ?? []} onClose={() => setOpen(false)} />
      )}
    </>
  );
}