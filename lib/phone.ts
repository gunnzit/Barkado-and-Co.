// Indian mobile numbers: 10 digits, starting 6-9. Accepts "98765 43210",
// "+91 98765-43210", "098765 43210". Returns the clean 10 digits, or null.
export function normalizeIndianMobile(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}