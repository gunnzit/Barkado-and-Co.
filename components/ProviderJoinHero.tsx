import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Plum hero for the "Become a provider" page, from the Stitch design
 * (design/stitch/05-become-provider). The photo is an illustrative stand-in
 * generated in Stitch, not a real Barkado provider. Earnings, headcounts and
 * insurance figures from the Stitch mock are left out on purpose: none of
 * them are real yet.
 */
export default function ProviderJoinHero({ compact = false }: { compact?: boolean }) {
  return (
    <div className="px-4 pt-3 pb-5">
      <div className="flex items-center justify-between mb-3">
        <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center tap-scale" style={{ background: "var(--card)", border: "1px solid var(--border)" }} aria-label="Back to home">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--terracotta)" }}>Barkado &amp; Co. Pro</span>
      </div>

      <section className="relative overflow-hidden rounded-[2rem]" style={{ background: "#6e1e3b", boxShadow: "0 12px 28px -6px rgba(110,30,59,0.22)" }}>
        <div className="relative z-10 p-5 pb-9">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "#f9dd8a", color: "#3d1426" }}>
            Chandigarh pro network
          </span>
          <h1 className="mt-2 text-[26px] leading-[1.12] font-bold tracking-tight text-white">
            Turn your love for pets into a career
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "rgba(251,240,217,0.85)" }}>
            Walk, groom, train or host dogs near you. Set your own hours and prices.
          </p>
          {!compact && (
            <img
              src="/images/brand/provider-hero.jpg"
              alt="A smiling dog walker with two happy dogs"
              className="mt-4 w-full h-48 object-cover rounded-[1.5rem]"
            />
          )}
        </div>
        <span className="brand-wave" aria-hidden="true" />
      </section>
    </div>
  );
}

const STEPS = [
  { title: "Apply in about 5 minutes", desc: "Pick your services, add a photo, your ID and a short bio." },
  { title: "ID check", desc: "Our team reviews your documents. Your ID is private and never shown publicly." },
  { title: "Get approved", desc: "You'll get an email as soon as your profile goes live." },
  { title: "Start getting bookings", desc: "Pet parents nearby can book you during the hours you set." },
];

/** "How it works" timeline with numbered golden circles. */
export function ProviderHowItWorks() {
  return (
    <section className="card !p-5">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Getting started</p>
      <h2 className="text-lg font-bold mb-4">How it works</h2>
      <ol className="relative space-y-4">
        <span className="absolute left-[15px] top-2 bottom-2 w-px" style={{ background: "repeating-linear-gradient(to bottom, rgba(110,30,59,0.25) 0 4px, transparent 4px 8px)" }} aria-hidden="true" />
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex items-start gap-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: "#f9dd8a", color: "#3d1426", border: "2px solid #6e1e3b", fontFamily: "var(--font-heading)" }}>
              {i + 1}
            </span>
            <div className="pt-0.5">
              <p className="font-bold text-sm">{s.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
