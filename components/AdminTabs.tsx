"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, ShieldCheck, Users, ClipboardList, ShoppingBag } from "lucide-react";
import NavDrawer from "@/components/NavDrawer";

const TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/providers", label: "Providers", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
];

export default function AdminTabs() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const current = TABS.find((t) => isActive(t.href));

  return (
    <div className="px-6 mb-5">
      <button
        onClick={() => setOpen(true)}
        className="tap-scale flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <Menu size={15} />
        {current?.label ?? "Menu"}
      </button>

      <NavDrawer open={open} onClose={() => setOpen(false)} title="Admin menu">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 tap-scale text-left"
              style={{ background: active ? "var(--cream)" : "transparent" }}
            >
              <Icon size={16} color={active ? "var(--terracotta)" : "var(--muted)"} />
              <span className="text-sm font-medium" style={{ color: active ? "var(--terracotta)" : "inherit" }}>{t.label}</span>
            </Link>
          );
        })}
      </NavDrawer>
    </div>
  );
}