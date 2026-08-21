"use client";

import { PawPrint } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "var(--cream)", zIndex: 200 }}
    >
      <div className="loading-icon w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--panel-dark)" }}>
        <PawPrint size={34} color="var(--gold)" />
      </div>
      <p className="text-sm font-semibold text-center px-10 max-w-xs" style={{ color: "var(--muted)" }}>
        Everything your dog needs, one passport away
      </p>

      <div className="flex gap-1.5 mt-6">
        <span className="loading-dot" style={{ animationDelay: "0ms" }} />
        <span className="loading-dot" style={{ animationDelay: "150ms" }} />
        <span className="loading-dot" style={{ animationDelay: "300ms" }} />
      </div>

      <style jsx>{`
        @keyframes loadingPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        .loading-icon {
          animation: loadingPulse 1.6s ease-in-out infinite;
        }
        @keyframes loadingDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        .loading-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: var(--terracotta);
          display: inline-block;
          animation: loadingDotBounce 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}