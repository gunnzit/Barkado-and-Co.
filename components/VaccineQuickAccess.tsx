"use client";

import Link from "next/link";
import { Syringe } from "lucide-react";

export default function VaccineQuickAccess() {
  return (
    <Link
      href="/owner/vaccines"
      className="fixed bottom-24 left-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full tap-scale shadow-lg"
      style={{ background: "var(--panel-dark)", color: "white" }}
      aria-label="Vaccines"
    >
      <Syringe size={18} />
      <span className="text-sm font-bold hidden sm:inline">Vaccines</span>
    </Link>
  );
}