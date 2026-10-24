"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PawPrint, Scissors, GraduationCap, Home as HomeIcon, Upload, FileText, Check, User } from "lucide-react";
import ProviderAvailabilityEditor from "@/components/ProviderAvailabilityEditor";
import { compressImage } from "@/lib/compressImage";
import { normalizeIndianMobile } from "@/lib/phone";
import { SERVICE_CITIES, SERVICE_CITY_LABEL, type ServiceCity } from "@/lib/providerApplication";

const SERVICE_OPTIONS: { type: "WALKING" | "SITTING" | "GROOMING" | "TRAINING"; label: string; icon: any }[] = [
  { type: "WALKING", label: "Walking", icon: PawPrint },
  { type: "SITTING", label: "Sitting", icon: HomeIcon },
  { type: "GROOMING", label: "Grooming", icon: Scissors },
  { type: "TRAINING", label: "Training", icon: GraduationCap },
];

type Phase = "services" | "details" | "hours" | "review" | "submitted";
const STEPS: Phase[] = ["services", "details", "hours", "review"];

export type JoinInitial = {
  services: string[];
  photoUrl: string | null;
  hasDocument: boolean;
  bio: string;
  serviceCity: string;
} | null;

// Colours fall back to fixed values so this works whether or not the new
// design tokens (--success, --danger…) have been added to globals.css yet.
const OK = "var(--success, #2f7a44)";
const OK_BG = "var(--success-bg, #e3f0e6)";
const BAD = "var(--danger, #b3261e)";

const BIO_MIN = 20;
const BIO_MAX = 300;

