"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Loader2, MapPin, ChevronRight } from "lucide-react";

/*
 * Bottom sheet for the details every booking needs: name, mobile, delivery
 * address. Opened from Profile, and from booking pages via
 * /owner/profile?edit=details&next=/walk-booking so customers return to
 * their booking after saving.
 *
 * Motion: drawer curve (cubic-bezier(0.32, 0.72, 0, 1)), 300ms in, exits the
 * same way it entered; backdrop fades. Reduced motion: fade only.
 */

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const MUTED = "#5e4752";
const H = { fontFamily: "var(--font-heading)" } as const;

export default function EditDetailsSheet({
  open,
  onClose,
  initial,
  next,
}: {
  open: boolean;
  onClose: () => void;
  initial: { name: string; phone: string | null; address: string | null };
  next?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial.name);
    setPhone(initial.phone ?? "");
    setAddress(initial.address ?? "");
    setError(null);
    setClosing(false);
    const t = setTimeout(() => firstField.current?.focus(), 320);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 240);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (address.trim().length < 8) return setError("Please enter your full address, with house number and area.");
    setSaving(true);
    try {
      if (phone.trim() !== (initial.phone ?? "")) {
        const res = await fetch("/api/user/phone", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(typeof body.error === "string" ? body.error : "Couldn't save your phone number.");
        }
      }
      const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, address }) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Couldn't save your details.");
      }
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.push(next);
      } else {
        router.refresh();
        close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400]" role="dialog" aria-modal="true" aria-labelledby="edit-details-title">
      <style>{`
        @keyframes sheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes sheetOut { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes scrimIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scrimOut { from { opacity: 1; } to { opacity: 0; } }
        .bk-sheet { animation: sheetIn 300ms cubic-bezier(0.32, 0.72, 0, 1) both; }
        .bk-sheet.out { animation: sheetOut 240ms cubic-bezier(0.32, 0.72, 0, 1) both; }
        .bk-scrim { animation: scrimIn 200ms ease both; }
        .bk-scrim.out { animation: scrimOut 200ms ease both; }
        @media (prefers-reduced-motion: reduce) {
          .bk-sheet, .bk-sheet.out { animation-name: scrimIn; }
          .bk-sheet.out { animation-name: scrimOut; }
        }
      `}</style>
      <button type="button" aria-label="Close" onClick={close} className={`bk-scrim ${closing ? "out" : ""} absolute inset-0`} style={{ background: "rgba(42,12,24,0.45)" }} />
      <form
        onSubmit={save}
        className={`bk-sheet ${closing ? "out" : ""} absolute left-0 right-0 bottom-0 max-w-lg mx-auto rounded-t-[2rem] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)]`}
        style={{ background: "#fffaf0", boxShadow: "0 -12px 40px -10px rgba(61,20,38,0.35)" }}
      >
        <span className="block w-10 h-1.5 rounded-full mx-auto mb-4" style={{ background: "rgba(61,20,38,0.15)" }} aria-hidden="true" />
        <div className="flex items-center justify-between mb-4">
          <h2 id="edit-details-title" className="font-bold text-[20px]" style={{ ...H, color: PLUM }}>Your details</h2>
          <button type="button" onClick={close} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center tap-scale" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.1)" }}>
            <X size={17} color={INK} />
          </button>
        </div>

        <label className="block text-xs font-bold mb-1.5" style={{ color: MUTED }} htmlFor="ed-name">Your name</label>
        <input ref={firstField} id="ed-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full h-12 px-4 rounded-2xl text-[15px] mb-3.5 outline-none focus:ring-2" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.12)", color: INK }} />

        <label className="block text-xs font-bold mb-1.5" style={{ color: MUTED }} htmlFor="ed-phone">Mobile number</label>
        <div className="flex items-center h-12 rounded-2xl mb-1 overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.12)" }}>
          <span className="pl-4 pr-2 text-[15px] font-semibold" style={{ color: MUTED }}>+91</span>
          <input id="ed-phone" value={phone.replace(/^\+?91/, "")} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" className="flex-1 h-full pr-4 text-[15px] outline-none bg-transparent" style={{ color: INK }} />
        </div>
        <p className="text-[11px] mb-3.5" style={{ color: MUTED }}>Your pro calls this number if they can&rsquo;t find you.</p>

        <label className="block text-xs font-bold mb-1.5" style={{ color: MUTED }} htmlFor="ed-address">Address for visits and deliveries</label>
        <textarea id="ed-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} autoComplete="street-address" placeholder="House 599, Sector 16, Chandigarh" className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none resize-none" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.12)", color: INK }} />
        <Link href="/owner/addresses" className="mt-1.5 mb-4 inline-flex items-center gap-1 text-xs font-bold" style={{ color: PLUM }}>
          <MapPin size={12} /> Manage saved addresses <ChevronRight size={12} />
        </Link>

        {error && <p className="enter-fade text-xs font-semibold mb-3 px-3 py-2 rounded-xl" style={{ background: "#fdf1d6", color: "#8a2a4d" }}>{error}</p>}

        <button type="submit" disabled={saving} className="motion-select tap-scale w-full h-12 rounded-full text-[15px] font-bold inline-flex items-center justify-center gap-2" style={{ background: PLUM, color: "white", ...H, opacity: saving ? 0.8 : 1 }}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : next ? "Save and continue booking" : "Save details"}
        </button>
      </form>
    </div>
  );
}
