"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Clock, FileText, Upload } from "lucide-react";

type ProviderProfile = {
  verified: boolean;
  verificationDocs: string[];
  verificationSubmittedAt: string | null;
};

function docLabel(url: string, index: number) {
  const raw = url.split("/").pop() ?? `Document ${index + 1}`;
  // Strip the "{timestamp}-" prefix we add at upload time for a cleaner display name.
  return raw.replace(/^\d+-/, "");
}

export default function ProviderVerificationUpload() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch("/api/provider/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/provider/verification/upload", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed. Please try again.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) return <p className="text-sm px-1" style={{ color: "var(--muted)" }}>Loading…</p>;
  if (!profile) return null;

  return (
    <div className="space-y-3">
      {profile.verified ? (
        <div className="card flex items-center gap-3" style={{ background: "#e3f0e6", border: "1px solid #2f7a44" }}>
          <ShieldCheck size={20} color="#2f7a44" />
          <div>
            <p className="font-semibold text-sm" style={{ color: "#2f7a44" }}>Verified</p>
            <p className="text-xs" style={{ color: "#2f7a44" }}>You're approved and visible to owners booking services.</p>
          </div>
        </div>
      ) : (
        <div className="card flex items-center gap-3" style={{ background: "#fdece0", border: "1px solid #e8a94a" }}>
          <Clock size={20} color="#a5652a" />
          <div>
            <p className="font-semibold text-sm" style={{ color: "#a5652a" }}>
              {profile.verificationDocs.length > 0 ? "Pending review" : "Not yet submitted"}
            </p>
            <p className="text-xs" style={{ color: "#a5652a" }}>
              {profile.verificationDocs.length > 0
                ? "An admin will review your documents shortly."
                : "Upload an ID or certification to get verified and start receiving requests."}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Upload a document</p>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Government ID, certification, or proof of experience. JPG, PNG, or PDF, up to 10MB.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-primary w-full tap-scale flex items-center justify-center gap-2"
          style={{ opacity: uploading ? 0.6 : 1 }}
        >
          <Upload size={15} />
          {uploading ? "Uploading…" : "Choose a file"}
        </button>
        {error && <p className="text-xs mt-2" style={{ color: "var(--terracotta)" }}>{error}</p>}
      </div>

      {profile.verificationDocs.length > 0 && (
        <div className="card">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Submitted documents</p>
          <div className="space-y-2">
            {profile.verificationDocs.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs tap-scale"
                style={{ color: "var(--terracotta)" }}
              >
                <FileText size={13} /> {docLabel(url, i)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}