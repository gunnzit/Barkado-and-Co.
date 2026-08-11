"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { breedThemeClass } from "@/lib/breedTheme";

/** Client-side equivalent of reading the active_pet_id cookie server-side —
 * fetches the user's pets and the active pet, returns the matching theme class. */
export function useActiveBreedTheme(): string {
  const { isSignedIn } = useUser();
  const [themeClass, setThemeClass] = useState("");

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      const [petsRes, activeRes] = await Promise.all([
        fetch("/api/pets"),
        fetch("/api/active-pet"),
      ]);
      const pets = petsRes.ok ? await petsRes.json() : [];
      const active = activeRes.ok ? await activeRes.json() : { petId: null };
      const activePet = pets.find((p: any) => p.id === active.petId) ?? pets[0];
      setThemeClass(breedThemeClass(activePet?.breed));
    })();
  }, [isSignedIn]);

  return themeClass;
}