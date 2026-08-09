import Link from "next/link";
import { ArrowLeft, Phone, MapPin, AlertTriangle } from "lucide-react";
import BottomNav from "@/components/BottomNav";

// ⚠️ PLACEHOLDER DATA — replace every entry below with a real, verified
// 24/7 emergency vet or animal hospital before this page goes live.
// Someone may call these numbers during an actual pet emergency.
const EMERGENCY_CONTACTS = [
  {
    name: "[Add your local 24/7 emergency vet]",
    phone: "0000000000",
    hours: "Replace before launch",
    address: "[Add address]",
  },
  {
    name: "[Add a second nearby animal hospital]",
    phone: "0000000000",
    hours: "Replace before launch",
    address: "[Add address]",
  },
];

export default function EmergencyPage() {
  return (
    <main className="pb-28 max-w-2xl mx-auto" style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="flex items-center gap-3 px-6 py-5">
        <Link href="/" className="tap-scale">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle size={20} color="#c0392b" /> Emergency
        </h1>
      </div>

      <div className="px-6 mb-6">
        <div className="card" style={{ background: "#fdecea", borderColor: "#f3c6c1" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#c0392b" }}>
            If your pet is in immediate danger
          </p>
          <p className="text-sm" style={{ color: "#8a3229" }}>
            Call the nearest emergency vet directly below, or your regular vet if they're reachable.
          </p>
        </div>
      </div>

      <div className="px-6 space-y-3">
        {EMERGENCY_CONTACTS.map((c) => (
          <div key={c.name} className="card">
            <p className="font-bold text-sm mb-1">{c.name}</p>
            <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>{c.hours}</p>
            {c.address !== "[Add address]" && (
              <p className="text-xs flex items-center gap-1 mb-3" style={{ color: "var(--muted)" }}>
                <MapPin size={12} /> {c.address}
              </p>
            )}
            <a
              href={`tel:${c.phone}`}
              className="btn-primary w-full flex items-center justify-center gap-2 tap-scale"
              style={{ background: "#c0392b" }}
            >
              <Phone size={16} /> Call now
            </a>
          </div>
        ))}
      </div>

      <div className="px-6 mt-6">
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          PawConnect doesn't provide emergency medical care directly — these are contact numbers for
          local providers. In a life-threatening situation, contact a vet or animal hospital immediately.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
