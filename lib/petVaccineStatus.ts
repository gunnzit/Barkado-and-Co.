// Real vaccine-status chip, computed from actual Vaccination.nextDueDate
// rows — never a fixed mockup year/label. Shared between PetsClient and
// HomeUnified so both format this identically.
export function vaccineStatusChip(
  vaccinations: { nextDueDate: string | Date | null }[]
): { text: string; tone: "amber" | "red" } | null {
  const withDates = vaccinations.filter((v) => v.nextDueDate);
  if (withDates.length === 0) return null;
  const toDate = (d: string | Date) => (typeof d === "string" ? new Date(d) : d);
  const now = new Date();
  const soonest = withDates.reduce((a, b) => (toDate(a.nextDueDate!) < toDate(b.nextDueDate!) ? a : b));
  const due = toDate(soonest.nextDueDate!);
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return { text: "Vaccine overdue", tone: "red" };
  if (daysUntil <= 21) return { text: `Vaccine booster in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, tone: "amber" };
  return { text: `Vaccines valid (${due.getFullYear()})`, tone: "amber" };
}