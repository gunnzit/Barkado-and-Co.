"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PawPrint, Camera, Pencil, Plus, Syringe, AlertTriangle, HeartHandshake, Stethoscope, Phone,
  ShieldCheck, Cpu, Pill, Users, Footprints, Scissors, GraduationCap, Home as HomeIcon, Check,
  ChevronRight, X, Loader2, Star, CalendarClock, Sparkles, Share2,
} from "lucide-react";
import TaskHeader from "@/components/TaskHeader";
import { derivePassportNumber } from "@/lib/passportId";
import PassportShareSheet from "@/components/PassportShareSheet";
import { passportChecklist, type PassportStepKey } from "@/lib/passportProgress";

/* ---------- Types ---------- */

type Vaccination = { id: string; vaccineName: string; nextDueDate: string | null; dateGiven: string; clinicName: string | null; administeringVet: string | null };
type Booking = {
  id: string;
  type: string;
  status: string;
  startTime: string;
  provider: { user: { name: string } };
  report: { distanceKm: number | null; photos: string[]; notes: string | null } | null;
  review: { rating: number } | null;
};
type Medication = { id: string; name: string; dosage: string | null; schedule: string | null; active: boolean };
type Contact = { id: string; name: string; phone: string; relationship: string | null };

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  size: string;
  gender: "MALE" | "FEMALE" | null;
  neutered: boolean | null;
  coatColor: string | null;
  temperament: string | null;
  temperamentTags: string[];
  notes: string | null;
  birthday: string | null;
  weightKg: number | null;
  allergies: string | null;
  allergyTags: string[];
  medicalHistory: string | null;
  favoriteTreats: string | null;
  microchipId: string | null;
  insuranceProvider: string | null;
  insurancePolicy: string | null;
  insuranceCoveragePaise: number | null;
  insuranceExpiryDate: string | null;
  vetHospitalName: string | null;
  vetHospitalAddress: string | null;
  attendingVetName: string | null;
  vetEmergencyPhone: string | null;
  photoUrl: string | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { name: string; phone: string | null };
  vaccinations: Vaccination[];
  medications: Medication[];
  emergencyContacts: Contact[];
  bookings: Booking[];
};

/* ---------- Brand + helpers ---------- */

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const MUTED = "#5e4752";
const YELLOW = "#f9dd8a";
const BLUE = "#a5bde1";
const H = { fontFamily: "var(--font-heading)" } as const;
const CARD = { background: "#ffffff", border: "1px solid rgba(61,20,38,0.08)", boxShadow: "0 8px 24px -6px rgba(61,20,38,0.07)" } as const;

const has = (v: string | null | undefined) => Boolean(v && v.trim());
const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...opts });

