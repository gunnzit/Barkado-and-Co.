"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Scissors, GraduationCap, Home as HomeIcon, Upload, FileText, Check } from "lucide-react";

const SERVICE_OPTIONS: { type: "WALKING" | "SITTING" | "GROOMING" | "TRAINING"; label: string; icon: any }[] = [
  { type: "WALKING", label: "Walking", icon: PawPrint },
  { type: "SITTING", label: "Sitting", icon: HomeIcon },
  { type: "GROOMING", label: "Grooming", icon: Scissors },
  { type: "TRAINING", label: "Training", icon: GraduationCap },
];

type Phase = "services" | "details" | "submitted";

export default function ProviderJoinForm({
  userEmail,
  userPhone,
}: {
  userEmail: string;
  userPhone: string | null;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("services");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phone, setPhone] = useState(userPhone ?? "");
  const [aadhaarUrl, setAadhaarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleService = (type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const continueToDetails = async () => {
    if (selected.size === 0) {
      setError("Pick at least one service you'll offer.");
      return;
    }
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/provider/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicesOffered: Array.from(selected) }),
    });
    setSubmitting(false);
    if (res.ok) {
      setPhase("details");
    } else {
      setError("Couldn't save your services — please try again.");
    }
  };

  const uploadAadhaar = async (file: File) => {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/provider/verification/upload", { method: "POST", body: formData });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setAadhaarUrl(data.url);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed — please try again.");
    }
  };

  const submitForReview = async () => {
    if (!phone.trim()) {
      setError("Add a phone number so owners and admins can reach you.");
      return;
    }
    if (!aadhaarUrl) {
      setError("Upload your Aadhaar card to continue.");
      return;
    }
    setError("");
    setSubmitting(true);
    if (phone !== userPhone) {
      await fetch("/api/user/phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
    }
    setSubmitting(false);
    setPhase("submitted");
  };

  if (phase === "submitted") {
    return (
      <div className="px-6 text-center py-14 animate-fade-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#e3f0e6" }}>
          <Check size={28} color="#2f7a44" />
        </div>
        <h2 className="text-xl font-bold mb-2">Your request has been sent</h2>
        <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: "var(--muted)" }}>
          We're reviewing your details. You'll get an email once you're approved — then you can start receiving requests.
        </p>
        <button onClick={() => router.push("/")} className="btn-secondary tap-scale">Back to home</button>
      </div>
    );
  }

  return (
    <div className="px-6">
      {/* Progress indicator, Uber-style segmented bar */}
      <div className="flex gap-1.5 mb-6">
        <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--terracotta)" }} />
        <div className="h-1.5 flex-1 rounded-full" style={{ background: phase === "details" ? "var(--terracotta)" : "var(--border)" }} />
      </div>

      {phase === "services" && (
        <div className="animate-fade-up">
          <h2 className="text-lg font-bold mb-1">What will you offer?</h2>
          <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Pick one, a few, or all of them.</p>

          <div className="space-y-2 mb-5">
            {SERVICE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = selected.has(opt.type);
              return (
                <button
                  key={opt.type}
                  onClick={() => toggleService(opt.type)}
                  className="card w-full flex items-center gap-3 tap-scale text-left"
                  style={{ border: `1px solid ${active ? "var(--terracotta)" : "var(--border)"}` }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                    <Icon size={16} color="var(--terracotta)" />
                  </div>
                  <span className="font-semibold text-sm flex-1">{opt.label}</span>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ border: `2px solid ${active ? "var(--terracotta)" : "var(--border)"}`, background: active ? "var(--terracotta)" : "transparent" }}
                  />
                </button>
              );
            })}
          </div>

          {error && <p className="text-xs mb-3" style={{ color: "var(--terracotta)" }}>{error}</p>}

          <button onClick={continueToDetails} disabled={submitting} className="btn-primary w-full tap-scale" style={{ opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Saving…" : "Continue"}
          </button>
        </div>
      )}

      {phase === "details" && (
        <div className="animate-fade-up">
          <h2 className="text-lg font-bold mb-1">Verify your details</h2>
          <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>We need these to confirm who you are.</p>

          <div className="card mb-3">
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Email</label>
            <p className="text-sm mt-1">{userEmail}</p>
          </div>

          <div className="card mb-3">
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          <div className="card mb-3">
            <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Aadhaar card</label>
            <p className="text-xs mt-1 mb-3" style={{ color: "var(--muted)" }}>A clear photo of the front of your Aadhaar card.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAadhaar(file);
              }}
            />
            {aadhaarUrl ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: "#2f7a44" }}>
                <FileText size={14} /> Uploaded — <button onClick={() => fileInputRef.current?.click()} className="underline tap-scale">replace</button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-secondary w-full tap-scale flex items-center justify-center gap-2 text-sm"
                style={{ opacity: uploading ? 0.6 : 1 }}
              >
                <Upload size={14} /> {uploading ? "Uploading…" : "Take or choose photo"}
              </button>
            )}
          </div>

          {error && <p className="text-xs mb-3" style={{ color: "var(--terracotta)" }}>{error}</p>}

          <button onClick={submitForReview} disabled={submitting} className="btn-primary w-full tap-scale" style={{ opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      )}
    </div>
  );
}