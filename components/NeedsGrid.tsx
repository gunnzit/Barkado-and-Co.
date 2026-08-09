"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PawPrint, Scissors, Stethoscope, Home as HomeIcon, ShoppingBag } from "lucide-react";
import WalkTransition from "@/components/WalkTransition";

const NEEDS = [
  { label: "Walk", icon: PawPrint, href: "/book?service=WALKING", soon: false, animated: true },
  { label: "Groom", icon: Scissors, href: "#", soon: true, animated: false },
  { label: "Vet", icon: Stethoscope, href: "/owner/pets", soon: false, animated: false },
  { label: "Sit", icon: HomeIcon, href: "/book?service=SITTING", soon: false, animated: false },
  { label: "Shop", icon: ShoppingBag, href: "/accessories", soon: false, animated: false },
];

export default function NeedsGrid() {
  const [showWalkAnim, setShowWalkAnim] = useState(false);
  const router = useRouter();

  if (showWalkAnim) {
    return <WalkTransition onDone={() => router.push("/book?service=WALKING")} />;
  }

  return (
    <section className="max-w-6xl mx-auto px-6 mb-16">
      <div className="card" style={{ background: "white" }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>My pet needs...</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {NEEDS.map((need) => {
            const Icon = need.icon;
            if (need.animated) {
              return (
                <button
                  key={need.label}
                  onClick={() => setShowWalkAnim(true)}
                  className="rounded-xl border flex flex-col items-center gap-2 py-5 tap-scale"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Icon size={20} color="var(--terracotta)" strokeWidth={1.75} />
                  <p className="font-semibold text-xs">{need.label}</p>
                </button>
              );
            }
            const Wrapper = need.soon ? "div" : Link;
            const wrapperProps = need.soon ? {} : { href: need.href };
            return (
              <Wrapper
                key={need.label}
                {...(wrapperProps as any)}
                className={`rounded-xl border flex flex-col items-center gap-2 py-5 ${need.soon ? "" : "tap-scale"}`}
                style={{ opacity: need.soon ? 0.5 : 1, borderColor: "var(--border)" }}
              >
                <Icon size={20} color="var(--terracotta)" strokeWidth={1.75} />
                <p className="font-semibold text-xs">{need.label}</p>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
