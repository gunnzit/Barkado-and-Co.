"use client";

import { LayoutDashboard, Inbox, Calendar, History as HistoryIcon, Wallet, Settings, Clock, ShieldCheck, Sparkles, User, PawPrint } from "lucide-react";

export type ProviderTab = "home" | "requests" | "schedule" | "history" | "earnings" | "services" | "hours" | "verification" | "promote" | "account";

const ITEMS: { key: ProviderTab; label: string; icon: any }[] = [
  { key: "home", label: "Home", icon: LayoutDashboard },
  { key: "requests", label: "Requests", icon: Inbox },
  { key: "schedule", label: "Schedule", icon: Calendar },
  { key: "history", label: "History", icon: HistoryIcon },
  { key: "earnings", label: "Earnings", icon: Wallet },
  { key: "services", label: "Services", icon: Settings },
  { key: "hours", label: "Hours", icon: Clock },
  { key: "verification", label: "Verification", icon: ShieldCheck },
  { key: "promote", label: "Promote", icon: Sparkles },
  { key: "account", label: "My Account", icon: User },
];

// Desktop-only (lg:flex) sidebar nav — replaces the mobile bottom nav +
// hamburger drawer combo entirely at wider widths, since there's enough
// room to show every tab at once with no split needed. Sticky within
// ProviderDashboard's own flex layout, not a page-level fixed element, so
// it doesn't need to coordinate positioning with the header in
// app/provider/page.tsx.
export default function ProviderSidebar({
  active,
  onSelect,
  counts,
}: {
  active: ProviderTab;
  onSelect: (tab: ProviderTab) => void;
  counts?: Partial<Record<ProviderTab, number>>;
}) {
  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 rounded-2xl lg:sticky"
      style={{ width: 260, background: "var(--card)", border: "1px solid var(--border)", top: 24, alignSelf: "flex-start" }}
    >
      <div className="p-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <PawPrint size={22} color="var(--forest, #16281f)" />
        <div>
          <p className="font-bold text-sm">Barkado Pro</p>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Professional Dashboard</p>
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const count = counts?.[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className="tap-scale w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
              style={{
                background: isActive ? "var(--panel-dark)" : "transparent",
                color: isActive ? "white" : "inherit",
              }}
            >
              <Icon size={17} color={isActive ? "white" : "var(--muted)"} />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {count != null && count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: isActive ? "rgba(255,255,255,0.2)" : "var(--terracotta)", color: "white" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}