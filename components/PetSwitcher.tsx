"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ChevronDown, PawPrint, Check, Palette } from "lucide-react";
import { getMascotPath } from "@/lib/mascotImage";
import { THEME_OPTIONS } from "@/lib/breedTheme";

type Pet = { id: string; name: string; breed?: string | null; photoUrl?: string | null; themeOverride?: string | null };

export default function PetSwitcher({ avatarOnly = false }: { avatarOnly?: boolean }) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      const [petsRes, activeRes] = await Promise.all([
        fetch("/api/pets"),
        fetch("/api/active-pet"),
      ]);
      const petsData: Pet[] = petsRes.ok ? await petsRes.json() : [];
      const activeData = activeRes.ok ? await activeRes.json() : { petId: null };
      setPets(petsData);
      // If the URL itself names a pet (a pet detail page), that pet is the active one visually.
      const urlPetId = pathname.match(/^\/owner\/pets\/([^/]+)/)?.[1];
      const fallback = petsData[0]?.id ?? null;
      setActiveId(urlPetId || activeData.petId || fallback);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, pathname]);

  const handleSelect = async (petId: string) => {
    setActiveId(petId);
    setOpen(false);

    const onPetDetailPage = /^\/owner\/pets\/[^/]+/.test(pathname);
    if (onPetDetailPage) {
      router.push(`/owner/pets/${petId}`);
      return;
    }

    await fetch("/api/active-pet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ petId }),
    });
    router.refresh();
  };

  const setPetTheme = async (petId: string, themeKey: string) => {
    const value = themeKey === "auto" ? null : themeKey;
    setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, themeOverride: value } : p))); // optimistic
    setThemeMenuOpen(false);
    const res = await fetch(`/api/pets/${petId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeOverride: value }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, themeOverride: pets.find((x) => x.id === petId)?.themeOverride } : p))); // revert
    }
  };

  if (!isSignedIn || !loaded || pets.length === 0) return null;

  const activePet = pets.find((p) => p.id === activeId) ?? pets[0];
  const currentThemeKey = activePet.themeOverride ?? "auto";
  const currentThemeSwatch = THEME_OPTIONS.find((t) => t.key === currentThemeKey)?.swatch ?? THEME_OPTIONS[0].swatch;

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-block">
        <button
          onClick={() => setOpen((v) => !v)}
          className={avatarOnly ? "relative tap-scale block" : "flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full tap-scale"}
          style={avatarOnly ? {} : { background: "var(--card)", border: "1px solid var(--border)" }}
          aria-label={`Viewing ${activePet.name}`}
        >
          <div
            className={
              avatarOnly
                ? "w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                : "w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            }
            style={{
              background: "var(--cream)",
              border: avatarOnly ? "2px solid var(--card)" : "none",
              boxShadow: avatarOnly ? "0 0 0 1px var(--border)" : "none",
            }}
          >
            <img src={activePet.photoUrl ?? getMascotPath(activePet.breed, "headshot")} alt={activePet.name} className="w-full h-full object-cover" />
          </div>

          {avatarOnly && pets.length > 1 && (
            <span
              className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
              style={{ width: 16, height: 16, background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <ChevronDown size={10} color="var(--muted)" />
            </span>
          )}

          {!avatarOnly && (
            <>
              <span className="text-xs font-semibold whitespace-nowrap">Viewing {activePet.name}</span>
              {pets.length > 1 && <ChevronDown size={13} color="var(--muted)" />}
            </>
          )}
        </button>

        {open && pets.length > 1 && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden z-50 shadow-lg"
              style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: 180 }}
            >
              {pets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 tap-scale text-left"
                  style={{ background: p.id === activePet.id ? "var(--cream)" : "transparent" }}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                    <img src={p.photoUrl ?? getMascotPath(p.breed, "headshot")} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium flex-1">{p.name}</span>
                  {p.id === activePet.id && <Check size={14} color="var(--terracotta)" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Theme swatch — quick theme switch for the active pet, right beside the switcher */}
      <div className="relative inline-block">
        <button
          onClick={() => setThemeMenuOpen((v) => !v)}
          className="tap-scale rounded-full flex items-center justify-center"
          style={{ width: 30, height: 30, background: currentThemeSwatch, border: "1px solid var(--border)" }}
          aria-label="Change theme"
        >
          <Palette size={12} color="white" style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))" }} />
        </button>

        {themeMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setThemeMenuOpen(false)} />
            <div
              className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-lg p-3"
              style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: 200 }}
            >
              <p className="text-[10px] font-semibold mb-2" style={{ color: "var(--muted)" }}>Theme for {activePet.name}</p>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((opt) => {
                  const isActive = currentThemeKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setPetTheme(activePet.id, opt.key)}
                      className="tap-scale flex flex-col items-center gap-1"
                    >
                      <span
                        className="w-8 h-8 rounded-full block"
                        style={{
                          background: opt.swatch,
                          boxShadow: isActive ? "0 0 0 2px var(--card), 0 0 0 3.5px var(--terracotta)" : "none",
                        }}
                      />
                      <span className="text-[9px] text-center leading-tight" style={{ color: isActive ? "var(--terracotta)" : "var(--muted)", fontWeight: isActive ? 700 : 500 }}>
                        {opt.label === "Auto (match breed)" ? "Auto" : opt.label.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}