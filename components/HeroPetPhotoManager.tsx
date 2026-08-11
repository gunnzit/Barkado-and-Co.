"use client";

import { useEffect, useRef, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Camera, X, Trash2, Sparkles } from "lucide-react";

type Photo = { id: string; url: string };

export default function HeroPetPhotoManager({
  onPhotosChange,
  topOffset = 20,
}: {
  onPhotosChange: (urls: string[]) => void;
  /** px from the top, so callers can avoid colliding with other top-left badges (e.g. a streak chip). */
  topOffset?: number;
}) {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pendingOpenAfterAuth, setPendingOpenAfterAuth] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch("/api/hero-photos");
    if (res.ok) {
      const data: Photo[] = await res.json();
      setPhotos(data);
      onPhotosChange(data.map((p) => p.url));
    }
  };

  useEffect(() => {
    if (isSignedIn) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // If someone tapped the button while signed out, we sent them to sign in.
  // Once they come back signed in, pick up right where they left off.
  useEffect(() => {
    if (isSignedIn && pendingOpenAfterAuth) {
      setPendingOpenAfterAuth(false);
      load();
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const handleClick = () => {
    if (!isSignedIn) {
      setPendingOpenAfterAuth(true);
      openSignIn();
      return;
    }
    setOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/hero-photos", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/hero-photos/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const showAttentionBadge = !isSignedIn || photos.length === 0;

  return (
    <>
      <button
        onClick={handleClick}
        className="hero-photo-cta absolute flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full tap-scale"
        style={{
          top: topOffset,
          left: 16,
          zIndex: 6,
          background: "linear-gradient(135deg, var(--terracotta) 0%, var(--gold) 100%)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        }}
      >
        <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.25)" }}>
          <Camera size={13} color="white" />
        </span>
        <span className="text-white text-sm font-bold whitespace-nowrap">
          {photos.length > 0 ? `Your dog's photos (${photos.length}/3)` : "✨ Add YOUR dog here"}
        </span>
        {showAttentionBadge && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "white" }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "white" }} />
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 100 }}
          onClick={() => setOpen(false)}
        >
          <div className="card w-full max-w-sm" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold flex items-center gap-1.5">
                <Sparkles size={16} color="var(--gold)" /> Your dog's photos
              </h3>
              <button onClick={() => setOpen(false)} className="tap-scale">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              Upload up to 3 photos — they'll show across PawConnect's hero banners, just for you.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photos.map((p) => (
                <div key={p.id} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "1" }}>
                  <img src={p.url} alt="Your dog" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                  >
                    <Trash2 size={10} color="white" />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label
                  htmlFor="hero-photo-upload"
                  className="rounded-lg flex items-center justify-center tap-scale"
                  style={{ aspectRatio: "1", background: "var(--cream)", border: "1px dashed var(--border)", cursor: "pointer" }}
                >
                  <Camera size={18} color="var(--muted)" />
                </label>
              )}
            </div>
            {error && <p className="text-xs mb-2" style={{ color: "var(--terracotta)" }}>{error}</p>}
            {uploading && <p className="text-xs" style={{ color: "var(--muted)" }}>Uploading…</p>}
            <input
              id="hero-photo-upload"
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading || photos.length >= 3}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes heroPhotoCtaPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(0,0,0,0.25), 0 0 0 0 rgba(232,169,74,0.6); }
          50% { box-shadow: 0 4px 14px rgba(0,0,0,0.25), 0 0 0 8px rgba(232,169,74,0); }
        }
        .hero-photo-cta {
          animation: heroPhotoCtaPulse 2.2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}