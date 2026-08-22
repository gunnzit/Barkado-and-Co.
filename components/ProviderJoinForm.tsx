"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PawPrint, Scissors, GraduationCap, Home as HomeIcon, Upload, FileText, Check, User } from "lucide-react";
import ProviderAvailabilityEditor from "@/components/ProviderAvailabilityEditor";

const SERVICE_OPTIONS: { type: "WALKING" | "SITTING" | "GROOMING" | "TRAINING"; label: string; icon: any }[] = [
  { type: "WALKING", label: "Walking", icon: PawPrint },
  { type: "SITTING", label: "Sitting", icon: HomeIcon },
  { type: "GROOMING", label: "Grooming", icon: Scissors },
  { type: "TRAINING", label: "Training", icon: GraduationCap },
];

type Phase = "services" | "details" | "hours" | "submitted";
const PHASE_INDEX: Record<Phase, number> = { services: 0, details: 1, hours: 2, submitted: 3 };

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [aadhaarUrl, setAadhaarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

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

  const uploadPhoto = async (file: File) => {
    setUploadingPhoto(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/provider/photo", { method: "POST", body: formData });
    setUploadingPhoto(false);
    if (res.ok) {
      const data = await res.json();
      setPhotoUrl(data.photoUrl);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Photo upload failed — please try again.");
    }
  };

  const uploadAadhaar = async (file: File) => {
    setUploadingAadhaar(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/provider/verification/upload", { method: "POST", body: formData });
    setUploadingAadhaar(false);
    if (res.ok) {
      const data = await res.json();
      setAadhaarUrl(data.url);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed — please try again.");
    }
  };

  const continueToHours = async () => {
    if (!phone.trim()) {
      setError("Add a phone number so owners and admins can reach you.");
      return;
    }
    if (!photoUrl) {
      setError("Add a profile photo to continue.");
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
    setPhase("hours");
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
        {(["services", "details", "hours"] as Phase[]).map((p) => (
          <div
            key={p}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: PHASE_INDEX[phase] >= PHASE_INDEX[p] ? "var(--terracotta)" : "var(--border)" }}
          />
        ))}
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
          <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>All of these are required before we can review you.</p>

          <div className="card mb-3 flex items-center gap-4">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto(file);
              }}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="tap-scale w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: "var(--cream)", border: `2px solid ${photoUrl ? "#2f7a44" : "var(--border)"}` }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={22} color="var(--muted)" />
              )}
            </button>
            <div>
              <p className="text-sm font-semibold">Profile photo</p>
              <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
                {uploadingPhoto ? "Uploading…" : photoUrl ? "Change photo" : "Add photo"}
              </button>
            </div>
          </div>

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
              ref={aadhaarInputRef}
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
                <FileText size={14} /> Uploaded — <button onClick={() => aadhaarInputRef.current?.click()} className="underline tap-scale">replace</button>
              </div>
            ) : (
              <button
                onClick={() => aadhaarInputRef.current?.click()}
                disabled={uploadingAadhaar}
                className="btn-secondary w-full tap-scale flex items-center justify-center gap-2 text-sm"
                style={{ opacity: uploadingAadhaar ? 0.6 : 1 }}
              >
                <Upload size={14} /> {uploadingAadhaar ? "Uploading…" : "Take or choose photo"}
              </button>
            )}
          </div>

          {error && <p className="text-xs mb-3" style={{ color: "var(--terracotta)" }}>{error}</p>}

          <button onClick={continueToHours} disabled={submitting} className="btn-primary w-full tap-scale" style={{ opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Saving…" : "Continue"}
          </button>
        </div>
      )}

      {phase === "hours" && (
        <div className="animate-fade-up">
          <h2 className="text-lg font-bold mb-1">Set your hours</h2>
          <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Optional — you can always set or change this later.</p>

          <div className="mb-5">
            <ProviderAvailabilityEditor />
          </div>

          <button onClick={() => setPhase("submitted")} className="btn-secondary w-full tap-scale">
            Skip / Continue
          </button>
        </div>
      )}
    </div>
  );
}