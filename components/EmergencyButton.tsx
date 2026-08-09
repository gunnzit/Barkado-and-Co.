import Link from "next/link";
import { Phone } from "lucide-react";

export default function EmergencyButton() {
  return (
    <Link
      href="/emergency"
      className="tap-scale flex items-center justify-center md:gap-2 fixed z-40 rounded-full shadow-lg w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-3"
      style={{
        background: "#c0392b",
        color: "white",
        bottom: "calc(90px + env(safe-area-inset-bottom))",
        right: 16,
      }}
      aria-label="Emergency vet contacts"
    >
      <Phone size={18} />
      <span className="hidden md:inline text-xs font-bold">Emergency</span>
    </Link>
  );
}
'@
[System.IO.File]::WriteAllText("$PWD\components\EmergencyButton.tsx", $content, [System.Text.UTF8Encoding]::new($false))