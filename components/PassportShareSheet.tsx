"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Loader2, Link2, Share2, Check, Eye, EyeOff, Copy } from "lucide-react";

/*
 * Share the PawPassport: a read-only link + QR code for vets, boarders,
 * walkers, or a collar tag. Turning sharing off deletes the link, so old
 * QR codes stop working.
 *
 * Motion: drawer curve, 300ms in, exits the way it came. Reduced motion: fade.
 */

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const MUTED = "#5e4752";
const YELLOW = "#f9dd8a";
const H = { fontFamily: "var(--font-heading)" } as const;

export default function PassportShareSheet({
  petId,
  petName,
  token,
  onTokenChange,
  onClose,
}: {
  petId: string;
  petName: string;
  token: string | null;
  onTokenChange: (t: string | null) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const url = token && typeof window !== "undefined" ? `${window.location.origin}/passport/${token}` : null;

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!url) return setQr(null);
    QRCode.toDataURL(url, { margin: 1, width: 440, errorCorrectionLevel: "M", color: { dark: PLUM, light: "#fffaf0" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

  const turnOn = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/pets/${petId}/share`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return setError("Couldn't create the link. Please try again.");
    onTokenChange((await res.json()).shareToken);
  };

  const turnOff = async () => {
    if (!window.confirm(`Stop sharing ${petName}'s passport? The link and QR code will stop working.`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/pets/${petId}/share`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError("Couldn't turn sharing off. Please try again.");
    onTokenChange(null);
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy. Press and hold the link to copy it.");
    }
  };

  const nativeShare = async () => {
    if (!url) return;
    try {
      await navigator.share({ title: `${petName}'s PawPassport`, text: `${petName}'s PawPassport from Barkado & Co.`, url });
    } catch {
      /* closed the share sheet */
    }
  };

  return (
    <div className="fixed inset-0 z-[400]" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <style>{`
        @keyframes shIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes shOut { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes shFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes qrIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .sh-sheet { animation: shIn 300ms cubic-bezier(0.32, 0.72, 0, 1) both; }
        .sh-sheet.out { animation: shOut 220ms cubic-bezier(0.32, 0.72, 0, 1) both; }
        .sh-scrim { animation: shFadeIn 200ms ease both; }
        .sh-scrim.out { animation: shFadeOut 200ms ease both; }
        .sh-qr { animation: qrIn 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .sh-sheet { animation-name: shFadeIn; } .sh-sheet.out { animation-name: shFadeOut; } .sh-qr { animation-name: shFadeIn; }
        }
      `}</style>
      <button type="button" aria-label="Close" onClick={close} className={`sh-scrim ${closing ? "out" : ""} absolute inset-0`} style={{ background: "rgba(42,12,24,0.45)" }} />
      <div className={`sh-sheet ${closing ? "out" : ""} absolute left-0 right-0 bottom-0 max-w-lg mx-auto rounded-t-[2rem] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] max-h-[90vh] overflow-y-auto`} style={{ background: "#fffaf0", boxShadow: "0 -12px 40px -10px rgba(61,20,38,0.35)" }}>
        <span className="block w-10 h-1.5 rounded-full mx-auto mb-4" style={{ background: "rgba(61,20,38,0.15)" }} aria-hidden="true" />
        <div className="flex items-center justify-between mb-3">
          <h2 id="share-title" className="font-bold text-[20px]" style={{ ...H, color: PLUM }}>Share {petName}&rsquo;s passport</h2>
          <button type="button" onClick={close} aria-label="Close" className="tap-scale w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.1)" }}>
            <X size={17} color={INK} />
          </button>
        </div>

        {url ? (
          <>
            <p className="text-sm mb-4" style={{ color: MUTED }}>Anyone with this link or QR code can see a read-only copy. Show it to your vet or boarder, or print it for {petName}&rsquo;s collar tag.</p>
            <div className="mx-auto w-56 h-56 rounded-[1.5rem] p-3 flex items-center justify-center" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.1)" }}>
              {qr ? <img src={qr} alt={`QR code for ${petName}'s passport`} className="sh-qr w-full h-full" /> : <Loader2 size={22} className="animate-spin" color={PLUM} />}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl px-3.5 h-11" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.12)" }}>
              <Link2 size={14} color={MUTED} className="shrink-0" />
              <span className="text-xs truncate flex-1 select-all" style={{ color: INK }}>{url}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button type="button" onClick={copy} className="motion-select tap-scale h-12 rounded-full text-sm font-bold inline-flex items-center justify-center gap-1.5" style={{ ...H, background: copied ? YELLOW : "#ffffff", color: copied ? INK : PLUM, border: copied ? "none" : "1px solid rgba(61,20,38,0.14)" }}>
                {copied ? <><Check size={15} className="enter-pop" /> Copied</> : <><Copy size={15} /> Copy link</>}
              </button>
              {canNativeShare ? (
                <button type="button" onClick={nativeShare} className="tap-scale h-12 rounded-full text-sm font-bold inline-flex items-center justify-center gap-1.5" style={{ ...H, background: PLUM, color: "white" }}>
                  <Share2 size={15} /> Share
                </button>
              ) : (
                <a href={`https://wa.me/?text=${encodeURIComponent(`${petName}'s PawPassport: ${url}`)}`} target="_blank" rel="noreferrer" className="tap-scale h-12 rounded-full text-sm font-bold inline-flex items-center justify-center gap-1.5" style={{ ...H, background: PLUM, color: "white" }}>
                  <Share2 size={15} /> WhatsApp
                </a>
              )}
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color: PLUM }}>
              <Eye size={13} /> See what others see
            </a>
            <button type="button" onClick={turnOff} disabled={busy} className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs font-bold underline underline-offset-2" style={{ color: MUTED }}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <EyeOff size={13} />} Stop sharing
            </button>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: MUTED }}>Create a private link and QR code for vets, boarders, walkers, or {petName}&rsquo;s collar tag. You can stop sharing at any time.</p>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="rounded-2xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.08)" }}>
                <p className="font-bold mb-1.5" style={{ ...H, color: INK }}>They&rsquo;ll see</p>
                <p style={{ color: MUTED }}>Photo and basics, allergies, vaccines, medicines, care notes, vet, your first name and phone</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.08)" }}>
                <p className="font-bold mb-1.5" style={{ ...H, color: INK }}>Never shown</p>
                <p style={{ color: MUTED }}>Your address, home access notes, insurance numbers, bookings</p>
              </div>
            </div>
            <button type="button" onClick={turnOn} disabled={busy} className="tap-scale mt-5 w-full h-12 rounded-full text-[15px] font-bold inline-flex items-center justify-center gap-2" style={{ ...H, background: PLUM, color: YELLOW }}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Creating link…</> : <><Link2 size={16} /> Create share link</>}
            </button>
          </>
        )}
        {error && <p className="enter-fade text-xs font-semibold mt-3 px-3 py-2 rounded-xl" style={{ background: "#fdf1d6", color: "#8a2a4d" }}>{error}</p>}
      </div>
    </div>
  );
}