function ageLabel(birthday: string | null) {
  if (!birthday) return null;
  const months = Math.floor((Date.now() - new Date(birthday).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 1) return "Under a month";
  if (months < 12) return `${months} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} yr ${m} mo` : `${y} yr`;
}

type VaxStatus = "OK" | "DUE_SOON" | "OVERDUE";
function vaxStatus(v: Vaccination): { status: VaxStatus; days: number | null } {
  if (!v.nextDueDate) return { status: "OK", days: null };
  const days = Math.floor((new Date(v.nextDueDate).getTime() - Date.now()) / 86_400_000);
  return { status: days < 0 ? "OVERDUE" : days <= 30 ? "DUE_SOON" : "OK", days };
}

const SIZE_LABEL: Record<string, string> = { SMALL: "Small", MEDIUM: "Medium", LARGE: "Large", GIANT: "Giant" };

const SERVICE: Record<string, { label: string; icon: typeof PawPrint; href: string }> = {
  WALKING: { label: "Walk", icon: Footprints, href: "/walk-booking" },
  GROOMING: { label: "Grooming", icon: Scissors, href: "/grooming" },
  TRAINING: { label: "Training", icon: GraduationCap, href: "/training" },
  SITTING: { label: "Home stay", icon: HomeIcon, href: "/" },
};

/* ---------- Edit sheet ---------- */

type FieldDef = { key: string; label: string; type?: "text" | "textarea" | "date" | "number" | "select"; options?: { value: string; label: string }[]; placeholder?: string; inputMode?: "decimal" | "tel" | "numeric" };
type SheetKey = "basics" | "health" | "care" | "vet" | "ids";

const SHEETS: Record<SheetKey, { title: string; fields: FieldDef[] }> = {
  basics: {
    title: "Basics",
    fields: [
      { key: "name", label: "Name" },
      { key: "breed", label: "Breed", placeholder: "e.g. Indie, Labrador" },
      { key: "size", label: "Size", type: "select", options: [{ value: "SMALL", label: "Small" }, { value: "MEDIUM", label: "Medium" }, { value: "LARGE", label: "Large" }, { value: "GIANT", label: "Giant" }] },
      { key: "gender", label: "Sex", type: "select", options: [{ value: "", label: "Not set" }, { value: "MALE", label: "Boy" }, { value: "FEMALE", label: "Girl" }] },
      { key: "neutered", label: "Neutered or spayed", type: "select", options: [{ value: "", label: "Not set" }, { value: "true", label: "Yes" }, { value: "false", label: "No" }] },
      { key: "birthday", label: "Birthday", type: "date" },
      { key: "weightKg", label: "Weight (kg)", type: "number", inputMode: "decimal", placeholder: "e.g. 18.5" },
      { key: "coatColor", label: "Coat colour", placeholder: "e.g. Black and white" },
    ],
  },
  health: {
    title: "Health",
    fields: [
      { key: "allergies", label: "Allergies", type: "textarea", placeholder: "e.g. Chicken, grass pollen. Write 'None' if there are none." },
      { key: "medicalHistory", label: "Medical history", type: "textarea", placeholder: "Past conditions, surgeries, anything a vet should know" },
    ],
  },
  care: {
    title: "Care notes",
    fields: [
      { key: "temperament", label: "Personality", placeholder: "e.g. Friendly, shy with big dogs" },
      { key: "notes", label: "Handling notes", type: "textarea", placeholder: "e.g. Pulls on the leash, scared of bikes, loves belly rubs" },
      { key: "favoriteTreats", label: "Favourite treats", placeholder: "e.g. Peanut butter biscuits" },
    ],
  },
  vet: {
    title: "Vet",
    fields: [
      { key: "vetHospitalName", label: "Clinic or hospital", placeholder: "e.g. Sector 17 Pet Clinic" },
      { key: "attendingVetName", label: "Vet's name", placeholder: "e.g. Dr. Mehta" },
      { key: "vetEmergencyPhone", label: "Clinic phone", inputMode: "tel", placeholder: "Number to call in an emergency" },
      { key: "vetHospitalAddress", label: "Clinic address", type: "textarea" },
    ],
  },
  ids: {
    title: "Microchip and insurance",
    fields: [
      { key: "microchipId", label: "Microchip number", inputMode: "numeric" },
      { key: "insuranceProvider", label: "Insurance company" },
      { key: "insurancePolicy", label: "Policy number" },
      { key: "insuranceCoverageRupees", label: "Cover amount (₹)", type: "number", inputMode: "numeric" },
      { key: "insuranceExpiryDate", label: "Policy ends", type: "date" },
    ],
  },
};

function formFromPet(pet: Pet): Record<string, string> {
  return {
    name: pet.name,
    breed: pet.breed ?? "",
    size: pet.size,
    gender: pet.gender ?? "",
    neutered: pet.neutered === null ? "" : String(pet.neutered),
    birthday: pet.birthday?.slice(0, 10) ?? "",
    weightKg: pet.weightKg?.toString() ?? "",
    coatColor: pet.coatColor ?? "",
    allergies: pet.allergies ?? "",
    medicalHistory: pet.medicalHistory ?? "",
    temperament: pet.temperament ?? "",
    notes: pet.notes ?? "",
    favoriteTreats: pet.favoriteTreats ?? "",
    vetHospitalName: pet.vetHospitalName ?? "",
    attendingVetName: pet.attendingVetName ?? "",
    vetEmergencyPhone: pet.vetEmergencyPhone ?? "",
    vetHospitalAddress: pet.vetHospitalAddress ?? "",
    microchipId: pet.microchipId ?? "",
    insuranceProvider: pet.insuranceProvider ?? "",
    insurancePolicy: pet.insurancePolicy ?? "",
    insuranceCoverageRupees: pet.insuranceCoveragePaise != null ? String(pet.insuranceCoveragePaise / 100) : "",
    insuranceExpiryDate: pet.insuranceExpiryDate?.slice(0, 10) ?? "",
  };
}

function payloadFor(sheet: SheetKey, f: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const field of SHEETS[sheet].fields) {
    const v = f[field.key]?.trim() ?? "";
    switch (field.key) {
      case "weightKg":
        if (v && Number(v) > 0) out.weightKg = Number(v);
        break;
      case "birthday":
      case "insuranceExpiryDate":
        if (v) out[field.key] = v;
        break;
      case "gender":
        if (v) out.gender = v;
        break;
      case "neutered":
        if (v) out.neutered = v === "true";
        break;
      case "insuranceCoverageRupees":
        if (v && Number(v) >= 0) out.insuranceCoveragePaise = Math.round(Number(v) * 100);
        break;
      default:
        out[field.key] = v;
    }
  }
  return out;
}

