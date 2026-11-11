"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import PartnerBrandPopup from "@/components/PartnerBrandPopup";

export default function PartnerBrandTag({
  partnerBrandId,
  partnerBrandName,
}: {
  partnerBrandId: string;
  partnerBrandName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full tap-scale"
        style={{ background: "rgba(110,30,59,0.12)", color: "var(--terracotta)", border: "1px solid rgba(110,30,59,0.3)" }}
      >
        <Store size={10} /> Product from {partnerBrandName}
      </button>
      {open && (
        <PartnerBrandPopup
          partnerBrandId={partnerBrandId}
          partnerBrandName={partnerBrandName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}