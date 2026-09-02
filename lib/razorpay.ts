import Razorpay from "razorpay";

// Lazily constructed — NOT built at module import time. Previously this
// file created the Razorpay client the moment any route imported it, which
// meant a missing/misconfigured key crashed the ENTIRE production build
// during Next.js's page-data collection step, for every route that merely
// imported this file — even ones that never actually charge anything.
// Now the client is only built the first time something actually calls
// getRazorpay(), so a missing key fails just that one real action, not
// the whole deployment.
let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (client) return client;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // Thrown only when something genuinely tries to use Razorpay without
    // real keys configured — not at build/import time.
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set — Razorpay actions will fail until these are configured.");
  }

  client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}

// Back-compat: existing code that does `import { razorpay } from "@/lib/razorpay"`
// and calls e.g. razorpay.orders.create(...) keeps working unchanged — this
// proxy defers the real client construction (and thus the "keys missing"
// error, if any) until the first property is actually accessed, not at
// import time.
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    return (getRazorpay() as any)[prop];
  },
});