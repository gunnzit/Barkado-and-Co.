"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Mic, X, PawPrint, Scissors, GraduationCap, Home as HomeIcon, ChevronRight } from "lucide-react";
import { AccessoryCard } from "@/components/AccessoryCard";

const RECENT_KEY = "barkado_recent_searches";
const MAX_RECENT = 6;

const TRENDING = ["walk near me", "grooming spa", "dog training", "leash & collar", "vaccination reminder", "dry food"];

const SERVICE_ICON: Record<string, any> = {
  paw: PawPrint,
  scissors: Scissors,
  graduation: GraduationCap,
  home: HomeIcon,
};

type Product = { id: string; name: string; category: string; price: number; description: string; icon: string };
type Service = { type: string; label: string; href: string; icon: string };

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [recent, setRecent] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounced(query, 300);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(stored)) setRecent(stored);
    } catch {
      // ignore malformed localStorage content
    }
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setProducts([]);
      setServices([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setServices(data.services ?? []);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const commitToRecent = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  const runQuery = (q: string) => {
    setQuery(q);
    commitToRecent(q);
  };

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <div className="max-w-lg mx-auto pb-16">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <button onClick={() => router.back()} className="tap-scale shrink-0 p-1" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div
            className="flex-1 flex items-center gap-2 rounded-full px-4 py-3"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Search size={17} color="var(--muted)" className="shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitToRecent(query);
              }}
              placeholder="Search walks, grooming, accessories…"
              className="flex-1 bg-transparent text-sm outline-none min-w-0"
            />
            {query && (
              <button onClick={() => setQuery("")} className="tap-scale shrink-0" aria-label="Clear">
                <X size={15} color="var(--muted)" />
              </button>
            )}
            <Mic size={16} color="var(--border)" className="shrink-0" />
          </div>
        </div>

        {!query && (
          <div className="px-5">
            {recent.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm">Recent searches</h2>
                  <button onClick={clearRecent} className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
                    clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => runQuery(r)}
                      className="tap-scale px-3.5 py-2 rounded-full text-xs font-medium"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="font-bold text-sm mb-3">Trending</h2>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map((t) => (
                  <button
                    key={t}
                    onClick={() => runQuery(t)}
                    className="tap-scale px-3.5 py-2 rounded-full text-xs font-medium"
                    style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--terracotta)" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {query && (
          <div className="px-5">
            {loading ? (
              <p className="text-sm py-6" style={{ color: "var(--muted)" }}>Searching…</p>
            ) : (
              <>
                {services.length > 0 && (
                  <div className="mb-6 space-y-2">
                    {services.map((s) => {
                      const Icon = SERVICE_ICON[s.icon] ?? PawPrint;
                      return (
                        <Link
                          key={s.type}
                          href={s.href}
                          className="card tap-scale flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--cream)" }}>
                              <Icon size={18} color="var(--terracotta)" />
                            </div>
                            <p className="font-semibold text-sm">{s.label}</p>
                          </div>
                          <ChevronRight size={16} color="var(--muted)" />
                        </Link>
                      );
                    })}
                  </div>
                )}

                {products.length > 0 && (
                  <div>
                    <h2 className="font-bold text-sm mb-3">Accessories</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {products.map((p) => (
                        <AccessoryCard key={p.id} item={p as any} />
                      ))}
                    </div>
                  </div>
                )}

                {searched && !loading && services.length === 0 && products.length === 0 && (
                  <p className="text-sm py-10 text-center" style={{ color: "var(--muted)" }}>
                    No results for &quot;{query}&quot;.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}