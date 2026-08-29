// SAMPLE / PLACEHOLDER DATA — Experience, specialties, and certifications
// have no real field on Provider yet (providers will set these themselves
// later, per product decision). Values are cycled by a hash of the
// provider's id so the SAME provider always shows the SAME sample values
// everywhere they appear (list card, profile page) — otherwise the same
// trainer could show "3 years" in one place and "8+ years" in another,
// which would look like a bug even though both are placeholders.
//
// None of this is real data. It exists so Training screens don't look
// empty while the real provider-editable fields are built. This must be
// replaced with real data before real customers rely on it to evaluate a
// real trainer.

export const SAMPLE_EXPERIENCE = ["3 years", "5+ years", "8+ years", "2 years"];

export const SAMPLE_SPECIALTIES: [string, string][] = [
  ["Behavioral", "Puppy"],
  ["Agility", "Sports"],
  ["Anxiety", "Reactivity"],
  ["Obedience", "Socialization"],
];

export const SAMPLE_ROLE_TITLES = [
  "Certified Pet Trainer",
  "Senior Behavioral Specialist",
  "Puppy & Obedience Trainer",
  "Agility & Sports Trainer",
];

export const SAMPLE_CERTIFICATIONS = [
  ["CPDT-KA Certified", "AKC Canine Good Citizen Evaluator"],
  ["Fear Free Certified Professional", "Certified Separation Anxiety Trainer"],
  ["IAABC Accredited", "Low Stress Handling Certified"],
];

export function sampleIndexFor(id: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return hash % mod;
}