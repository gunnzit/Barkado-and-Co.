import Link from "next/link";
import { Phone } from "lucide-react";

export default function EmergencyButton() {
  return (
    <Link
      href="/emergency"
      className="tap-scale flex items-center gap-2 fixed bottom-24 right-5 z-40 px-4 py-3 rounded-full shadow-lg"
      style={{ background: "#c0392b", color: "white" }}
      aria-label="Emergency vet contacts"
    >
      <Phone size={16} />
      <span className="text-xs font-bold">Emergency</span>
    </Link>
  );
}
