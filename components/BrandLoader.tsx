"use client";

import MonogramMark from "@/components/MonogramMark";
import BrandLogo from "@/components/BrandLogo";

/*
 * Branded loader (BRAND.md): the official monogram inside a golden ring that
 * draws itself, the dog's ear giving a little flop, and a trail of paw prints
 * stepping across — a dog out on a walk.
 *
 *   variant="splash" — full-screen plum, wordmark + tagline + golden wave. Plays once.
 *   variant="page"   — ivory overlay between pages. Loops until the page is ready.
 *
 * Users who prefer reduced motion get the same layout, still.
 */

const PLUM = "#6e1e3b";
const IVORY = "#fbf0d9";
const YELLOW = "#f9dd8a";

function Paw({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <g fill={color}>
        <ellipse cx="7" cy="8" rx="2.2" ry="2.9" />
        <ellipse cx="12" cy="5.6" rx="2.2" ry="2.9" />
        <ellipse cx="17" cy="8" rx="2.2" ry="2.9" />
        <path d="M12 10.6c-3.6 0-6.4 3.6-6.4 6.5 0 2.2 1.7 3.3 3.5 3 1-.2 1.8-.7 2.9-.7s1.9.5 2.9.7c1.8.3 3.5-.8 3.5-3 0-2.9-2.8-6.5-6.4-6.5z" />
      </g>
    </svg>
  );
}

