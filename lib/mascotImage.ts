import { getBreedTheme } from "@/lib/breedTheme";

export type MascotPose = "active" | "headshot" | "sitting";

/**
 * Resolves a breed (free text) to the matching mascot illustration path.
 * Falls back to the generic mascot for unrecognized/empty breeds.
 */
export function getMascotPath(breed: string | null | undefined, pose: MascotPose): string {
  const theme = getBreedTheme(breed);
  const key = theme === "default" ? "generic-mascot" : theme;
  return `/images/mascots/mascot-${key}-${pose}.svg`;
}