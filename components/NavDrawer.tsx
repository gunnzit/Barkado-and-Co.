"use client";

import { X } from "lucide-react";

export default function NavDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div
        className="fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[82vw] overflow-y-auto nav-drawer-in"
        style={{ background: "var(--card)", boxShadow: "8px 0 32px rgba(0,0,0,0.18)" }}
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="font-bold text-sm">{title ?? "Menu"}</p>
          <button onClick={onClose} className="tap-scale p-1" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="py-2">{children}</div>
      </div>

      <style jsx>{`
        @keyframes navDrawerIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .nav-drawer-in {
          animation: navDrawerIn 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </>
  );
}