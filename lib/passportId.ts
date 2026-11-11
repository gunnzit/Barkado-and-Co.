// The one PawPassport number for a pet, shown everywhere (pets list,
// passport page, shared passport). Derived from the pet's database id, so
// the same pet always has the same number and no extra column is needed.
// Format: BKD-XXXXXX (last six letters/digits of the id, upper case).
export function derivePassportNumber(petId: string): string {
  return `BKD-${petId.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-6)}`;
}
