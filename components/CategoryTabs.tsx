"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PawPrint, Scissors, GraduationCap, Stethoscope, Home as HomeIcon,
  Syringe, ShoppingBag, Plane, Heart,
} from "lucide-react";

const CATEGORIES = [
  { label: "Walk", icon: PawPrint, href: "/walk-booking", soon: false },
  { label: "Groom", icon: Scissors, href: "/grooming", soon: false },
  { label: "Train", icon: GraduationCap, href: "/training", soon: false },
  { label: "Vet", icon: Stethoscope, href: "/owner/pets", soon: false },
  { label: "Sit", icon: HomeIcon, href: "/sitting", soon: false },
  { label: "Vaccines", icon: Syringe, href: "/owner/vaccines", soon: false },
  { label: "Shop", icon: ShoppingBag, href: "/accessories", soon: false },
  { label: "Travel", icon: Plane, href: "#", soon: true },
  { label: "Adopt", icon: Heart, href: "#", soon: true },
];

export default function CategoryTabs() {
  const [toast, setToast] = useState<string | null>(null);

  const showSoonToast = (label: string) => {
    setToast(`${label} is coming soon!`);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div
      className="sticky top-0 z-30 backdrop-blur"
      style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex gap-5 sm:gap-7 px-4 sm:px-6 py-3 overflow-x-auto max-w-6xl mx-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const content = (
            <div className="flex flex-col items-center gap-1 shrink-0" style={{ opacity: cat.soon ? 0.5 : 1 }}>
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <Icon size={18} color="var(--terracotta)" strokeWidth={1.75} />
              </span>
              <span className="text-[11px] font-semibold whitespace-nowrap">{cat.label}</span>
            </div>
          );

          return cat.soon ? (
            <button key={cat.label} onClick={() => showSoonToast(cat.label)} className="tap-scale">
              {content}
            </button>
          ) : (
            <Link key={cat.label} href={cat.href} className="tap-scale">
              {content}
            </Link>
          );
        })}
      </div>

      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg animate-fade-up"
          style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))", background: "var(--forest)", color: "var(--cream)", zIndex: 90 }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}