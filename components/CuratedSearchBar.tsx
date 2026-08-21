"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

// Curated suggestions — each maps to where a search for it should actually
// land. Service-shaped queries route to that service's booking page;
// everything else falls back to accessories with a prefilled search.
const SUGGESTIONS: { text: string; keyword: string }[] = [
  { text: "walk near me", keyword: "WALKING" },
  { text: "grooming spa", keyword: "GROOMING" },
  { text: "dog training", keyword: "TRAINING" },
  { text: "pet sitting", keyword: "SITTING" },
  { text: "leash & collar", keyword: "PRODUCT" },
  { text: "vaccination reminder", keyword: "VACCINE" },
  { text: "dry food", keyword: "PRODUCT" },
  { text: "grooming brush", keyword: "PRODUCT" },
];

const SERVICE_ROUTES: Record<string, string> = {
  WALKING: "/walk-booking",
  GROOMING: "/grooming",
  TRAINING: "/training",
  SITTING: "/sitting",
  VACCINE: "/owner/pets",
};

const TYPE_SPEED_MS = 55;
const HOLD_MS = 1300;
const DISSOLVE_MS = 320;

export default function CuratedSearchBar() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "dissolving">("typing");
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (focused || value) return; // pause the cycling animation while the person is actually typing

    const current = SUGGESTIONS[index].text;

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
  }, [phase, displayed, index, focused, value]);

  const submit = (queryText: string) => {
    const match = SUGGESTIONS.find((s) => s.text.toLowerCase() === queryText.trim().toLowerCase());
    if (match && SERVICE_ROUTES[match.keyword]) {
      router.push(SERVICE_ROUTES[match.keyword]);
      return;
    }
    router.push(`/accessories?q=${encodeURIComponent(queryText.trim())}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(value || SUGGESTIONS[index].text);
      }}
      className={`search-glass flex items-center gap-3 rounded-full px-5 py-3.5 ${focused ? "search-glass-focused" : ""}`}
    >
      <Search size={18} color="var(--muted)" className="shrink-0" />
      <div className="relative flex-1 text-left">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-sm outline-none relative z-10"
          style={{ color: "var(--forest, #16281f)" }}
          aria-label="Search Barkado & Co."
        />
        {!value && (
          <span
            className={`absolute inset-y-0 left-0 flex items-center text-sm pointer-events-none suggestion-text ${phase === "dissolving" ? "suggestion-dissolve" : ""}`}
            style={{ color: "var(--muted)" }}
          >
            Search &quot;{displayed}&quot;
            <span className="typewriter-caret" />
          </span>
        )}
      </div>

      <style jsx>{`
        .search-glass {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 18px rgba(43, 29, 20, 0.08);
          transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease, background 220ms ease;
        }
        .search-glass-focused {
          transform: scale(1.03);
          background: rgba(255, 255, 255, 0.62);
          box-shadow: 0 10px 28px rgba(43, 29, 20, 0.14);
        }
        .suggestion-text {
          opacity: 1;
          transition: opacity ${DISSOLVE_MS}ms ease, filter ${DISSOLVE_MS}ms ease;
        }
        .suggestion-dissolve {
          opacity: 0;
          filter: blur(4px);
        }
        .typewriter-caret {
          display: inline-block;
          width: 1px;
          height: 13px;
          margin-left: 2px;
          background: var(--terracotta);
          animation: caretBlink 800ms step-end infinite;
          vertical-align: middle;
        }
        @keyframes caretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </form>
  );
}