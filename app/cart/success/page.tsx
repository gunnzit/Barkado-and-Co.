import Link from "next/link";
import { Check } from "lucide-react";

export default function CartSuccessPage() {
  return (
    <div className="w-full flex items-center justify-center" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <div className="card text-center py-10 px-8 max-w-sm mx-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--cream)" }}>
          <Check size={26} color="var(--terracotta)" />
        </div>
        <h1 className="text-xl font-bold mb-2">Order placed</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Any services you booked are pending provider confirmation, and accessories will ship soon.
        </p>
        <Link href="/" className="btn-primary inline-block">Back to home</Link>
      </div>
    </div>
  );
}