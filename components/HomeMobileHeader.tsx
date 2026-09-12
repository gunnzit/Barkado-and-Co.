"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShoppingBag, User, Search, Mic, Navigation, ChevronDown } from "lucide-react";
import LocationPickerModal from "@/components/LocationPickerModal";

const H = { fontFamily: "var(--font-heading)" } as const;

type Address = { id: string; label: string; fullAddress: string; receiverName: string; receiverPhone: string; isDefault: boolean };

// Real example queries the placeholder cycles through — purely a UI
// hint of what CAN be searched, not fabricated search results.
const SEARCH_PHRASES = [
  "dog walking in 15m",
  "puppy food",
  "spa van nearby",
  "dog groomer today",
  "training classes",
  "leashes & collars",
];

export default function HomeMobileHeader({
  userAddress,
  userPhone,
  cartCount,
  pawPointsBalance,
}: {
  userAddress: string | null;
  userPhone: string | null;
  cartCount: number;
  pawPointsBalance: number;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const addressLabel = userAddress ? userAddress.split(",")[0] : "Home";
  const addressRest = userAddress ? userAddress.split(",").slice(1).join(",").trim() : "Add your address";

  const openPicker = async () => {
    setPickerOpen(true);
    if (addresses === null) {
      setLoadingAddresses(true);
      const res = await fetch("/api/addresses");
      if (res.ok) setAddresses(await res.json());
      else setAddresses([]);
      setLoadingAddresses(false);
    }
  };

  // Real search — Enter (or the search icon) navigates to the actual
  // /search page. Assuming the standard `q` query param since that page's
  // source hasn't been seen directly — if it reads a different param
  // name, this is a one-line fix once confirmed.
  const [query, setQuery] = useState("");
  const submitSearch = () => {
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  // Real typewriter-cycling placeholder — types out each example phrase,
  // pauses, deletes it, then types the next. Runs purely via local
  // component state; stops mattering once the person actually types
  // something (native placeholder just stops being visible then).
  const [placeholderText, setPlaceholderText] = useState("");
  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = SEARCH_PHRASES[phraseIndex];
      if (!deleting) {
        charIndex += 1;
        setPlaceholderText(current.slice(0, charIndex));
        if (charIndex === current.length) {
          deleting = true;
          timeoutId = setTimeout(tick, 1400);
          return;
        }
      } else {
        charIndex -= 1;
        setPlaceholderText(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % SEARCH_PHRASES.length;
        }
      }
      timeoutId = setTimeout(tick, deleting ? 35 : 65);
    };

    timeoutId = setTimeout(tick, 600);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <header className="max-w-6xl mx-auto pt-safe" style={{ background: "rgba(251,250,238,0.95)", borderBottom: "1px solid rgba(194,200,194,0.2)" }}>
      <div className="px-4 pt-2.5 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <h1 className="font-extrabold text-[21px] tracking-tight" style={{ ...H, color: "#02120a" }}>
              Barkado <span className="font-normal italic text-lg" style={{ fontFamily: "serif", color: "#904c2c" }}>&amp; Co.</span>
            </h1>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#904c2c" }} />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/owner/wallet" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tap-scale" style={{ background: "#e9e9dd", border: "1px solid rgba(194,200,194,0.4)", ...H, color: "#02120a" }}>
              <Sparkles size={13} color="#fcba5a" />
              {pawPointsBalance.toLocaleString("en-IN")} PTS
            </Link>
            <Link href="/cart" className="relative w-8 h-8 rounded-full flex items-center justify-center tap-scale" style={{ background: "#f5f4e8", border: "1px solid rgba(194,200,194,0.3)", color: "#02120a" }} aria-label="Cart">
              <ShoppingBag size={17} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "#904c2c", color: "white", ...H }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/owner/profile" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 tap-scale overflow-hidden" style={{ background: "#02120a" }}>
              {user?.imageUrl ? <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" /> : <User size={15} color="white" />}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button onClick={openPicker} className="flex items-center gap-1.5 min-w-0 tap-scale">
            <Navigation size={15} color="#904c2c" className="shrink-0" />
            <span className="font-bold text-xs truncate" style={{ ...H, color: "#02120a" }}>{addressLabel}</span>
            <span className="text-xs shrink-0" style={{ color: "#737874" }}>•</span>
            <span className="text-xs truncate" style={{ color: "#424844" }}>{addressRest}</span>
            <ChevronDown size={14} color="#424844" className="shrink-0" />
          </button>
          <button onClick={openPicker} className="shrink-0 text-xs font-bold tap-scale" style={{ color: "#904c2c" }}>
            CHANGE
          </button>
        </div>

        <div className="relative flex items-center w-full h-10 rounded-xl px-3" style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(22,40,31,0.03)", border: "1px solid rgba(194,200,194,0.3)" }}>
          <button onClick={submitSearch} aria-label="Search" className="shrink-0">
            <Search size={18} color="#424844" className="mr-2" />
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            className="w-full bg-transparent text-xs placeholder:text-[#737874] focus:outline-none truncate"
            placeholder={`Search '${placeholderText}'...`}
          />
          <div className="flex items-center gap-1.5 pl-2 shrink-0" style={{ borderLeft: "1px solid rgba(194,200,194,0.3)" }}>
            <Mic size={17} color="#904c2c" />
          </div>
        </div>
      </div>

      {pickerOpen && !loadingAddresses && (
        <LocationPickerModal addresses={addresses ?? []} onClose={() => setPickerOpen(false)} />
      )}
    </header>
  );
}