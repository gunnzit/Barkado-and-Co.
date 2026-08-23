"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type BufferedEvent = { type: "PAGE_VIEW" | "CLICK"; path?: string; metadata?: Record<string, any> };

const FLUSH_INTERVAL_MS = 4000;
const FLUSH_AT_COUNT = 20;

export default function ActivityTracker() {
  const pathname = usePathname();
  const bufferRef = useRef<BufferedEvent[]>([]);

  const flush = (useBeacon = false) => {
    if (bufferRef.current.length === 0) return;
    const events = bufferRef.current;
    bufferRef.current = [];
    const body = JSON.stringify({ events });

    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/activity/batch", blob);
    } else {
      fetch("/api/activity/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // dropped events are acceptable — this is best-effort analytics,
        // never something the rest of the app should depend on
      });
    }
  };

  // Page views — one per route change.
  useEffect(() => {
    bufferRef.current.push({ type: "PAGE_VIEW", path: pathname });
    if (bufferRef.current.length >= FLUSH_AT_COUNT) flush();
  }, [pathname]);

  // Every click, anywhere in the app, captured on the document in the
  // capture phase so it's seen even if something downstream stops
  // propagation. Only lightweight, non-sensitive context is recorded —
  // no input values, no form field contents.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest("button, a, [role='button']") as HTMLElement | null;
      const el = interactive ?? target;
      const text = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 80);
      const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? undefined : undefined;

      bufferRef.current.push({
        type: "CLICK",
        path: window.location.pathname,
        metadata: { tag: el.tagName.toLowerCase(), text: text || undefined, href },
      });
      if (bufferRef.current.length >= FLUSH_AT_COUNT) flush();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Periodic flush, plus a reliable final flush on tab close/navigation away.
  useEffect(() => {
    const interval = setInterval(() => flush(), FLUSH_INTERVAL_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", () => flush(true));
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return null;
}