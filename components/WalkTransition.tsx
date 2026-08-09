"use client";

import { useEffect, useState } from "react";
import { PawPrint } from "lucide-react";

export default function WalkTransition({ onDone }: { onDone: () => void }) {
  const [showText2, setShowText2] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowText2(true), 600);
    const t2 = setTimeout(onDone, 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--forest, #16281f)" }}
    >
      {/* Paw print trail */}
      <div className="absolute w-full" style={{ top: "48%" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <PawPrint
            key={i}
            size={14}
            color="rgba(232,169,74,0.5)"
            className="absolute walk-pawprint"
            style={{
              left: `${8 + i * 13}%`,
              animationDelay: `${i * 140}ms`,
            }}
          />
        ))}
      </div>

      {/* Walker + dog silhouette, strides across */}
      <div className="walk-figure absolute" style={{ top: "38%" }}>
        <div className="flex items-end gap-2 walk-bob">
          <span style={{ fontSize: 34 }}>🚶</span>
          <span style={{ fontSize: 26, marginBottom: 2 }}>🐕</span>
        </div>
      </div>

      {/* Text */}
      <div className="text-center px-8 mt-24">
        <p className="text-white text-xl font-bold walk-text-in">Booking a dog walker</p>
        {showText2 && (
          <p className="text-2xl font-extrabold walk-text-in" style={{ color: "var(--gold, #e8a94a)" }}>
            in 10 minutes
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes walkAcross {
          0% { left: -15%; }
          100% { left: 105%; }
        }
        @keyframes walkBob {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-4px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-4px); }
        }
        @keyframes pawFadeIn {
          0%, 20% { opacity: 0; transform: scale(0.5); }
          40%, 100% { opacity: 1; transform: scale(1); }
        }
        @keyframes textSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .walk-figure {
          animation: walkAcross 1.3s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        .walk-bob {
          animation: walkBob 0.45s ease-in-out infinite;
        }
        .walk-pawprint {
          animation: pawFadeIn 1.3s ease forwards;
          opacity: 0;
        }
        .walk-text-in {
          animation: textSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}