function EditSheet({ sheet, pet, onClose, onSaved }: { sheet: SheetKey; pet: Pet; onClose: () => void; onSaved: (p: Partial<Pet>) => void }) {
  const def = SHEETS[sheet];
  const [form, setForm] = useState(() => formFromPet(pet));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const first = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };

  useEffect(() => {
    const t = setTimeout(() => first.current?.focus(), 320);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (sheet === "basics" && form.name.trim().length < 1) return setError("Your dog needs a name.");
    setSaving(true);
    const res = await fetch(`/api/pets/${pet.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payloadFor(sheet, form)) });
    setSaving(false);
    if (!res.ok) return setError("Couldn't save. Please check the details and try again.");
    onSaved(await res.json());
    close();
  };

  const inputStyle = { background: "#ffffff", border: "1px solid rgba(61,20,38,0.12)", color: INK } as const;

  return (
    <div className="fixed inset-0 z-[400]" role="dialog" aria-modal="true" aria-labelledby="pp-sheet-title">
      <style>{`
        @keyframes ppIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes ppOut { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes ppFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ppFadeOut { from { opacity: 1; } to { opacity: 0; } }
        .pp-sheet { animation: ppIn 300ms cubic-bezier(0.32, 0.72, 0, 1) both; }
        .pp-sheet.out { animation: ppOut 220ms cubic-bezier(0.32, 0.72, 0, 1) both; }
        .pp-scrim { animation: ppFadeIn 200ms ease both; }
        .pp-scrim.out { animation: ppFadeOut 200ms ease both; }
        @media (prefers-reduced-motion: reduce) { .pp-sheet { animation-name: ppFadeIn; } .pp-sheet.out { animation-name: ppFadeOut; } }
      `}</style>
      <button type="button" aria-label="Close" onClick={close} className={`pp-scrim ${closing ? "out" : ""} absolute inset-0`} style={{ background: "rgba(42,12,24,0.45)" }} />
      <form onSubmit={save} className={`pp-sheet ${closing ? "out" : ""} absolute left-0 right-0 bottom-0 max-w-lg mx-auto rounded-t-[2rem] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] max-h-[88vh] overflow-y-auto`} style={{ background: "#fffaf0", boxShadow: "0 -12px 40px -10px rgba(61,20,38,0.35)" }}>
        <span className="block w-10 h-1.5 rounded-full mx-auto mb-4" style={{ background: "rgba(61,20,38,0.15)" }} aria-hidden="true" />
        <div className="flex items-center justify-between mb-4">
          <h2 id="pp-sheet-title" className="font-bold text-[20px]" style={{ ...H, color: PLUM }}>{def.title}</h2>
          <button type="button" onClick={close} aria-label="Close" className="tap-scale w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.1)" }}>
            <X size={17} color={INK} />
          </button>
        </div>
        <div className="space-y-3.5">
          {def.fields.map((f, i) => {
            const id = `pp-${f.key}`;
            const common = {
              id,
              value: form[f.key] ?? "",
              ref: i === 0 ? (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) => { first.current = el; } : undefined,
            };
            return (
              <div key={f.key}>
                <label htmlFor={id} className="block text-xs font-bold mb-1.5" style={{ color: MUTED }}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea {...common} rows={3} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-4 py-3 rounded-2xl text-[15px] outline-none resize-none" style={inputStyle} />
                ) : f.type === "select" ? (
                  <select {...common} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full h-12 px-4 rounded-2xl text-[15px] outline-none" style={inputStyle}>
                    {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input {...common} type={f.type === "number" ? "text" : f.type ?? "text"} inputMode={f.inputMode} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full h-12 px-4 rounded-2xl text-[15px] outline-none" style={inputStyle} />
                )}
              </div>
            );
          })}
        </div>
        {error && <p className="enter-fade text-xs font-semibold mt-3 px-3 py-2 rounded-xl" style={{ background: "#fdf1d6", color: "#8a2a4d" }}>{error}</p>}
        <button type="submit" disabled={saving} className="tap-scale mt-5 w-full h-12 rounded-full text-[15px] font-bold inline-flex items-center justify-center gap-2" style={{ ...H, background: PLUM, color: "white", opacity: saving ? 0.8 : 1 }}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : "Save"}
        </button>
      </form>
    </div>
  );
}

/* ---------- Small parts ---------- */

function Section({ title, icon: Icon, action, children, delay = 0 }: { title: string; icon: typeof PawPrint; action?: React.ReactNode; children: React.ReactNode; delay?: number }) {
  return (
    <section className="reveal rounded-[1.75rem] p-4" style={{ ["--d" as string]: `${delay}ms`, ...CARD }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 font-bold text-[16px]" style={{ ...H, color: PLUM }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#fef3dc" }}><Icon size={15} color={PLUM} /></span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EditButton({ onClick, label, empty }: { onClick: () => void; label: string; empty?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="tap-scale inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-bold" style={{ background: "#fffaf0", color: PLUM, border: "1px solid rgba(61,20,38,0.12)" }}>
      {empty ? <><Plus size={12} /> Add</> : <><Pencil size={11} /> Edit</>}
    </button>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5" style={{ borderTop: "1px solid rgba(61,20,38,0.06)" }}>
      <dt className="text-xs shrink-0 pt-0.5" style={{ color: MUTED }}>{label}</dt>
      <dd className="text-sm text-right font-semibold min-w-0" style={{ color: INK }}>{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm" style={{ color: MUTED }}>{children}</p>;
}

/* ---------- Page ---------- */

export default function PetProfileClient({ pet: initialPet }: { pet: Pet }) {
  const router = useRouter();
  const [pet, setPet] = useState(initialPet);
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Homepage "Share" opens the share sheet straight away (?share=1).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("share") === "1") {
      setShareOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const passportNo = derivePassportNumber(pet.id);
  const age = ageLabel(pet.birthday);
  const allergyText = [...pet.allergyTags, ...(has(pet.allergies) ? [pet.allergies!.trim()] : [])].join(", ");
  const noAllergies = /^(none|no|nil|na|n\/a)\.?$/i.test(allergyText.trim());
  const hasAllergies = has(allergyText) && !noAllergies;
  const personality = [...pet.temperamentTags, ...(has(pet.temperament) ? [pet.temperament!.trim()] : [])];
  const activeMeds = pet.medications.filter((m) => m.active);
  const vaxSorted = [...pet.vaccinations].sort((a, b) => (vaxStatus(a).days ?? 1e9) - (vaxStatus(b).days ?? 1e9));
  const overdue = vaxSorted.filter((v) => vaxStatus(v).status === "OVERDUE").length;
  const dueSoon = vaxSorted.filter((v) => vaxStatus(v).status === "DUE_SOON").length;

  // Completeness: what makes the passport useful to a vet, a pro or a boarder.
  const ACTIONS: Record<PassportStepKey, () => void> = {
    photo: () => document.getElementById("pp-photo")?.click(),
    birthday: () => setSheet("basics"),
    weight: () => setSheet("basics"),
    vaccine: () => router.push("/owner/vaccines"),
    allergies: () => setSheet("health"),
    care: () => setSheet("care"),
    vet: () => setSheet("vet"),
    emergency: () => router.push(`/owner/pets/${pet.id}/step-2`),
  };
  const checklist = passportChecklist({
    ...pet,
    vaccinationCount: pet.vaccinations.length,
    emergencyContactCount: pet.emergencyContacts.length,
  }).map((c) => ({ ...c, act: ACTIONS[c.key] }));
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);
  const nextStep = checklist.find((c) => !c.done);

  // Stamps are earned from completed visits; nothing is awarded for free.
  const completed = pet.bookings.filter((b) => b.status === "COMPLETED");
  const stampCount = (type: string) => completed.filter((b) => b.type === type).length;
  const upcoming = pet.bookings
    .filter((b) => ["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(b.status) && new Date(b.startTime).getTime() > Date.now() - 3 * 3600_000)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const history = completed.slice(0, 5);

  const onSaved = (p: Partial<Pet>) => setPet((prev) => ({ ...prev, ...p }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    if (file.size > 4 * 1024 * 1024) return setPhotoError("Please choose a photo under 4 MB.");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch(`/api/pets/${pet.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoUrl: reader.result as string }) });
      if (res.ok) onSaved(await res.json());
      else setPhotoError("Couldn't upload that photo. Please try another.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removePet = async () => {
    if (!window.confirm(`Remove ${pet.name} from Barkado & Co.? This deletes the PawPassport and can't be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/pets/${pet.id}`, { method: "DELETE" });
    if (res.ok) router.push("/owner/pets");
    else setDeleting(false);
  };

  const facts = [
    { k: "Age", v: age },
    { k: "Weight", v: pet.weightKg != null ? `${pet.weightKg} kg` : null },
    { k: "Size", v: SIZE_LABEL[pet.size] ?? null },
  ];
  const subtitle = [pet.breed, pet.gender === "MALE" ? "Boy" : pet.gender === "FEMALE" ? "Girl" : null, pet.neutered ? (pet.gender === "FEMALE" ? "Spayed" : "Neutered") : null].filter(Boolean).join(" · ");

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto pb-12">
        <TaskHeader title="PawPassport" fallbackHref="/owner/pets" showCart={false} />

        <div className="px-4 pt-2 space-y-4">
          {/* ---------- Passport card ---------- */}
          <section className="enter-up relative overflow-hidden rounded-[2rem] p-5 pb-7" style={{ background: PLUM, boxShadow: "0 18px 36px -14px rgba(110,30,59,0.55)" }}>
            <span className="brand-wave" aria-hidden="true" />
            <div className="relative flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: YELLOW }}>PawPassport</p>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider" style={{ background: "rgba(249,221,138,0.14)", color: YELLOW, border: "1px solid rgba(249,221,138,0.3)" }}>{passportNo}</span>
            </div>

            <div className="relative flex items-center gap-4 mt-4">
              <label className="relative shrink-0 cursor-pointer tap-scale" aria-label={pet.photoUrl ? `Change ${pet.name}'s photo` : `Add a photo of ${pet.name}`}>
                <span className="block w-[92px] h-[92px] rounded-full p-[3px]" style={{ background: YELLOW }}>
                  {pet.photoUrl ? (
                    <img src={pet.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "#5a1830" }}>
                      <PawPrint size={30} color={YELLOW} />
                    </span>
                  )}
                </span>
                <span className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: YELLOW, boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
                  {uploading ? <Loader2 size={13} className="animate-spin" color={PLUM} /> : <Camera size={13} color={PLUM} />}
                </span>
                <input id="pp-photo" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-[26px] leading-tight truncate" style={{ ...H, color: "#fffaf0" }}>{pet.name}</h1>
                <p className="text-[13px] mt-0.5" style={{ color: BLUE }}>{subtitle || "Add breed and details"}</p>
                <p className="text-[11px] mt-1.5" style={{ color: "rgba(251,240,217,0.65)" }}>Member since {fmtDate(pet.createdAt, { month: "short", year: "numeric" })}</p>
              </div>
            </div>
            {photoError && <p className="relative text-xs mt-2" style={{ color: YELLOW }}>{photoError}</p>}

            <dl className="relative grid grid-cols-3 gap-2 mt-5">
              {facts.map((f) => (
                <div key={f.k} className="rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <dt className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(251,240,217,0.6)" }}>{f.k}</dt>
                  <dd className="text-sm font-bold mt-0.5 truncate" style={{ ...H, color: f.v ? "#fffaf0" : "rgba(251,240,217,0.45)" }}>{f.v ?? "Not set"}</dd>
                </div>
              ))}
            </dl>

            <div className="relative grid grid-cols-2 gap-2 mt-4">
              <button type="button" onClick={() => setShareOpen(true)} className="tap-scale inline-flex items-center justify-center gap-1.5 h-11 rounded-full text-sm font-bold" style={{ ...H, background: YELLOW, color: INK }}>
                <Share2 size={14} /> {pet.shareToken ? "Shared" : "Share"}
              </button>
              <button type="button" onClick={() => setSheet("basics")} className="tap-scale inline-flex items-center justify-center gap-1.5 h-11 rounded-full text-sm font-bold" style={{ ...H, background: "rgba(255,255,255,0.1)", color: "#fffaf0", border: "1px solid rgba(251,240,217,0.25)" }}>
                <Pencil size={13} /> Edit basics
              </button>
            </div>
            <p className="relative text-right mt-3 text-[15px]" style={{ color: YELLOW, fontFamily: "var(--font-script)" }}>A Hug in every Paw</p>
          </section>

          {/* ---------- Completeness ---------- */}
          {pct < 100 ? (
            <section className="enter-up rounded-[1.75rem] p-4" style={{ ["--d" as string]: "40ms", background: YELLOW }}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-[15px]" style={{ ...H, color: INK }}>{pet.name}&rsquo;s passport is {pct}% done</p>
                <span className="text-xs font-bold" style={{ color: PLUM }}>{doneCount}/{checklist.length}</span>
              </div>
              <div className="mt-2.5 h-2 rounded-full overflow-hidden" style={{ background: "rgba(61,20,38,0.12)" }} aria-hidden="true">
                <div className="h-full rounded-full origin-left bar-in" style={{ background: PLUM, transform: `scaleX(${pct / 100})` }} />
              </div>
              <p className="text-xs mt-2.5" style={{ color: INK }}>A complete passport helps your pro and your vet look after {pet.name} properly.</p>
              {nextStep && (
                <button type="button" onClick={nextStep.act} className="tap-scale mt-3 inline-flex items-center gap-1 px-4 h-10 rounded-full text-sm font-bold" style={{ ...H, background: PLUM, color: "white" }}>
                  Next: {nextStep.label.toLowerCase()} <ChevronRight size={15} />
                </button>
              )}
            </section>
          ) : (
            <section className="enter-pop rounded-[1.75rem] p-4 flex items-center gap-3" style={{ background: YELLOW }}>
              <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: PLUM }}><Sparkles size={18} color={YELLOW} /></span>
              <p className="font-bold text-sm" style={{ ...H, color: INK }}>{pet.name}&rsquo;s passport is complete. Good human!</p>
            </section>
          )}

          {/* ---------- Allergy alert ---------- */}
          {hasAllergies && (
            <section className="enter-up rounded-[1.75rem] p-4 flex items-start gap-3" style={{ ["--d" as string]: "60ms", background: "#fde7dc", border: "1.5px dashed #c2410c" }}>
              <AlertTriangle size={20} color="#c2410c" className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-sm" style={{ ...H, color: "#7c2d12" }}>Allergies</p>
                <p className="text-sm mt-0.5" style={{ color: "#7c2d12" }}>{allergyText}</p>
              </div>
            </section>
          )}

          {/* ---------- Stamps ---------- */}
          <Section title="Stamps" icon={Star} delay={80}>
            <p className="text-xs -mt-1 mb-3" style={{ color: MUTED }}>Earned with every completed visit.</p>
            <div className="grid grid-cols-3 gap-2.5">
              {(["WALKING", "GROOMING", "TRAINING"] as const).map((t, i) => {
                const n = stampCount(t);
                const meta = SERVICE[t];
                const Icon = meta.icon;
                const earned = n > 0;
                const Inner = (
                  <>
                    <span
                      className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
                      style={{
                        transform: `rotate(${[-6, 4, -3][i]}deg)`,
                        background: earned ? PLUM : "transparent",
                        border: earned ? `2px dashed ${YELLOW}` : "2px dashed rgba(61,20,38,0.2)",
                        boxShadow: earned ? "0 0 0 3px #6e1e3b" : "none",
                      }}
                    >
                      <Icon size={20} color={earned ? YELLOW : "rgba(61,20,38,0.3)"} />
                      {earned && <span className="text-[11px] font-bold mt-0.5" style={{ ...H, color: YELLOW }}>×{n}</span>}
                    </span>
                    <span className="text-xs font-bold mt-2" style={{ ...H, color: earned ? INK : MUTED }}>{meta.label}</span>
                    {!earned && <span className="text-[10px] font-bold mt-0.5 underline underline-offset-2" style={{ color: PLUM }}>Book the first</span>}
                  </>
                );
                return earned ? (
                  <div key={t} className="flex flex-col items-center py-2">{Inner}</div>
                ) : (
                  <Link key={t} href={meta.href} className="tap-scale flex flex-col items-center py-2 rounded-2xl">{Inner}</Link>
                );
              })}
            </div>
          </Section>

          {/* ---------- Vaccines ---------- */}
          <Section
            title="Vaccines"
            icon={Syringe}
            delay={100}
            action={
              <Link href="/owner/vaccines" className="tap-scale inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-bold" style={{ background: PLUM, color: "white" }}>
                <Plus size={12} /> Add
              </Link>
            }
          >
            {(overdue > 0 || dueSoon > 0) && (
              <p className="text-xs font-semibold mb-2" style={{ color: overdue ? "#9a3412" : PLUM }}>
                {overdue > 0 ? `${overdue} overdue` : ""}{overdue > 0 && dueSoon > 0 ? " · " : ""}{dueSoon > 0 ? `${dueSoon} due within 30 days` : ""}
              </p>
            )}
            {vaxSorted.length === 0 ? (
              <Empty>No vaccines added yet. Add the last ones from {pet.name}&rsquo;s vaccine card and we&rsquo;ll remind you before the next is due.</Empty>
            ) : (
              <ul className="space-y-2">
                {vaxSorted.map((v) => {
                  const { status, days } = vaxStatus(v);
                  const chip =
                    status === "OVERDUE" ? { text: "Overdue", bg: "#fde7dc", fg: "#9a3412" } :
                    status === "DUE_SOON" ? { text: days === 0 ? "Due today" : `Due in ${days} d`, bg: YELLOW, fg: INK } :
                    { text: v.nextDueDate ? "Up to date" : "Recorded", bg: "#e6edf8", fg: INK };
                  return (
                    <li key={v.id} className="flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3" style={{ background: "#fffaf0" }}>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate" style={{ ...H, color: INK }}>{v.vaccineName}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                          Given {fmtDate(v.dateGiven)}{v.nextDueDate ? ` · next ${fmtDate(v.nextDueDate)}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: chip.bg, color: chip.fg }}>{chip.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* ---------- Health ---------- */}
          <Section title="Health" icon={Stethoscope} delay={120} action={<EditButton onClick={() => setSheet("health")} label="Edit health" empty={!has(allergyText) && !has(pet.medicalHistory)} />}>
            {!has(allergyText) && !has(pet.medicalHistory) && activeMeds.length === 0 ? (
              <Empty>Note allergies and past conditions so every pro and vet knows.</Empty>
            ) : (
              <dl>
                <Row label="Allergies" value={has(allergyText) ? allergyText : <span style={{ color: MUTED, fontWeight: 400 }}>Not noted</span>} />
                {has(pet.medicalHistory) && <Row label="History" value={<span className="whitespace-pre-line">{pet.medicalHistory}</span>} />}
              </dl>
            )}
            {activeMeds.length > 0 && (
              <div className="mt-3">
                <p className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: MUTED }}><Pill size={12} /> Medicines</p>
                <ul className="space-y-1.5">
                  {activeMeds.map((m) => (
                    <li key={m.id} className="rounded-2xl px-3.5 py-2.5 text-sm" style={{ background: "#fffaf0", color: INK }}>
                      <b>{m.name}</b>
                      {[m.dosage, m.schedule].filter(Boolean).length > 0 && <span style={{ color: MUTED }}> · {[m.dosage, m.schedule].filter(Boolean).join(" · ")}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href={`/owner/pets/${pet.id}/step-2`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold" style={{ color: PLUM }}>
              {activeMeds.length ? "Manage medicines" : "Add medicines"} <ChevronRight size={12} />
            </Link>
          </Section>

          {/* ---------- Care notes ---------- */}
          <Section title="Care notes" icon={HeartHandshake} delay={140} action={<EditButton onClick={() => setSheet("care")} label="Edit care notes" empty={personality.length === 0 && !has(pet.notes) && !has(pet.favoriteTreats)} />}>
            {personality.length === 0 && !has(pet.notes) && !has(pet.favoriteTreats) ? (
              <Empty>Tell your pro what {pet.name} is like: personality, leash habits, fears, favourite treats.</Empty>
            ) : (
              <div className="space-y-3">
                {personality.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {personality.map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#e6edf8", color: INK }}>{t}</span>
                    ))}
                  </div>
                )}
                {has(pet.notes) && <p className="text-sm whitespace-pre-line" style={{ color: INK }}>{pet.notes}</p>}
                {has(pet.favoriteTreats) && <p className="text-xs" style={{ color: MUTED }}>Favourite treats: <b style={{ color: INK }}>{pet.favoriteTreats}</b></p>}
              </div>
            )}
          </Section>

          {/* ---------- Vet & emergency ---------- */}
          <Section title="Vet and emergency" icon={Phone} delay={160} action={<EditButton onClick={() => setSheet("vet")} label="Edit vet" empty={!has(pet.vetHospitalName)} />}>
            <div className="space-y-2">
              {has(pet.vetHospitalName) ? (
                <div className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: "#fffaf0" }}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate" style={{ ...H, color: INK }}>{pet.vetHospitalName}</p>
                    <p className="text-[11px] truncate" style={{ color: MUTED }}>{[pet.attendingVetName, pet.vetHospitalAddress].filter(Boolean).join(" · ") || "Your vet"}</p>
                  </div>
                  {has(pet.vetEmergencyPhone) && (
                    <a href={`tel:${pet.vetEmergencyPhone}`} aria-label={`Call ${pet.vetHospitalName}`} className="tap-scale w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: PLUM }}>
                      <Phone size={16} color="white" />
                    </a>
                  )}
                </div>
              ) : (
                <Empty>Add your vet so help is one tap away.</Empty>
              )}
              {[{ id: "owner", name: pet.owner.name, phone: pet.owner.phone, relationship: "Guardian" }, ...pet.emergencyContacts]
                .filter((c) => c.phone)
                .map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: "#fffaf0" }}>
                    <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef3dc" }}><Users size={15} color={PLUM} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate" style={{ ...H, color: INK }}>{c.name}</p>
                      <p className="text-[11px]" style={{ color: MUTED }}>{c.relationship ?? "Emergency contact"} · {c.phone}</p>
                    </div>
                    <a href={`tel:${c.phone}`} aria-label={`Call ${c.name}`} className="tap-scale w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.12)" }}>
                      <Phone size={15} color={PLUM} />
                    </a>
                  </div>
                ))}
              <Link href={`/owner/pets/${pet.id}/step-2`} className="inline-flex items-center gap-1 text-xs font-bold pt-1" style={{ color: PLUM }}>
                {pet.emergencyContacts.length ? "Manage emergency contacts" : "Add an emergency contact"} <ChevronRight size={12} />
              </Link>
            </div>
          </Section>

          {/* ---------- IDs ---------- */}
          <Section title="Microchip and insurance" icon={ShieldCheck} delay={180} action={<EditButton onClick={() => setSheet("ids")} label="Edit microchip and insurance" empty={!has(pet.microchipId) && !has(pet.insuranceProvider)} />}>
            {!has(pet.microchipId) && !has(pet.insuranceProvider) ? (
              <Empty>If {pet.name} is microchipped or insured, add the numbers here.</Empty>
            ) : (
              <dl>
                {has(pet.microchipId) && <Row label="Microchip" value={<span className="inline-flex items-center gap-1.5"><Cpu size={13} color={PLUM} /> {pet.microchipId}</span>} />}
                {has(pet.insuranceProvider) && <Row label="Insurance" value={pet.insuranceProvider} />}
                {has(pet.insurancePolicy) && <Row label="Policy" value={pet.insurancePolicy} />}
                {pet.insuranceCoveragePaise != null && <Row label="Cover" value={`₹${(pet.insuranceCoveragePaise / 100).toLocaleString("en-IN")}`} />}
                {pet.insuranceExpiryDate && (
                  <Row
                    label="Ends"
                    value={<span style={{ color: new Date(pet.insuranceExpiryDate) < new Date() ? "#9a3412" : INK }}>{fmtDate(pet.insuranceExpiryDate)}{new Date(pet.insuranceExpiryDate) < new Date() ? " (ended)" : ""}</span>}
                  />
                )}
              </dl>
            )}
          </Section>

          {/* ---------- Visits ---------- */}
          <Section title="Visits" icon={CalendarClock} delay={200}>
            {upcoming.length === 0 && history.length === 0 ? (
              <div>
                <Empty>No visits yet. Book {pet.name}&rsquo;s first walk, groom or training session to start collecting stamps.</Empty>
                <Link href="/walk-booking" className="tap-scale mt-3 inline-flex items-center gap-1 px-4 h-10 rounded-full text-sm font-bold" style={{ ...H, background: PLUM, color: "white" }}>
                  Book a walk <ChevronRight size={15} />
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {[...upcoming.map((b) => ({ b, next: true })), ...history.map((b) => ({ b, next: false }))].map(({ b, next }) => {
                  const meta = SERVICE[b.type] ?? SERVICE.WALKING;
                  const Icon = meta.icon;
                  return (
                    <li key={b.id} className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: next ? "#fef3dc" : "#fffaf0" }}>
                      <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: next ? PLUM : "#ffffff", border: next ? "none" : "1px solid rgba(61,20,38,0.1)" }}>
                        <Icon size={15} color={next ? YELLOW : PLUM} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm" style={{ ...H, color: INK }}>
                          {meta.label} <span className="font-semibold" style={{ color: MUTED }}>with {b.provider.user.name}</span>
                        </p>
                        <p className="text-[11px]" style={{ color: MUTED }}>
                          {next ? "Coming up · " : ""}
                          {fmtDate(b.startTime, { weekday: "short", day: "numeric", month: "short" })}
                          {b.report?.distanceKm ? ` · ${b.report.distanceKm} km` : ""}
                          {b.report?.photos.length ? ` · ${b.report.photos.length} photos` : ""}
                        </p>
                      </div>
                      {b.review ? (
                        <span className="text-xs font-bold inline-flex items-center gap-0.5 shrink-0" style={{ color: INK }}><Star size={12} fill={YELLOW} color={YELLOW} /> {b.review.rating}</span>
                      ) : !next ? (
                        <Link href={meta.href} className="text-xs font-bold shrink-0" style={{ color: PLUM }}>Book again</Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <p className="text-[11px] text-center pt-1" style={{ color: MUTED }}>
            <Check size={11} className="inline -mt-0.5" /> Updated {fmtDate(pet.updatedAt)}
          </p>

          <div className="text-center pt-4">
            <button type="button" onClick={removePet} disabled={deleting} className="text-xs font-bold underline underline-offset-2" style={{ color: MUTED }}>
              {deleting ? "Removing…" : `Remove ${pet.name}`}
            </button>
          </div>
        </div>
      </main>

      {sheet && <EditSheet sheet={sheet} pet={pet} onClose={() => setSheet(null)} onSaved={onSaved} />}
      {shareOpen && (
        <PassportShareSheet petId={pet.id} petName={pet.name} token={pet.shareToken} onTokenChange={(t) => setPet((p) => ({ ...p, shareToken: t }))} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
