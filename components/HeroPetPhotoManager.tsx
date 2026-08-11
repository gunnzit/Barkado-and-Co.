"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Camera, X, Trash2 } from "lucide-react";

type Photo = { id: string; url: string };

export default function HeroPetPhotoManager({
  onPhotosChange,
}: {
  onPhotosChange: (urls: string[]) => void;
}) {
  const { isSignedIn } = useUser();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
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

  if (!isSignedIn) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-full tap-scale"
        style={{ background: "rgba(0,0,0,0.45)", zIndex: 6 }}
      >
        <Camera size={13} color="white" />
        <span className="text-white text-xs font-semibold">
          {photos.length > 0 ? `Your photos (${photos.length}/3)` : "Add your dog"}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 100 }}
          onClick={() => setOpen(false)}
        >
          <div className="card w-full max-w-sm" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Your dog's photos</h3>
              <button onClick={() => setOpen(false)} className="tap-scale">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              Upload up to 3 photos — they'll rotate through the hero banner just for you.
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
    </>
  );
}