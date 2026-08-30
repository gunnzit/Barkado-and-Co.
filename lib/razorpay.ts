import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set — checkout will fail.");
}

// Hardcoded fallback credentials removed — even test-mode keys shouldn't
// live in source (this file's git history) since anyone with repo access
// could use them, and it's easy for a "test" fallback to accidentally end
// up meaning something in production if the real env vars are ever
// misconfigured. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in your actual
// environment (.env locally, Vercel env vars in production) instead.
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? "",
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
});