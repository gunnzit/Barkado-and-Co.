"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, PawPrint, GraduationCap, Scissors, ShoppingBag } from "lucide-react";

const PILL_WIDTH = 68;
const PILL_HEIGHT = 56;
const DRAG_THRESHOLD = 10; // px of movement before a touch counts as a drag, not a tap

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [navRect, setNavRect] = useState({ height: 0 });
  const [centers, setCenters] = useState<number[]>([]);
  const [measured, setMeasured] = useState(false);
  const [pillLeft, setPillLeft] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [popping, setPopping] = useState(false);
  const popTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef(0);
  const draggedRef = useRef(false);

  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/walk-booking", label: "Walks", icon: PawPrint, active: pathname === "/walk-booking" },
    { href: "/training", label: "Training", icon: GraduationCap, active: pathname === "/training" },
    { href: "/grooming", label: "Groom", icon: Scissors, active: pathname === "/grooming" },
    { href: "/accessories", label: "Shop", icon: ShoppingBag, active: pathname === "/accessories" },
  ];

  // Measures each icon's real rendered center — accounts for the nav's own
  // padding automatically, unlike computing position from nav-width math.
  const measure = () => {
    const nav = navRef.current;
    if (!nav) return;
    const navBox = nav.getBoundingClientRect();
    setNavRect({ height: navBox.height });
    const next = itemRefs.current.map((el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.left - navBox.left + r.width / 2;
    });
    setCenters(next);
    setMeasured(true);
  };

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leftForIndex = (i: number) => (centers[i] ?? 0) - PILL_WIDTH / 2;

  const snapToActive = () => {
    const activeIndex = Math.max(0, items.findIndex((i) => i.active));
    setPillLeft(leftForIndex(activeIndex));
  };

  useEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!measured) return;
    snapToActive();
    setPopping(true);
    if (popTimeout.current) clearTimeout(popTimeout.current);
    popTimeout.current = setTimeout(() => setPopping(false), 380);
    return () => {
      if (popTimeout.current) clearTimeout(popTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured, centers, pathname]);

  const nearestIndexFor = (clientX: number) => {
    const nav = navRef.current;
    if (!nav) return 0;
    const rect = nav.getBoundingClientRect();
    const x = clientX - rect.left;
    let closest = 0;
    let closestDist = Infinity;
    centers.forEach((c, i) => {
      const d = Math.abs(x - c);
      if (d < closestDist) {
        closestDist = d;
        closest = i;
      }
    });
    return closest;
  };

  const followPointer = (clientX: number) => {
    const nav = navRef.current;
    if (!nav) return;
    const rect = nav.getBoundingClientRect();
    const raw = clientX - rect.left - PILL_WIDTH / 2;
    const clamped = Math.min(Math.max(raw, 0), rect.width - PILL_WIDTH);
    setPillLeft(clamped);
  };

  // Deliberately does NOT move the pill yet — only records where the
  // touch/click started. Moving immediately here was what caused taps to
  // "teleport" the pill instantly instead of sliding: a tap and the start
  // of a drag look identical until real movement happens.
  const startDrag = (clientX: number) => {
    setDragging(true);
    dragStartX.current = clientX;
    draggedRef.current = false;
  };

  // Only once movement crosses the threshold do we start actually dragging
  // the pill — a plain tap never triggers this, so it never gets the
  // transition-less instant jump; it gets the eased CSS slide instead, via
  // the pathname effect above, once navigation actually happens.
  const moveDrag = (clientX: number) => {
    if (!draggedRef.current && Math.abs(clientX - dragStartX.current) > DRAG_THRESHOLD) {
      draggedRef.current = true;
    }
    if (draggedRef.current) followPointer(clientX);
  };

  const endDrag = (clientX: number) => {
    setDragging(false);
    if (draggedRef.current) {
      const index = nearestIndexFor(clientX);
      const target = items[index];
      if (target && !target.active) {
        router.push(target.href);
        return;
      }
    }
    snapToActive();
  };

  // Original visibility rule, restored: bottom nav shows on Home and most
  // real content pages on mobile — hidden only on the pages that have
  // their own separate navigation (provider dashboard, admin, cart,
  // search) or no navigation need (auth pages). This is a MOBILE-ONLY
  // pattern (see lg:hidden on the <nav> below) — desktop never uses it,
  // full stop, regardless of route.
  const HIDDEN_PREFIXES = ["/provider", "/admin", "/cart", "/search", "/sign-in", "/sign-up", "/accessories/"];
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      ref={navRef}
      className="bottom-nav bottom-nav-pill-container lg:hidden"
      style={{
        bottom: "calc(32px + env(safe-area-inset-bottom))",
        zIndex: 300,
        background: "rgba(255, 255, 255, 0.35)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
      onMouseDown={(e) => startDrag(e.clientX)}
      onMouseMove={(e) => dragging && moveDrag(e.clientX)}
      onMouseUp={(e) => dragging && endDrag(e.clientX)}
      onMouseLeave={(e) => dragging && endDrag(e.clientX)}
      onTouchStart={(e) => startDrag(e.touches[0].clientX)}
      onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
      onTouchEnd={(e) => endDrag(e.changedTouches[0].clientX)}
      onTouchCancel={() => {
        setDragging(false);
        snapToActive();
      }}
    >
      {measured && (
        <span
          className={`bottom-nav-pill ${dragging && draggedRef.current ? "dragging" : ""} ${popping ? "popping" : ""}`}
          style={{
            left: pillLeft,
            top: (navRect.height - PILL_HEIGHT) / 2,
            width: PILL_WIDTH,
            height: PILL_HEIGHT,
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
            style={{ color: item.active ? "var(--forest, #16281f)" : "var(--muted, #8a7f6f)", opacity: 1 }}
          >
            <Icon size={19} strokeWidth={item.active ? 2.5 : 2} style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.15))" }} />
            <span style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.1))" }}>{item.label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .bottom-nav-pill {
          position: absolute;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px) saturate(160%);
          -webkit-backdrop-filter: blur(10px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.55);
          box-shadow:
            inset 0 1px 2px rgba(255, 255, 255, 0.8),
            inset 0 -8px 12px rgba(255, 255, 255, 0.15),
            0 4px 14px rgba(0, 0, 0, 0.08);
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          transition: left 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .bottom-nav-pill::before {
          content: "";
          position: absolute;
          top: -30%;
          left: 10%;
          width: 60%;
          height: 60%;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 70%);
          animation: bottomNavGlowDrift 3.2s ease-in-out infinite;
        }
        @keyframes bottomNavGlowDrift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(8%, 15%) scale(1.15); opacity: 1; }
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