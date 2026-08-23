"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, PawPrint, GraduationCap, Scissors, ShoppingBag, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const [currentService, setCurrentService] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, visible: false });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentService(new URLSearchParams(window.location.search).get("service"));
    }
  }, [pathname]);

  const updateGlow = (clientX: number, clientY: number) => {
    const rect = navRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlow({ x: clientX - rect.left, y: clientY - rect.top, visible: true });
  };

  const hideGlow = () => setGlow((g) => ({ ...g, visible: false }));

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
      href: "/grooming",
      label: "Groom",
      icon: Scissors,
      active: pathname === "/grooming",
    },
    {
      href: "/accessories",
      label: "Shop",
      icon: ShoppingBag,
      active: pathname === "/accessories",
    },
  ];

  return (
    <nav
      ref={navRef}
      className="bottom-nav bottom-nav-glow-container"
      onMouseMove={(e) => updateGlow(e.clientX, e.clientY)}
      onMouseLeave={hideGlow}
      onTouchStart={(e) => updateGlow(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => updateGlow(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={hideGlow}
      onTouchCancel={hideGlow}
    >
      <span
        className="bottom-nav-glow"
        style={{
          transform: `translate(${glow.x}px, ${glow.y}px) translate(-50%, -50%)`,
          opacity: glow.visible ? 1 : 0,
        }}
      />
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.label} href={item.href} className={`tap-scale bottom-nav-item ${item.active ? "active" : ""}`}>
            <Icon size={19} strokeWidth={item.active ? 2.5 : 2} />
            {item.label}
          </Link>
        );
      })}

      <style jsx>{`
        .bottom-nav-glow-container {
          overflow: hidden;
        }
        .bottom-nav-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 90px;
          height: 90px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
          pointer-events: none;
          transition: opacity 200ms ease;
          z-index: 0;
        }
        .bottom-nav-item {
          position: relative;
          z-index: 1;
        }
        @keyframes bottomNavPop {
          0% { transform: scale(1); }
          45% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        .bottom-nav-item.active :global(svg) {
          animation: bottomNavPop 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </nav>
  );
}