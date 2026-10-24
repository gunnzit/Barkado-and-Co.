// A Provider row is created as soon as someone picks their services (step 1 of
// the join form), so "row exists" does NOT mean "application submitted".
// The real marker is applicationSubmittedAt.
//
// Providers created before this field existed (before 25 Oct 2026) went through
// the old flow where uploading a document was the last step, so for them a
// document on file counts as submitted.
const LEGACY_CUTOFF = new Date("2026-10-25T00:00:00+05:30");

export const SERVICE_CITIES = ["CHANDIGARH", "MOHALI", "PANCHKULA"] as const;
export type ServiceCity = (typeof SERVICE_CITIES)[number];
export const SERVICE_CITY_LABEL: Record<ServiceCity, string> = {
  CHANDIGARH: "Chandigarh",
  MOHALI: "Mohali",
  PANCHKULA: "Panchkula",
};

export const PROVIDER_TERMS_VERSION = "2026-10-24";

export function isApplicationSubmitted(p: {
  applicationSubmittedAt: Date | null;
  verificationDocs: string[];
  createdAt: Date;
}): boolean {
  if (p.applicationSubmittedAt) return true;
  return p.createdAt < LEGACY_CUTOFF && p.verificationDocs.length > 0;
}