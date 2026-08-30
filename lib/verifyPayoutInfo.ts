// Lighter-weight payout-info verification, buildable without RazorpayX
// access (which is currently blocked). This confirms a bank branch/UPI ID
// is correctly FORMATTED and, for IFSC, that the branch genuinely exists —
// it does NOT confirm the account belongs to the person submitting it.
// That stronger claim (identity-matched Reverse Penny Drop) needs real
// RazorpayX access and isn't built yet. Never present this as "account
// verified" in the UI — "format verified" is the honest label.

export type IfscLookupResult =
  | { valid: true; bankName: string; branch: string }
  | { valid: false };

// Razorpay's public IFSC lookup — free, no auth, no RazorpayX dependency.
// Returns real bank/branch details if the code exists, 404 if it doesn't.
export async function lookupIFSC(ifsc: string): Promise<IfscLookupResult> {
  try {
    const res = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(ifsc.toUpperCase())}`);
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return { valid: true, bankName: data.BANK, branch: data.BRANCH };
  } catch {
    // Network hiccup talking to the lookup service shouldn't itself block
    // a save — the caller decides whether to treat this as a soft failure.
    return { valid: false };
  }
}

// Basic shape check only — a real name@bank UPI ID, no existence check.
export function isValidVpaFormat(vpa: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa.trim());
}

// Digits only, plausible length for an Indian bank account number.
export function isValidAccountNumberFormat(num: string): boolean {
  return /^\d{6,20}$/.test(num.trim());
}