export default function ProviderJoinForm({
  userEmail,
  userPhone,
  initial,
}: {
  userEmail: string;
  userPhone: string | null;
  initial: JoinInitial;
}) {
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.services ?? []));
  const [phone, setPhone] = useState(userPhone ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photoUrl ?? null);
  const [hasDocument, setHasDocument] = useState(initial?.hasDocument ?? false);
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [city, setCity] = useState<string>(initial?.serviceCity ?? "");
  const [accepted, setAccepted] = useState(false);

  // Resume where they left off: the server already knows what's been saved.
  const [phase, setPhase] = useState<Phase>(() => {
    if (!initial || initial.services.length === 0) return "services";
    const detailsDone =
      !!initial.photoUrl &&
      initial.hasDocument &&
      !!userPhone &&
      !!normalizeIndianMobile(userPhone) &&
      initial.bio.trim().length >= BIO_MIN &&
      !!initial.serviceCity;
    return detailsDone ? "hours" : "details";
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const toggleService = (type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const post = async (url: string, body: unknown, method = "POST") => {
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: { error: "Couldn't reach the server. Check your connection and try again." } };
    }
  };

  const upload = async (url: string, original: File) => {
    const file = await compressImage(original);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(url, { method: "POST", body: formData });
      if (res.status === 413) return { ok: false, data: { error: "That photo is too large. Try a smaller one." } };
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: { error: "Couldn't reach the server. Check your connection and try again." } };
    }
  };

  const continueToDetails = async () => {
    if (selected.size === 0) {
      setError("Pick at least one service you'll offer.");
      return;
    }
    setError("");
    setBusy(true);
    const { ok, data } = await post("/api/provider/join", { servicesOffered: Array.from(selected) });
    setBusy(false);
    if (ok) setPhase("details");
    else setError(data.error?.fieldErrors ? "Couldn't save your services — please try again." : data.error || "Couldn't save your services — please try again.");
  };

  const uploadPhoto = async (file: File) => {
    setUploadingPhoto(true);
    setError("");
    const { ok, data } = await upload("/api/provider/photo", file);
    setUploadingPhoto(false);
    if (ok) setPhotoUrl(data.photoUrl);
    else setError(data.error || "Photo upload failed — please try again.");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const uploadDoc = async (file: File) => {
    setUploadingDoc(true);
    setError("");
    const { ok, data } = await upload("/api/provider/verification/upload", file);
    setUploadingDoc(false);
    if (ok) setHasDocument(true);
    else setError(data.error || "Upload failed — please try again.");
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const continueToHours = async () => {
    const cleanPhone = normalizeIndianMobile(phone);
    if (!photoUrl) return setError("Add a profile photo to continue.");
    if (!cleanPhone) return setError("Enter a valid 10-digit Indian mobile number.");
    if (!city) return setError("Choose the area you'll work in.");
    if (bio.trim().length < BIO_MIN) return setError(`Write a short bio — at least ${BIO_MIN} characters.`);
    if (!hasDocument) return setError("Upload your ID to continue.");

    setError("");
    setBusy(true);
    if (cleanPhone !== userPhone) {
      const r = await post("/api/user/phone", { phone: cleanPhone }, "PATCH");
      if (!r.ok) {
        setBusy(false);
        return setError(r.data.error || "Couldn't save your phone number.");
      }
    }
    const saved = await post("/api/provider/application", { bio: bio.trim(), serviceCity: city, submit: false });
    setBusy(false);
    if (!saved.ok) return setError(saved.data.error || "Couldn't save your details — please try again.");
    setPhase("hours");
  };

  const submit = async () => {
    if (!accepted) return setError("Please accept the terms to send your application.");
    setError("");
    setBusy(true);
    const { ok, data } = await post("/api/provider/application", {
      bio: bio.trim(),
      serviceCity: city,
      submit: true,
      acceptTerms: true,
    });
    setBusy(false);
    if (ok) setPhase("submitted");
    else setError(data.error || "Couldn't send your application — please try again.");
  };

  const fieldClass = "w-full border rounded-lg px-3 py-3 text-base";
  const fieldStyle = { borderColor: "var(--border)", background: "var(--card)" };
  const errorEl = error ? (
    <p role="alert" className="text-sm mb-3" style={{ color: BAD }}>{error}</p>
  ) : null;

  if (phase === "submitted") {
    return (
      <div className="px-6 text-center py-14 animate-fade-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: OK_BG }}>
          <Check size={28} color="#2f7a44" />
        </div>
        <h2 className="text-xl font-bold mb-2">Your application has been sent</h2>
        <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: "var(--muted)" }}>
          We're reviewing your details. You'll get an email at {userEmail} once you're approved — then you can start receiving requests.
        </p>
        <button type="button" onClick={() => router.push("/")} className="btn-secondary tap-scale">Back to home</button>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(phase);

  return (
    <div className="px-6">
      <div className="flex gap-1.5 mb-6" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
        {STEPS.map((p, i) => (
          <div
            key={p}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: stepIndex >= i ? "var(--terracotta)" : "var(--border)" }}
          />
        ))}
      </div>

      {phase === "services" && (
        <div className="animate-fade-up">
          <h2 className="text-lg font-bold mb-1">What will you offer?</h2>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Pick one, a few, or all of them.</p>

          <div className="space-y-2 mb-5">
            {SERVICE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = selected.has(opt.type);
              return (
                <button
                  key={opt.type}
                  type="button"
                  role="checkbox"
                  aria-checked={active}
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
                  >
                    {active && <Check size={12} color="white" />}
                  </span>
                </button>
              );
            })}
          </div>

          {errorEl}

          <button type="button" onClick={continueToDetails} disabled={busy} className="btn-primary w-full tap-scale" style={{ opacity: busy ? 0.6 : 1 }}>
            {busy ? "Saving…" : "Continue"}
          </button>
        </div>
      )}

      {phase === "details" && (
        <div className="animate-fade-up">
          <h2 className="text-lg font-bold mb-1">Tell us about you</h2>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Everything here is required before we can review you.</p>

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
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              aria-label="Add or change profile photo"
              className="tap-scale w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: "var(--cream)", border: `2px solid ${photoUrl ? OK : "var(--border)"}` }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Your profile" className="w-full h-full object-cover" />
              ) : (
                <User size={22} color="var(--muted)" />
              )}
            </button>
            <div>
              <p className="text-sm font-semibold">Profile photo</p>
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>A clear photo of your face. Customers see this.</p>
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} className="text-sm font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
                {uploadingPhoto ? "Uploading…" : photoUrl ? "Change photo" : "Add photo"}
              </button>
            </div>
          </div>

          <div className="card mb-3">
            <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Email</p>
            <p className="text-sm mt-1">{userEmail}</p>
          </div>

          <div className="card mb-3">
            <label htmlFor="join-phone" className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Mobile number</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base" style={{ color: "var(--muted)" }}>+91</span>
              <input
                id="join-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
          </div>

          <div className="card mb-3">
            <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Where will you work?</p>
            <div className="flex flex-wrap gap-2 mt-2" role="radiogroup" aria-label="Service area">
              {SERVICE_CITIES.map((c: ServiceCity) => {
                const active = city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCity(c)}
                    className="tap-scale px-4 py-2 rounded-full text-sm font-semibold"
                    style={{
                      border: `1px solid ${active ? "var(--terracotta)" : "var(--border)"}`,
                      background: active ? "var(--terracotta)" : "transparent",
                      color: active ? "white" : "var(--forest)",
                    }}
                  >
                    {SERVICE_CITY_LABEL[c]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card mb-3">
            <label htmlFor="join-bio" className="text-sm font-semibold" style={{ color: "var(--muted)" }}>About you</label>
            <textarea
              id="join-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              rows={4}
              placeholder="Your experience with pets, what owners can expect from you…"
              className={`${fieldClass} mt-1`}
              style={fieldStyle}
            />
            <p className="text-xs mt-1 text-right" style={{ color: bio.trim().length < BIO_MIN ? "var(--muted)" : OK }}>
              {bio.trim().length}/{BIO_MAX} · at least {BIO_MIN}
            </p>
          </div>

          <div className="card mb-3">
            <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>ID proof (Aadhaar card, front)</p>
            <p className="text-xs mt-1 mb-3" style={{ color: "var(--muted)" }}>
              Only Barkado's review team can see this, and it's used only to confirm who you are. You can cover the first 8 digits of the number — we just need your name and photo to be clear.
            </p>
            <input
              ref={docInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadDoc(file);
              }}
            />
            {hasDocument ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: OK }}>
                <FileText size={14} /> Uploaded —
                <button type="button" onClick={() => docInputRef.current?.click()} disabled={uploadingDoc} className="underline tap-scale">
                  {uploadingDoc ? "uploading…" : "replace"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={uploadingDoc}
                className="btn-secondary w-full tap-scale flex items-center justify-center gap-2 text-sm"
                style={{ opacity: uploadingDoc ? 0.6 : 1 }}
              >
                <Upload size={14} /> {uploadingDoc ? "Uploading…" : "Take or choose photo"}
              </button>
            )}
          </div>

          {errorEl}

          <div className="flex gap-3">
            <button type="button" onClick={() => { setError(""); setPhase("services"); }} className="btn-secondary tap-scale">Back</button>
            <button type="button" onClick={continueToHours} disabled={busy} className="btn-primary flex-1 tap-scale" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {phase === "hours" && (
        <div className="animate-fade-up">
          <h2 className="text-lg font-bold mb-1">Set your hours</h2>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Optional — you can set or change this any time from your dashboard.</p>

          <div className="mb-5">
            <ProviderAvailabilityEditor />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setPhase("details")} className="btn-secondary tap-scale">Back</button>
            <button type="button" onClick={() => { setError(""); setPhase("review"); }} className="btn-primary flex-1 tap-scale">Continue</button>
          </div>
        </div>
      )}

      {phase === "review" && (
        <div className="animate-fade-up">
          <h2 className="text-lg font-bold mb-1">Review and send</h2>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Check your details, then send them for review.</p>

          <div className="card mb-3 space-y-2 text-sm">
            <p><span style={{ color: "var(--muted)" }}>Services: </span>{SERVICE_OPTIONS.filter((o) => selected.has(o.type)).map((o) => o.label).join(", ")}</p>
            <p><span style={{ color: "var(--muted)" }}>Area: </span>{city ? SERVICE_CITY_LABEL[city as ServiceCity] : "—"}</p>
            <p><span style={{ color: "var(--muted)" }}>Mobile: </span>+91 {normalizeIndianMobile(phone) ?? phone}</p>
            <p className="flex items-center gap-2"><Check size={14} color="#2f7a44" /> Profile photo added</p>
            <p className="flex items-center gap-2"><Check size={14} color="#2f7a44" /> ID uploaded</p>
            <button type="button" onClick={() => setPhase("details")} className="text-sm font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>Edit details</button>
          </div>

          <label className="card mb-3 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 shrink-0"
            />
            <span className="text-sm">
              I've read and agree to Barkado &amp; Co.'s{" "}
              <Link href="/legal/terms" target="_blank" className="underline" style={{ color: "var(--terracotta)" }}>Terms</Link>.
              I confirm the details I've given are true, and I understand I'll work as an independent provider, not as an employee of Barkado &amp; Co.
            </span>
          </label>

          {errorEl}

          <div className="flex gap-3">
            <button type="button" onClick={() => setPhase("hours")} className="btn-secondary tap-scale">Back</button>
            <button type="button" onClick={submit} disabled={busy} className="btn-primary flex-1 tap-scale" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Sending…" : "Send for review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}