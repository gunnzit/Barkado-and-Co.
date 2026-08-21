"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const SUGGESTIONS = [
  "walk near me",
  "grooming spa",
  "dog training",
  "pet sitting",
  "leash & collar",
  "vaccination reminder",
  "dry food",
  "grooming brush",
];

const TYPE_SPEED_MS = 55;
const HOLD_MS = 1300;
const DISSOLVE_MS = 320;

export default function CuratedSearchBar() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "dissolving">("typing");
  const [pressed, setPressed] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = SUGGESTIONS[index];

    if (phase === "typing") {
      if (displayed.length < current.length) {
        timeoutRef.current = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), TYPE_SPEED_MS);
      } else {
        timeoutRef.current = setTimeout(() => setPhase("holding"), HOLD_MS);
      }
    } else if (phase === "holding") {
      timeoutRef.current = setTimeout(() => setPhase("dissolving"), 0);
    } else if (phase === "dissolving") {
      timeoutRef.current = setTimeout(() => {
        setDisplayed("");
        setIndex((i) => (i + 1) % SUGGESTIONS.length);
        setPhase("typing");
      }, DISSOLVE_MS);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, displayed, index]);

  return (
    <button
      onClick={() => router.push("/search")}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={`search-glass flex items-center gap-3 rounded-full px-5 py-3.5 w-full text-left ${pressed ? "search-glass-pressed" : ""}`}
      aria-label="Open search"
    >
      <Search size={18} color="var(--muted)" className="shrink-0" />
      <span className="relative flex-1 text-sm" style={{ color: "var(--muted)" }}>
        Search &quot;
        <span className={`suggestion-text ${phase === "dissolving" ? "suggestion-dissolve" : ""}`}>{displayed}</span>
        <span className="typewriter-caret" />
        &quot;
      </span>

      <style jsx>{`
        .search-glass {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 18px rgba(43, 29, 20, 0.08);
          transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease, background 220ms ease;
        }
        .search-glass-pressed {
          transform: scale(1.03);
          background: rgba(255, 255, 255, 0.62);
          box-shadow: 0 10px 28px rgba(43, 29, 20, 0.14);
        }
        .suggestion-text {
          display: inline;
          transition: opacity ${DISSOLVE_MS}ms ease, filter ${DISSOLVE_MS}ms ease;
        }
        .suggestion-dissolve {
          opacity: 0;
          filter: blur(4px);
        }
        .typewriter-caret {
          display: inline-block;
          width: 1px;
          height: 12px;
          margin-left: 1px;
          background: var(--terracotta);
          animation: caretBlink 800ms step-end infinite;
          vertical-align: middle;
        }
        @keyframes caretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </button>
  );
}