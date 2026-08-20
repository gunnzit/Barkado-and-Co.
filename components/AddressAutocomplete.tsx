"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

type Suggestion = {
  place_id: string;
  display_name: string;
};

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Address",
}: {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleInput = (text: string) => {
    setQuery(text);
    onChange(text); // keep parent form state in sync even before a suggestion is picked

    if (!apiKey || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(text)}&limit=5&dedupe=1&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
          setOpen(true);
        }
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 350);
  };

  const selectSuggestion = (s: Suggestion) => {
    setQuery(s.display_name);
    onChange(s.display_name);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full border rounded-xl px-3 py-2 text-sm"
        style={{ borderColor: "var(--border)" }}
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg z-50"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onClick={() => selectSuggestion(s)}
              className="w-full flex items-start gap-2 px-3 py-2.5 text-left tap-scale"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <MapPin size={14} color="var(--muted)" className="mt-0.5 shrink-0" />
              <span className="text-sm">{s.display_name}</span>
            </button>
          ))}
          <p className="text-[10px] px-3 py-1.5" style={{ color: "var(--muted)" }}>
            Powered by LocationIQ
          </p>
        </div>
      )}

      {loading && (
        <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>Searching…</p>
      )}
    </div>
  );
}