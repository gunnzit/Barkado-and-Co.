import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Shipping Policy — Barkado & Co." };

export default function ShippingPage() {
  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 pt-4 pb-6">
          <Link href="/" className="tap-scale"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold">Shipping Policy</h1>
        </div>

        <div className="prose text-sm space-y-4" style={{ color: "var(--chestnut, #3a2f22)" }}>
          <p style={{ color: "var(--muted)" }}>Last updated: August 2026</p>

          <p>This policy applies to accessory orders placed through our shop (leashes, collars, bowls, toys, beds, carriers, and similar items). It does not apply to service bookings (walking, sitting, grooming, training), which are fulfilled in person by an assigned provider, not shipped.</p>

          <h2 className="font-bold text-base mt-6">Processing time</h2>
          <p>Orders are typically processed within 1–2 business days of payment being confirmed.</p>

          <h2 className="font-bold text-base mt-6">Delivery</h2>
          <p>Delivery timelines vary depending on your location and are communicated at the time of order confirmation. Delays can occasionally occur due to courier or logistics issues outside our control.</p>

          <h2 className="font-bold text-base mt-6">Shipping address</h2>
          <p>Orders are shipped to the address associated with your account at the time of purchase. Please ensure your address details are accurate and complete before checking out, as we're unable to redirect a shipment once it's dispatched.</p>

          <h2 className="font-bold text-base mt-6">Questions about an order</h2>
          <p>For questions about the status of a specific order, reach us via our <Link href="/legal/contact" className="underline">Contact page</Link> with your order details.</p>
        </div>
      </main>
    </div>
  );
}