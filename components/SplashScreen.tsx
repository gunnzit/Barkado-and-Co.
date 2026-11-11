"use client";

import { useEffect, useState } from "react";
import BrandLoader from "@/components/BrandLoader";

// Shown once per browser session when the app first opens.
export default function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "showing" | "leaving">("hidden");

  useEffect(() => {
    try {
      if (sessionStorage.getItem("barkado_splash_shown")) return;
      sessionStorage.setItem("barkado_splash_shown", "1");
    } catch {
      return; // storage blocked: skip the splash rather than risk showing it on every page
    }
    setPhase("showing");

    const leaveTimer = setTimeout(() => setPhase("leaving"), 1900);
    const hideTimer = setTimeout(() => setPhase("hidden"), 2280);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;
  return <BrandLoader variant="splash" leaving={phase === "leaving"} />;
}