export default function BrandLoader({ variant = "page", leaving = false }: { variant?: "splash" | "page"; leaving?: boolean }) {
  const splash = variant === "splash";
  const pawColor = splash ? YELLOW : PLUM;

  return (
    <div
      className={`bk-loader ${splash ? "bk-splash" : "bk-page"} ${leaving ? "bk-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={splash ? "Opening Barkado & Co." : "Loading"}
    >
      <div className="bk-stage">
        <div className="bk-badge">
          <svg className="bk-ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" className="bk-ring-track" />
            <circle cx="50" cy="50" r="46" className="bk-ring-arc" />
          </svg>
          <div className="bk-disc">
            <MonogramMark color={IVORY} className="bk-mark" title="" />
          </div>
        </div>

        <div className="bk-trail" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="bk-paw" style={{ animationDelay: `${(splash ? 0.55 : 0) + i * 0.16}s` }}>
              <Paw color={pawColor} />
            </span>
          ))}
        </div>

        {splash ? (
          <>
            <div className="bk-word">
              <BrandLogo variant="wordmark" tone="ivory" className="h-14 w-auto mx-auto" />
            </div>
            <p className="bk-tag font-script">A Hug in every Paw</p>
          </>
        ) : (
          <p className="bk-copy">Sniffing out the good stuff…</p>
        )}
      </div>

      {splash && <span className="bk-wave" aria-hidden="true" />}

      <style jsx>{`
        .bk-loader {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .bk-splash {
          background: ${PLUM};
          z-index: 1000; /* above the bottom menu (300) and everything else */
          animation: bkFadeIn 220ms ease-out both;
        }
        .bk-page {
          background: rgba(251, 240, 217, 0.92);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 200;
          animation: bkFadeIn 180ms ease-out 120ms both; /* quick pages never flash it */
        }
        .bk-leaving {
          animation: bkFadeOut 380ms ease-in forwards;
        }
        .bk-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0 24px;
        }

        /* ===== Badge: ring + monogram ===== */
        .bk-badge {
          position: relative;
          width: ${splash ? 148 : 104}px;
          height: ${splash ? 148 : 104}px;
          animation: bkPop 720ms cubic-bezier(0.34, 1.56, 0.64, 1) ${splash ? "120ms" : "0ms"} both;
        }
        .bk-ring {
          position: absolute;
          inset: 0;
          transform: rotate(-90deg);
          ${splash ? "" : "animation: bkRotate 1.4s linear infinite;"}
        }
        .bk-ring-track {
          fill: none;
          stroke: ${splash ? "rgba(249,221,138,0.18)" : "rgba(110,30,59,0.1)"};
          stroke-width: 3;
        }
        .bk-ring-arc {
          fill: none;
          stroke: ${splash ? YELLOW : "#e2b33c"}; /* deeper gold so it reads on ivory */
          stroke-width: ${splash ? 3.5 : 4.5};
          stroke-linecap: round;
          stroke-dasharray: 289;
          stroke-dashoffset: 289;
          animation: ${splash ? "bkDraw 1000ms cubic-bezier(0.65,0,0.35,1) 250ms forwards" : "bkDash 1.4s ease-in-out infinite"};
        }
        .bk-disc {
          position: absolute;
          inset: ${splash ? 12 : 9}px;
          border-radius: 9999px;
          background: ${splash ? "rgba(251,240,217,0.08)" : PLUM};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: ${splash ? "none" : "0 10px 24px -8px rgba(110,30,59,0.45)"};
        }
        .bk-disc :global(.bk-mark) {
          width: 58%;
          height: auto;
          overflow: visible;
          animation: bkBob 1.6s ease-in-out infinite;
        }
        .bk-disc :global(.bk-mono-ear) {
          transform-box: fill-box;
          transform-origin: 60% 0%;
          animation: bkEar 1.6s ease-in-out ${splash ? "0.8s" : "0.2s"} infinite;
        }

        /* ===== Paw trail ===== */
        .bk-trail {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          height: 26px;
          margin-top: ${splash ? 26 : 22}px;
        }
        .bk-paw {
          width: 15px;
          height: 15px;
          opacity: 0;
          animation: ${splash ? "bkStepOnce 420ms ease-out forwards" : "bkStep 1.6s ease-in-out infinite"};
        }
        .bk-paw:nth-child(odd) {
          transform: translateY(-9px) rotate(-14deg);
        }
        .bk-paw:nth-child(even) {
          transform: rotate(14deg);
        }

        /* ===== Text ===== */
        .bk-word {
          margin-top: 22px;
          animation: bkRise 520ms ease-out 650ms both;
        }
        .bk-tag {
          margin-top: 10px;
          font-size: 20px;
          color: ${YELLOW};
          animation: bkRise 520ms ease-out 820ms both;
        }
        .bk-copy {
          margin-top: 16px;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 14px;
          color: ${PLUM};
        }

        /* ===== Golden wave (splash) ===== */
        .bk-wave {
          position: absolute;
          left: -5%;
          right: -5%;
          bottom: -2px;
          height: 64px;
          background: ${YELLOW};
          -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 24' preserveAspectRatio='none'%3E%3Cpath d='M0 10 C 50 0, 100 20, 150 10 S 250 0, 300 10 S 380 20, 400 8 L400 24 L0 24 Z'/%3E%3C/svg%3E") center / 100% 100% no-repeat;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 24' preserveAspectRatio='none'%3E%3Cpath d='M0 10 C 50 0, 100 20, 150 10 S 250 0, 300 10 S 380 20, 400 8 L400 24 L0 24 Z'/%3E%3C/svg%3E") center / 100% 100% no-repeat;
          animation: bkWave 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
        }

        @keyframes bkFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bkFadeOut { to { opacity: 0; } }
        @keyframes bkPop {
          0% { opacity: 0; transform: scale(0.6); }
          60% { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bkDraw { to { stroke-dashoffset: 0; } }
        @keyframes bkRotate {
          from { transform: rotate(-90deg); }
          to { transform: rotate(270deg); }
        }
        @keyframes bkDash {
          0%, 100% { stroke-dashoffset: 250; }
          50% { stroke-dashoffset: 110; }
        }
        @keyframes bkBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes bkEar {
          0%, 60%, 100% { transform: rotate(0deg); }
          70% { transform: rotate(-9deg); }
          80% { transform: rotate(5deg); }
          90% { transform: rotate(-3deg); }
        }
        @keyframes bkStep {
          0%, 100% { opacity: 0; }
          15%, 55% { opacity: 1; }
          75% { opacity: 0.15; }
        }
        @keyframes bkStepOnce {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bkRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bkWave {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .bk-loader, .bk-ring, .bk-badge, .bk-word, .bk-tag, .bk-wave, .bk-disc :global(.bk-mark), .bk-disc :global(.bk-mono-ear) {
            animation: none !important;
          }
          .bk-ring-arc { animation: none !important; stroke-dashoffset: ${splash ? 0 : 200}; }
          .bk-paw { animation: none !important; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
