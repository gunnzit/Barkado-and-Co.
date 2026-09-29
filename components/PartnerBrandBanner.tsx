import { Store } from "lucide-react";

// Real, conditional — only rendered by the calling page when at least one
// real Product is actually tagged with this partner brand. The wording
// itself is fixed per explicit instruction, but its appearance is always
// tied to real tagged data, never shown unconditionally.
export default function PartnerBrandBanner({ partnerBrandName }: { partnerBrandName: string }) {
  return (
    <div className="mx-6 mb-6 p-4 rounded-2xl flex items-center gap-3" style={{ background: "var(--panel-dark)", color: "white" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
        <Store size={20} color="var(--gold)" />
      </div>
      <p className="font-bold text-sm leading-snug">
        Barkado &amp; Co. products are proudly provided by {partnerBrandName}
      </p>
    </div>
  );
}