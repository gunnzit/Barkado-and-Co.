export type BreedTheme =
  | "default"
  | "dalmatian"
  | "beagle"
  | "golden-retriever"
  | "german-shepherd"
  | "labrador";

/**
 * Matches free-text breed input to a known theme. Case-insensitive,
 * substring match (so "Golden Retriever mix" still matches "golden-retriever").
 * Falls back to "default" for anything unrecognized or empty.
 */
export function getBreedTheme(breed?: string | null): BreedTheme {
  if (!breed) return "default";
  const b = breed.toLowerCase();

  if (b.includes("dalmatian")) return "dalmatian";
  if (b.includes("beagle")) return "beagle";
  if (b.includes("golden")) return "golden-retriever";
  if (b.includes("german shepherd") || b.includes("gsd") || b.includes("alsatian")) return "german-shepherd";
  if (b.includes("labrador") || b.includes(" lab") || b === "lab") return "labrador";

  return "default";
}

/** className helper — apply to a wrapping element to theme everything inside it. */
export function breedThemeClass(breed?: string | null): string {
  const theme = getBreedTheme(breed);
  return theme === "default" ? "" : `theme-${theme}`;
}

const ALL_THEMES: BreedTheme[] = ["dalmatian", "beagle", "golden-retriever", "german-shepherd", "labrador"];

/** Shared list of theme choices for any theme-picker UI (pet profile page, pet switcher, etc.) */
export const THEME_OPTIONS: { key: string; label: string; swatch: string }[] = [
  { key: "auto", label: "Auto (match breed)", swatch: "linear-gradient(135deg, var(--terracotta) 50%, var(--gold) 50%)" },
  { key: "dalmatian", label: "Dalmatian", swatch: "linear-gradient(135deg, #1a1a1a 50%, #e63946 50%)" },
  { key: "beagle", label: "Beagle", swatch: "linear-gradient(135deg, #a0522d 50%, #d4a24c 50%)" },
  { key: "golden-retriever", label: "Golden Retriever", swatch: "linear-gradient(135deg, #d4972e 50%, #f6d76b 50%)" },
  { key: "german-shepherd", label: "German Shepherd", swatch: "linear-gradient(135deg, #7a4a24 50%, #3d2c1c 50%)" },
  { key: "labrador", label: "Labrador", swatch: "linear-gradient(135deg, #c9a66b 50%, #8f5f37 50%)" },
];

/**
 * Resolves the theme for a pet: a manual themeOverride wins if set to a real
 * theme key; otherwise falls back to auto-matching the breed text, same as
 * breedThemeClass. themeOverride of null/"auto"/anything unrecognized means
 * "use auto matching".
 */
export function resolveThemeClass(pet?: { breed?: string | null; themeOverride?: string | null } | null): string {
  if (!pet) return "";
  const override = pet.themeOverride;
  if (override && (ALL_THEMES as string[]).includes(override)) {
    return `theme-${override}`;
  }
  return breedThemeClass(pet.breed);
}