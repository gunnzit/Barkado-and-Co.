"use client";

import { useEffect, useState } from "react";
import { PawPrint } from "lucide-react";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "showing" | "leaving">("hidden");

  useEffect(() => {
    if (sessionStorage.getItem("barkado_splash_shown")) return;
    sessionStorage.setItem("barkado_splash_shown", "1");
    setPhase("showing");

    const leaveTimer = setTimeout(() => setPhase("leaving"), 1500);
    const hideTimer = setTimeout(() => setPhase("hidden"), 1900);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center splash-overlay ${phase === "leaving" ? "splash-leaving" : ""}`}
      style={{ background: "var(--panel-dark)", zIndex: 300 }}
    >
      <div className="splash-icon w-24 h-24 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.08)" }}>
        <PawPrint size={44} color="var(--gold)" />
      </div>
      <p className="splash-text text-white text-2xl font-extrabold tracking-tight">Barkado & Co.</p>
      <p className="splash-tagline text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
        Everything your dog needs. One passport.
      </p>

      <style jsx>{`
        .splash-overlay {
          animation: splashFadeIn 200ms ease-out;
        }
        .splash-overlay.splash-leaving {
          animation: splashFadeOut 400ms ease-in forwards;
        }
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .splash-icon {
          opacity: 0;
          transform: scale(0.5);
          animation: splashIconIn 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 150ms forwards;
          box-shadow: 0 0 0 0 rgba(232, 169, 74, 0.4);
        }
        @keyframes splashIconIn {
          0% { opacity: 0; transform: scale(0.5); box-shadow: 0 0 0 0 rgba(232, 169, 74, 0.4); }
          60% { opacity: 1; transform: scale(1.08); }
          80% { box-shadow: 0 0 0 18px rgba(232, 169, 74, 0); }
          100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 18px rgba(232, 169, 74, 0); }
        }
        .splash-text {
          opacity: 0;
          transform: translateY(10px);
          animation: splashTextIn 500ms ease-out 550ms forwards;
        }
        .splash-tagline {
          opacity: 0;
          transform: translateY(10px);
          animation: splashTextIn 500ms ease-out 700ms forwards;
        }
        @keyframes splashTextIn {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}