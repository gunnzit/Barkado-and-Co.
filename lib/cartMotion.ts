"use client";

import { useEffect, useRef } from "react";

/*
 * "Fly to cart": when something is added, a copy of its photo travels along a
 * short arc into the cart button, which then gives a small bounce.
 * Purpose: spatial consistency — the customer sees where the item went.
 * Occasional action (a few per session), so a 480ms flight is in budget.
 * Reduced motion: no flight, just the cart bump.
 *
 * Any element marked data-cart-target is a landing spot; the first one that is
 * on screen wins (shop header button, cart pill, task header cart).
 */

const EVENT = "barkado:cart-bump";
const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function visibleTarget(): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"));
  return (
    els.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
    }) ?? null
  );
}

export function bumpCart() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function flyToCart(source: HTMLElement | null) {
  if (typeof window === "undefined") return;
  const target = visibleTarget();
  if (!source || !target || prefersReducedMotion() || typeof source.animate !== "function") {
    bumpCart();
    return;
  }

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = Math.min(from.width, from.height, 140);
  const ghost = source.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left + (from.width - size) / 2}px`,
    top: `${from.top + (from.height - size) / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    margin: "0",
    borderRadius: "18px",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "1000",
    boxShadow: "0 12px 28px -6px rgba(61,20,38,0.35)",
  });
  ghost.setAttribute("aria-hidden", "true");
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const lift = Math.min(90, Math.abs(dy) * 0.35 + 30); // arc height

  const anim = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1, borderRadius: "18px" },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - lift}px) scale(0.55)`, opacity: 1, borderRadius: "40px", offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4, borderRadius: "999px" },
    ],
    { duration: 480, easing: EASE_IN_OUT, fill: "forwards" },
  );
  const done = () => {
    ghost.remove();
    bumpCart();
  };
  anim.onfinish = done;
  anim.oncancel = done;
}

/** Attach to a cart button: bounces when an item lands. */
export function useCartBump<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const onBump = () => {
      const el = ref.current;
      if (!el || typeof el.animate !== "function") return;
      if (prefersReducedMotion()) {
        el.animate([{ opacity: 0.6 }, { opacity: 1 }], { duration: 200, easing: "ease" });
        return;
      }
      el.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.16)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }],
        { duration: 360, easing: EASE_OUT },
      );
    };
    window.addEventListener(EVENT, onBump);
    return () => window.removeEventListener(EVENT, onBump);
  }, []);
  return ref;
}
