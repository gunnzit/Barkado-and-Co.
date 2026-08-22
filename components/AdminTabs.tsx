"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShieldCheck, Users, ClipboardList, ShoppingBag } from "lucide-react";

const TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/providers", label: "Providers", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 px-6 mb-5 overflow-x-auto no-scrollbar">
      {TABS.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="tap-scale px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0"
            style={{
              background: active ? "var(--panel-dark)" : "var(--card)",
              color: active ? "white" : "inherit",
              border: "1px solid var(--border)",
            }}
          >
            <Icon size={13} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}