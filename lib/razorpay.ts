import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set — checkout will fail.");
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? "rzp_test_TSLqL72Q0Y0VVc",
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? "jzedHVQ0OSUWoV0z1hIsuLuS",
});