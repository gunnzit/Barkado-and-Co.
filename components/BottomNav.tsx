"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, PawPrint, GraduationCap, Scissors, ShoppingBag } from "lucide-react";

const PILL_WIDTH = 68;
const PILL_HEIGHT = 56;

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [navRect, setNavRect] = useState({ width: 0, height: 0 });
  const [pillLeft, setPillLeft] = useState(0);
  const [dragging, setDragging] = useState(false);

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

  useEffect(() => {
    snapToActive();
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
        className={`bottom-nav-pill ${dragging ? "dragging" : ""}`}
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
          <Link key={item.label} href={item.href} className="tap-scale bottom-nav-item">
            <Icon size={19} strokeWidth={item.active ? 2.5 : 2} color={item.active ? "var(--cream)" : undefined} />
            <span style={{ color: item.active ? "var(--cream)" : undefined }}>{item.label}</span>
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
          background: var(--panel-dark);
          pointer-events: none;
          z-index: 0;
          transition: left 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .bottom-nav-pill.dragging {
          transition: none;
        }
        .bottom-nav-item {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </nav>
  );
}