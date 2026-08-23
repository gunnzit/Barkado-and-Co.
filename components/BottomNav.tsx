"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, PawPrint, GraduationCap, Scissors, ShoppingBag } from "lucide-react";

const PILL_WIDTH = 68;
const PILL_HEIGHT = 56;

// Routes with their own navigation (drawer menus, checkout flow, etc.) where
// the customer bottom nav shouldn't show at all.
const HIDDEN_PREFIXES = ["/provider", "/admin", "/cart", "/search", "/sign-in", "/sign-up"];

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [navRect, setNavRect] = useState({ width: 0, height: 0 });
  const [pillLeft, setPillLeft] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [popping, setPopping] = useState(false);
  const popTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/owner/dashboard", label: "Walks", icon: PawPrint, active: pathname === "/owner/dashboard" || pathname === "/walk-booking" },
    { href: "/training", label: "Training", icon: GraduationCap, active: pathname === "/training" },
    { href: "/grooming", label: "Groom", icon: Scissors, active: pathname === "/grooming" },
    { href: "/accessories", label: "Shop", icon: ShoppingBag, active: pathname === "/accessories" },
  ];

  const slotWidth = navRect.width / items.length;
  const leftForIndex = (i: number) => slotWidth * i + (slotWidth - PILL_WIDTH) / 2;

  const measure = () => {
    const rect = navRef.current?.getBoundingClientRect();
    if (rect) setNavRect({ width: rect.width, height: rect.height });
  };

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const snapToActive = () => {
    const activeIndex = Math.max(0, items.findIndex((i) => i.active));
    setPillLeft(leftForIndex(activeIndex));
  };

  // A real navigation (pathname changed) gets the pop/bloom animation.
  // A drag-release snap-back (no navigation) does not.
  useEffect(() => {
    snapToActive();
    setPopping(true);
    if (popTimeout.current) clearTimeout(popTimeout.current);
    popTimeout.current = setTimeout(() => setPopping(false), 380);
    return () => {
      if (popTimeout.current) clearTimeout(popTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navRect.width]);

  const followPointer = (clientX: number) => {
    const nav = navRef.current;
    if (!nav) return;
    const rect = nav.getBoundingClientRect();
    const raw = clientX - rect.left - PILL_WIDTH / 2;
    const clamped = Math.min(Math.max(raw, 0), rect.width - PILL_WIDTH);
    setPillLeft(clamped);
  };

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      ref={navRef}
      className="bottom-nav bottom-nav-pill-container"
      style={{ bottom: "calc(20px + env(safe-area-inset-bottom))" }}
      onMouseDown={(e) => {
        setDragging(true);
        followPointer(e.clientX);
      }}
      onMouseMove={(e) => dragging && followPointer(e.clientX)}
      onMouseUp={() => {
        setDragging(false);
        snapToActive();
      }}
      onMouseLeave={() => {
        if (dragging) {
          setDragging(false);
          snapToActive();
        }
      }}
      onTouchStart={(e) => {
        setDragging(true);
        followPointer(e.touches[0].clientX);
      }}
      onTouchMove={(e) => followPointer(e.touches[0].clientX)}
      onTouchEnd={() => {
        setDragging(false);
        snapToActive();
      }}
      onTouchCancel={() => {
        setDragging(false);
        snapToActive();
      }}
    >
      <span
        className={`bottom-nav-pill ${dragging ? "dragging" : ""} ${popping ? "popping" : ""}`}
        style={{
          left: pillLeft,
          top: (navRect.height - PILL_HEIGHT) / 2,
          width: PILL_WIDTH,
          height: PILL_HEIGHT,
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
        .bottom-nav-pill-container {
          overflow: hidden;
        }
        .bottom-nav-pill {
          position: absolute;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(10px) saturate(160%);
          -webkit-backdrop-filter: blur(10px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.05), 0 4px 14px rgba(0, 0, 0, 0.12);
          pointer-events: none;
          z-index: 0;
          transition: left 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .bottom-nav-pill.dragging {
          transition: none;
        }
        .bottom-nav-pill.popping {
          animation: bottomNavPillPop 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes bottomNavPillPop {
          0% { transform: scale(1); }
          35% { transform: scale(1.22); }
          100% { transform: scale(1); }
        }
        .bottom-nav-item {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </nav>
  );
}