"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, PawPrint, GraduationCap, Scissors, ShoppingBag } from "lucide-react";

type Rect = { left: number; top: number; width: number; height: number };

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<Rect | null>(null);
  const [dragging, setDragging] = useState(false);

  const isBook = pathname === "/book";

  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/owner/dashboard", label: "Walks", icon: PawPrint, active: pathname === "/owner/dashboard" || pathname === "/walk-booking" },
    { href: "/training", label: "Training", icon: GraduationCap, active: pathname === "/training" },
    { href: "/grooming", label: "Groom", icon: Scissors, active: pathname === "/grooming" },
    { href: "/accessories", label: "Shop", icon: ShoppingBag, active: pathname === "/accessories" },
  ];

  const snapToActive = () => {
    const nav = navRef.current;
    const activeIndex = items.findIndex((i) => i.active);
    const el = itemRefs.current[activeIndex >= 0 ? activeIndex : 0];
    if (!nav || !el) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPill({
      left: elRect.left - navRect.left,
      top: elRect.top - navRect.top,
      width: elRect.width,
      height: elRect.height,
    });
  };

  useEffect(() => {
    snapToActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const followPointer = (clientX: number) => {
    const nav = navRef.current;
    if (!nav) return;
    const navRect = nav.getBoundingClientRect();
    // Find whichever item the pointer is currently over and highlight it —
    // a magnetic follow rather than pixel-for-pixel cursor tracking.
    let closest = 0;
    let closestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const center = r.left + r.width / 2;
      const dist = Math.abs(clientX - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    const el = itemRefs.current[closest];
    if (!el) return;
    const elRect = el.getBoundingClientRect();
    setPill({
      left: elRect.left - navRect.left,
      top: elRect.top - navRect.top,
      width: elRect.width,
      height: elRect.height,
    });
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
      {pill && (
        <span
          className="bottom-nav-pill"
          style={{
            left: pill.left,
            top: pill.top,
            width: pill.width,
            height: pill.height,
          }}
        />
      )}
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="tap-scale bottom-nav-item"
          >
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
          transition: left 280ms cubic-bezier(0.34, 1.56, 0.64, 1), top 280ms cubic-bezier(0.34, 1.56, 0.64, 1), width 280ms cubic-bezier(0.34, 1.56, 0.64, 1), height 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bottom-nav-item {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </nav>
  );
}