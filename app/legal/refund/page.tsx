import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Cancellation & Refund Policy — Barkado & Co." };

export default function RefundPage() {
  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 pt-4 pb-6">
          <Link href="/" className="tap-scale"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold">Cancellation & Refund Policy</h1>
        </div>

        <div className="prose text-sm space-y-4" style={{ color: "var(--chestnut, #3a2f22)" }}>
          <p style={{ color: "var(--muted)" }}>Last updated: August 2026</p>

          <h2 className="font-bold text-base mt-6">Service bookings (walking, sitting, grooming, training)</h2>
          <p>You can cancel a service booking any time before it starts from the "Your bookings" page in the app. Once cancelled, any amount paid will be refunded to your original payment method. Refunds are initiated immediately on our end and typically reflect in your account within 5–7 business days, depending on your bank or payment provider.</p>
          <p>If a provider does not respond to your booking request within 24 hours, it automatically expires and is treated the same as a cancellation — you'll be refunded in full.</p>
          <p>You can also reschedule a booking to a new time instead of cancelling. Rescheduling does not require a new payment; the same booking moves to the new time, and the assigned provider is asked to re-confirm availability.</p>

          <h2 className="font-bold text-base mt-6">Accessory orders</h2>
          <p>Once an order for accessories is placed and payment succeeds, it enters processing and generally cannot be cancelled through the app. If you need to cancel or return an order, contact us via the <Link href="/legal/contact" className="underline">Contact page</Link> as soon as possible and we'll do our best to assist, depending on the order's status.</p>

          <h2 className="font-bold text-base mt-6">Failed or duplicate payments</h2>
          <p>If a payment is deducted from your account but a booking or order was not created (for example, due to a network issue), contact us with your payment reference and we will investigate and refund any duplicate or erroneous charge.</p>

          <h2 className="font-bold text-base mt-6">Contact</h2>
          <p>For any cancellation, refund, or payment issue, reach us via our <Link href="/legal/contact" className="underline">Contact page</Link>.</p>
        </div>
      </main>
    </div>
  );
}