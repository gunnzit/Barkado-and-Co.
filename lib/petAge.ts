// Real "X yrs Y mos" age formatter, computed from a real birthday.
// Shared between PetsClient and HomeUnified so both pages format a
// pet's age identically rather than maintaining two copies that could
// drift apart.
export function formatPetAge(birthday?: string | Date | null): string | null {
  if (!birthday) return null;
  const b = typeof birthday === "string" ? new Date(birthday) : birthday;
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} mo${remMonths === 1 ? "" : "s"}`;
  return `${years} yr${years === 1 ? "" : "s"}${remMonths > 0 ? ` ${remMonths} mo${remMonths === 1 ? "" : "s"}` : ""}`;
}