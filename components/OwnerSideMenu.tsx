"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Home, PawPrint, GraduationCap, Scissors, BedDouble, ShoppingBag, ShoppingCart, Sparkles, Heart, Calendar, User } from "lucide-react";
import NavDrawer from "@/components/NavDrawer";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/walk-booking", label: "Walks", icon: PawPrint },
  { href: "/training", label: "Training", icon: GraduationCap },
  { href: "/grooming", label: "Groom", icon: Scissors },
  { href: "/sitting", label: "Sitting", icon: BedDouble },
  { href: "/accessories", label: "Shop", icon: ShoppingBag },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/owner/wallet", label: "PawPoints Wallet", icon: Sparkles },
  { href: "/owner/wishlist", label: "Wishlist", icon: Heart },
  { href: "/owner/bookings", label: "Booking History", icon: Calendar },
  { href: "/owner/profile", label: "Profile", icon: User },
];

// Global side-menu trigger — mounted once in layout.tsx (same pattern as
// CartPill/PawPointsBadge), not per-page. Home relies on BottomNav alone
// (same split already used on the provider dashboard: bottom nav for the
// primary destination, a drawer for everything else) — every other owner
// page gets this instead, including several pages (Wallet, Profile,
// Wishlist, Bookings, Cart) that previously had no persistent nav path to
// them at all.
export default function OwnerSideMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fully hidden on provider/admin/auth — those have their own separate
  // navigation entirely. Home is the special case: mobile Home has
  // BottomNav to cover this, but BottomNav is hidden at desktop widths
  // (it's a floating mobile pattern, not meant to render alongside a real
  // desktop header) — so without this, desktop Home would have NO way to
  // reach Wallet/Wishlist/Bookings/Profile at all. `homeOnly` renders the
  // trigger but keeps it CSS-hidden on mobile and visible from `lg:` up,
  // rather than a JS on/off switch, so it responds to actual viewport
  // width rather than route alone.
  const fullyHidden = pathname.startsWith("/provider") || pathname.startsWith("/admin") || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  if (fullyHidden) return null;
  const homeOnly = pathname === "/";

  return (
    <div className={homeOnly ? "hidden lg:block" : undefined}>
      <button
        onClick={() => setOpen(true)}
        className="tap-scale flex items-center justify-center w-10 h-10 rounded-full"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <NavDrawer open={open} onClose={() => setOpen(false)} title="Menu">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 tap-scale text-left"
              style={{ background: active ? "var(--cream)" : "transparent" }}
            >
              <Icon size={16} color={active ? "var(--terracotta)" : "var(--muted)"} />
              <span className="text-sm font-medium" style={{ color: active ? "var(--terracotta)" : "inherit" }}>{item.label}</span>
            </Link>
          );
        })}
      </NavDrawer>
    </div>
  );
}