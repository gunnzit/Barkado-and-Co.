import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export const metadata = { title: "Contact Us — Barkado & Co." };

export default function ContactPage() {
  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto px-6">
        <div className="flex items-center gap-3 pt-4 pb-6">
          <Link href="/" className="tap-scale"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold">Contact Us</h1>
        </div>

        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Have a question about a booking, an order, or anything else? Reach out and we'll get back to you as soon as we can.
        </p>

        <div className="space-y-3">
          <a href="mailto:hello@barkadoandco.com" className="card flex items-center gap-3 tap-scale">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
              <Mail size={18} color="var(--terracotta)" />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Email</p>
              <p className="font-semibold text-sm">hello@barkadoandco.com</p>
            </div>
          </a>

          <a href="tel:+919988875745" className="card flex items-center gap-3 tap-scale">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
              <Phone size={18} color="var(--terracotta)" />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Phone</p>
              <p className="font-semibold text-sm">+91 99888 75745</p>
            </div>
          </a>
        </div>

        <p className="text-xs mt-6" style={{ color: "var(--muted)" }}>
          Barkado & Co. operates fully online — we don't have a physical storefront to visit, but we're reachable through the channels above.
        </p>
      </main>
    </div>
  );
}