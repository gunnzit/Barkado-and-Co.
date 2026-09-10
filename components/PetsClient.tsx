"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft, Plus } from "lucide-react";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";

type Pet = {
  id: string;
  name: string;
  breed?: string;
  size: string;
  photoUrl?: string | null;
  vaccinations: { id: string; vaccineName: string; nextDueDate: string }[];
};

export default function PetsClient({ initialThemeClass = "" }: { initialThemeClass?: string }) {
  const [pets, setPets] = useState<Pet[]>([]);

  const loadPets = async () => {
    const res = await fetch("/api/pets");
    if (res.ok) setPets(await res.json());
  };

  useEffect(() => {
    loadPets();
  }, []);

  const themeClass = initialThemeClass;

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
    <main className="max-w-lg lg:max-w-4xl mx-auto px-6 py-10 pb-28">
      <div className="flex items-center justify-between mb-4">
        <PetSwitcher />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
      <Link href="/" className="flex items-center gap-2 tap-scale mb-4" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to home</span>
      </Link>
      <h1 className="text-2xl font-bold mb-6">Your pets</h1>

      <div className="lg:flex lg:gap-8 lg:items-start">
        {/* Single real entry point — the multi-field wizard at
            /owner/pets/new. The old inline quick-add form was removed so
            there's only one place to add a pet, not two. */}
        <Link
          href="/owner/pets/new"
          className="card mb-8 lg:mb-0 lg:w-96 lg:shrink-0 lg:sticky lg:top-10 flex items-center gap-3 tap-scale"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)", border: "1px dashed var(--border)" }}>
            <Plus size={20} color="var(--tan-dark, var(--tan))" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Add a pet</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Create a PawPassport profile</p>
          </div>
          <ChevronRight size={18} color="var(--muted)" />
        </Link>

        <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {pets.map((p) => (
            <Link href={`/owner/pets/${p.id}`} key={p.id} className="card flex items-center justify-between tap-scale">
              <div className="flex items-center gap-3">
                {p.photoUrl && (
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
                    <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <p className="font-bold">{p.name} <span className="text-sm font-normal" style={{ color: "var(--muted)" }}>{p.breed}</span></p>
                  {p.vaccinations.length > 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      💉 {p.vaccinations.length} vaccine{p.vaccinations.length > 1 ? "s" : ""} on record
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight size={18} color="var(--muted)" />
            </Link>
          ))}
        </div>
      </div>
    </main>
    </div>
  );
}