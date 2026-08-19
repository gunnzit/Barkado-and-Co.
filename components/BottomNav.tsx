"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, PawPrint, GraduationCap, Syringe, ShoppingBag, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const [currentService, setCurrentService] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentService(new URLSearchParams(window.location.search).get("service"));
    }
  }, [pathname]);

  const isBook = pathname === "/book";

  const items = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/owner/dashboard",
      label: "Walks",
      icon: PawPrint,
      active: pathname === "/owner/dashboard" || pathname === "/walk-booking",
    },
    {
      href: "/training",
      label: "Training",
      icon: GraduationCap,
      active: pathname === "/training",
    },
    {
      href: "/owner/vaccines",
      label: "Vaccines",
      icon: Syringe,
      active: pathname === "/owner/vaccines",
    },
    {
      href: "/accessories",
      label: "Shop",
      icon: ShoppingBag,
      active: pathname === "/accessories",
    },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.label} href={item.href} className={`tap-scale ${item.active ? "active" : ""}`}>
            <Icon size={19} strokeWidth={item.active ? 2.5 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}