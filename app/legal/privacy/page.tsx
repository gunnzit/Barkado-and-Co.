import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy Policy — Barkado & Co." };

export default function PrivacyPage() {
  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 pt-4 pb-6">
          <Link href="/" className="tap-scale"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>

        <div className="prose text-sm space-y-4" style={{ color: "var(--chestnut, #3a2f22)" }}>
          <p style={{ color: "var(--muted)" }}>Last updated: August 2026</p>

          <p>This policy explains what information Barkado & Co. collects when you use our website and app, and how it's used.</p>

          <h2 className="font-bold text-base mt-6">1. Information we collect</h2>
          <p>When you create an account, we collect your name, email address, and phone number. When you book a service, we collect your delivery/service address and pet details (name, breed, and any care notes you provide). When you make a payment, card and payment details are handled directly by our payment partner, Razorpay — we never store your full card number.</p>
          <p>We also collect basic usage data — pages you visit and actions you take on the site — to help us understand how the Platform is used and improve it.</p>

          <h2 className="font-bold text-base mt-6">2. How we use your information</h2>
          <p>Your information is used to process bookings and orders, connect you with service providers, send you booking-related notifications by email, and improve the Platform. We do not sell your personal information to third parties.</p>

          <h2 className="font-bold text-base mt-6">3. Sharing with service providers</h2>
          <p>When you book a service, the assigned provider receives the information necessary to fulfil that booking — your pet's details, your address, and your contact number. Providers are expected to use this information only for the purpose of the booking.</p>

          <h2 className="font-bold text-base mt-6">4. Data storage and security</h2>
          <p>Your data is stored with reputable third-party infrastructure providers and protected using industry-standard security practices. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

          <h2 className="font-bold text-base mt-6">5. Your choices</h2>
          <p>You can review and update your account information, pet details, and saved addresses at any time from within the app. To request deletion of your account and associated data, contact us via the <Link href="/legal/contact" className="underline">Contact page</Link>.</p>

          <h2 className="font-bold text-base mt-6">6. Cookies and tracking</h2>
          <p>We use basic session cookies required for you to stay signed in, and collect anonymous usage analytics to understand how the Platform is used.</p>

          <h2 className="font-bold text-base mt-6">7. Changes to this policy</h2>
          <p>We may update this policy from time to time. Material changes will be reflected by updating the date at the top of this page.</p>

          <h2 className="font-bold text-base mt-6">8. Contact</h2>
          <p>Questions about this policy can be sent via our <Link href="/legal/contact" className="underline">Contact page</Link>.</p>
        </div>
      </main>
    </div>
  );
}