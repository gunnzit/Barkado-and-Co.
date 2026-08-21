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
    <div className="category-tabs sticky top-0 z-30">
      <div className="flex gap-5 sm:gap-7 px-4 sm:px-6 py-3 overflow-x-auto max-w-6xl mx-auto no-scrollbar">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          const content = (
            <div
              className="category-tab-in flex flex-col items-center gap-1.5 shrink-0"
              style={{ opacity: cat.soon ? 0.5 : 1, animationDelay: `${i * 55}ms` }}
            >
              <span
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <Icon size={22} color="var(--terracotta)" strokeWidth={1.75} />
              </span>
              <span className="text-xs font-semibold whitespace-nowrap">{cat.label}</span>
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

      <style jsx>{`
        @keyframes categoryTabIn {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .category-tab-in {
          animation: categoryTabIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}