"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ChevronDown, PawPrint, Check } from "lucide-react";
import { getMascotPath } from "@/lib/mascotImage";

type Pet = { id: string; name: string; breed?: string | null; photoUrl?: string | null };

export default function PetSwitcher() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
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

  if (!isSignedIn || !loaded || pets.length === 0) return null;

  const activePet = pets.find((p) => p.id === activeId) ?? pets[0];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full tap-scale"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
          <img src={activePet.photoUrl ?? getMascotPath(activePet.breed, "headshot")} alt={activePet.name} className="w-full h-full object-cover" />
        </div>
        <span className="text-xs font-semibold whitespace-nowrap">Viewing {activePet.name}</span>
        {pets.length > 1 && <ChevronDown size={13} color="var(--muted)" />}
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
  );
}