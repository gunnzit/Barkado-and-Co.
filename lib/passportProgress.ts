// What makes a PawPassport useful to a vet, a pro or a boarder. Shared by
// the Passport page and the homepage so both show the same percentage.

export type PassportStepKey = "photo" | "birthday" | "weight" | "vaccine" | "allergies" | "care" | "vet" | "emergency";

export type PassportInput = {
  photoUrl: string | null;
  birthday: Date | string | null;
  weightKg: number | null;
  vaccinationCount: number;
  allergies: string | null;
  allergyTags: string[];
  temperament: string | null;
  temperamentTags: string[];
  notes: string | null;
  vetHospitalName: string | null;
  vetEmergencyPhone: string | null;
  emergencyContactCount: number;
};

const has = (v: string | null | undefined) => Boolean(v && v.trim());

export function passportChecklist(p: PassportInput): { key: PassportStepKey; label: string; done: boolean }[] {
  return [
    { key: "photo", label: "Add a photo", done: has(p.photoUrl) },
    { key: "birthday", label: "Add a birthday", done: Boolean(p.birthday) },
    { key: "weight", label: "Add weight", done: p.weightKg != null },
    { key: "vaccine", label: "Add a vaccine", done: p.vaccinationCount > 0 },
    { key: "allergies", label: "Note any allergies", done: p.allergyTags.length > 0 || has(p.allergies) },
    { key: "care", label: "Add care notes", done: p.temperamentTags.length > 0 || has(p.temperament) || has(p.notes) },
    { key: "vet", label: "Add your vet", done: has(p.vetHospitalName) },
    { key: "emergency", label: "Add an emergency contact", done: p.emergencyContactCount > 0 || has(p.vetEmergencyPhone) },
  ];
}

export function passportProgress(p: PassportInput) {
  const steps = passportChecklist(p);
  const done = steps.filter((s) => s.done).length;
  return { steps, done, total: steps.length, pct: Math.round((done / steps.length) * 100), next: steps.find((s) => !s.done) ?? null };
}
