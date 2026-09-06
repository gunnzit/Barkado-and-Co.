// A real, stable "Paw Passport number" derived deterministically from a
// pet's actual database id — not a randomly generated or separately
// stored fake number. The same pet always produces the same number,
// verifiably computed from real data, with no schema change needed.
export function derivePassportNumber(petId: string): string {
  let hash = 0;
  for (let i = 0; i < petId.length; i++) {
    hash = (hash * 31 + petId.charCodeAt(i)) >>> 0;
  }
  return String(1000 + (hash % 9000));
}