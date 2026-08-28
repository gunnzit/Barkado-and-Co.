import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Terms & Conditions — Barkado & Co." };

export default function TermsPage() {
  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 pt-4 pb-6">
          <Link href="/" className="tap-scale"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold">Terms & Conditions</h1>
        </div>

        <div className="prose text-sm space-y-4" style={{ color: "var(--chestnut, #3a2f22)" }}>
          <p style={{ color: "var(--muted)" }}>Last updated: August 2026</p>

          <p>These Terms & Conditions govern your use of the Barkado & Co. website and mobile application (the "Platform"), operated by Barkado & Co., and your booking of pet care services ("Services") and purchase of pet accessories ("Products") through it. By using the Platform, you agree to these terms.</p>

          <h2 className="font-bold text-base mt-6">1. Who we are</h2>
          <p>Barkado & Co. is a platform connecting pet owners with independent pet care providers (walkers, sitters, groomers, and trainers) and selling pet accessories directly. Service providers listed on the Platform are independent individuals, not employees of Barkado & Co.</p>

          <h2 className="font-bold text-base mt-6">2. Bookings and payments</h2>
          <p>All service bookings and product purchases are paid for in advance through our payment partner, Razorpay. Prices shown are inclusive of applicable taxes unless stated otherwise. A booking is only confirmed once payment succeeds and, for services, once the assigned provider accepts the request.</p>

          <h2 className="font-bold text-base mt-6">3. Service provider responsibility</h2>
          <p>While Barkado & Co. verifies provider identity and documentation before approval, we do not guarantee the conduct, performance, or outcome of any individual service booking. Owners are encouraged to review provider ratings and communicate care instructions clearly before a booking begins.</p>

          <h2 className="font-bold text-base mt-6">4. Cancellations and rescheduling</h2>
          <p>See our <Link href="/legal/refund" className="underline">Cancellation & Refund Policy</Link> for details on cancelling or rescheduling a booking.</p>

          <h2 className="font-bold text-base mt-6">5. Account responsibility</h2>
          <p>You are responsible for maintaining accurate account information, including contact details and pet information, as this is used directly by providers to deliver services safely.</p>

          <h2 className="font-bold text-base mt-6">6. Limitation of liability</h2>
          <p>Barkado & Co. facilitates connections between pet owners and independent service providers and the sale of third-party or own-brand pet products. To the maximum extent permitted by law, Barkado & Co. is not liable for indirect, incidental, or consequential damages arising from a booking or purchase.</p>

          <h2 className="font-bold text-base mt-6">7. Changes to these terms</h2>
          <p>We may update these terms from time to time. Continued use of the Platform after changes constitutes acceptance of the revised terms.</p>

          <h2 className="font-bold text-base mt-6">8. Contact</h2>
          <p>Questions about these terms can be sent via our <Link href="/legal/contact" className="underline">Contact page</Link>.</p>
        </div>
      </main>
    </div>
  );
}