"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  PawPrint,
  Weight,
  Cake,
  ShieldAlert,
  FileText,
  Cookie,
  Cpu,
  ShieldCheck,
  Syringe,
  Pencil,
  Camera,
  Check,
  Clock,
  BadgeCheck,
  QrCode,
  User as UserIcon,
  Share2,
  Download,
  ClipboardList,
  Plus,
  AlertTriangle,
  Award,
  Sparkles,
  Hand,
  HeartPulse,
  Hospital,
  Phone,
  Siren,
  PhoneCall,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { resolveThemeClass, THEME_OPTIONS } from "@/lib/breedTheme";

type Vaccination = {
  id: string;
  vaccineName: string;
  nextDueDate: string;
  dateGiven: string;
  lotNumber: string | null;
  administeringVet: string | null;
  clinicName: string | null;
};
type Booking = { id: string; type: string; status: string; startTime: string; provider: { user: { name: string } } };

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  size: string;
  gender: "MALE" | "FEMALE" | null;
  neutered: boolean | null;
  coatColor: string | null;
  temperament: string | null;
  notes: string | null;
  birthday: string | null;
  weightKg: number | null;
  allergies: string | null;
  medicalHistory: string | null;
  favoriteTreats: string | null;
  microchipId: string | null;
  insuranceProvider: string | null;
  insurancePolicy: string | null;
  insuranceCoveragePaise: number | null;
  insuranceExpiryDate: string | null;
  photoUrl: string | null;
  themeOverride: string | null;
  updatedAt: string;
  owner: { name: string; phone: string | null };
  vaccinations: Vaccination[];
  bookings: Booking[];
};

function ageFromBirthday(birthday: string | null) {
  if (!birthday) return null;
  const years = (Date.now() - new Date(birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return years < 1 ? `${Math.round(years * 12)}mo` : `${Math.floor(years)}y ${Math.round((years % 1) * 12)}m`;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function paiseToRupeeString(paise: number | null) {
  if (paise === null || paise === undefined) return "";
  return (paise / 100).toString();
}

function buildMrzLine(pet: Pet) {
  const nameCode = pet.name.toUpperCase().replace(/[^A-Z]/g, "").padEnd(14, "<").slice(0, 14);
  const idCode = pet.id.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 9).padEnd(9, "<");
  return `P<BKD${nameCode}<<${idCode}`;
}

function passportNumber(petId: string) {
  return `#BKD-${petId.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-6)}`;
}

function formatDate(dateStr: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  return new Date(dateStr).toLocaleDateString("en-GB", opts);
}

type VaxStatus = "VALID" | "DUE_SOON" | "OVERDUE";
function vaccinationStatus(v: Vaccination): VaxStatus {
  if (!v.nextDueDate) return "VALID";
  const days = Math.floor((new Date(v.nextDueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return "OVERDUE";
  if (days <= 60) return "DUE_SOON";
  return "VALID";
}

const FIELD_META: { key: keyof Pet; label: string; icon: any; placeholder: string; multiline?: boolean }[] = [
  { key: "allergies", label: "Allergies", icon: ShieldAlert, placeholder: "e.g. chicken, pollen" },
  { key: "medicalHistory", label: "Medical history", icon: FileText, placeholder: "Past conditions, surgeries, medications", multiline: true },
  { key: "favoriteTreats", label: "Favorite treats", icon: Cookie, placeholder: "e.g. peanut butter biscuits" },
  { key: "microchipId", label: "Microchip ID", icon: Cpu, placeholder: "Chip number" },
  { key: "insuranceProvider", label: "Insurance provider", icon: ShieldCheck, placeholder: "e.g. PetSecure" },
  { key: "insurancePolicy", label: "Insurance policy #", icon: ShieldCheck, placeholder: "Policy number" },
];

export default function PetProfileClient({ pet: initialPet }: { pet: Pet }) {
  const [pet, setPet] = useState(initialPet);
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: pet.name,
    breed: pet.breed ?? "",
    weightKg: pet.weightKg?.toString() ?? "",
    birthday: pet.birthday ? pet.birthday.slice(0, 10) : "",
    gender: pet.gender ?? "",
    neutered: pet.neutered === null ? "" : pet.neutered ? "true" : "false",
    coatColor: pet.coatColor ?? "",
    allergies: pet.allergies ?? "",
    medicalHistory: pet.medicalHistory ?? "",
    favoriteTreats: pet.favoriteTreats ?? "",
    microchipId: pet.microchipId ?? "",
    insuranceProvider: pet.insuranceProvider ?? "",
    insurancePolicy: pet.insurancePolicy ?? "",
    insuranceCoverageRupees: paiseToRupeeString(pet.insuranceCoveragePaise),
    insuranceExpiryDate: pet.insuranceExpiryDate ? pet.insuranceExpiryDate.slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Please choose an image under 4MB.");
      return;
    }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const res = await fetch(`/api/pets/${pet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: dataUrl }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPet((prev) => ({ ...prev, photoUrl: updated.photoUrl, updatedAt: updated.updatedAt }));
      }
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    const { insuranceCoverageRupees, insuranceExpiryDate, neutered, gender, ...restForm } = form;
    const res = await fetch(`/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...restForm,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        birthday: form.birthday || undefined,
        gender: gender || undefined,
        neutered: neutered === "" ? undefined : neutered === "true",
        insuranceCoveragePaise: insuranceCoverageRupees ? Math.round(parseFloat(insuranceCoverageRupees) * 100) : undefined,
        insuranceExpiryDate: insuranceExpiryDate || undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPet({ ...pet, ...updated });
      setEditing(false);
    }
    setSaving(false);
  };

  const setPetTheme = async (themeKey: string) => {
    const value = themeKey === "auto" ? null : themeKey;
    setPet((prev) => ({ ...prev, themeOverride: value }));
    const res = await fetch(`/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeOverride: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPet((prev) => ({ ...prev, updatedAt: updated.updatedAt }));
    } else {
      setPet((prev) => ({ ...prev, themeOverride: initialPet.themeOverride }));
    }
  };

  const removePet = async () => {
    if (!confirm(`Remove ${pet.name}? This can't be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/pets/${pet.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/owner/pets");
    } else {
      setDeleting(false);
    }
  };

  const age = ageFromBirthday(pet.birthday);
  const themeClass = resolveThemeClass(pet);

  const isVerified = Boolean(
    pet.breed &&
    pet.weightKg != null &&
    pet.birthday &&
    pet.insuranceProvider &&
    pet.insurancePolicy &&
    pet.vaccinations.length > 0
  );

  const dobFormatted = pet.birthday ? formatDate(pet.birthday) : null;
  const ageDobLine = [age, dobFormatted].filter(Boolean).join(" • ") || "—";
  const weightCoatLine = [pet.weightKg ? `${pet.weightKg} kg` : null, pet.coatColor].filter(Boolean).join(" • ") || "—";
  const genderLabel = pet.gender ? (pet.gender === "MALE" ? "Male" : "Female") : null;
  const neuteredLabel = pet.neutered === true ? "Neutered" : pet.neutered === false ? "Intact" : null;
  const genderNeuteredLabel = genderLabel && neuteredLabel ? `${genderLabel} (${neuteredLabel})` : genderLabel;
  const subtitle = [pet.breed, genderNeuteredLabel].filter(Boolean).join(" • ") || pet.size;
  const microchipDisplay = pet.microchipId ? pet.microchipId.replace(/(.{4})/g, "$1 ").trim() : "Not on file";
  const guardianDisplay = pet.owner.phone ? `${pet.owner.name} (${pet.owner.phone})` : pet.owner.name;

  const vaxCounts = pet.vaccinations.reduce(
    (acc, v) => {
      acc[vaccinationStatus(v)]++;
      return acc;
    },
    { VALID: 0, DUE_SOON: 0, OVERDUE: 0 } as Record<VaxStatus, number>
  );

  const hasAllergyAlert = Boolean(pet.allergies);
  const hasHandlingNotes = Boolean(pet.notes);
  const stampsIssued = [hasAllergyAlert, true, true, hasHandlingNotes].filter(Boolean).length;

  const hasInsurance = Boolean(pet.insuranceProvider && pet.insurancePolicy);
  const insuranceExpired = pet.insuranceExpiryDate ? new Date(pet.insuranceExpiryDate) < new Date() : false;
  const knownClinic = [...pet.vaccinations].reverse().find((v) => v.clinicName);

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
    <main className="pb-28 max-w-2xl mx-auto">
      <div className="px-6 pt-4 flex items-center justify-between">
        <PetSwitcher />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/owner/pets" className="flex items-center gap-2 tap-scale">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to pets</span>
        </Link>
        <button
          onClick={() => (editing ? save() : setEditing(true))}
          disabled={saving}
          className="btn-secondary text-sm tap-scale flex items-center gap-1.5"
        >
          {editing ? <Check size={14} /> : <Pencil size={14} />}
          {editing ? (saving ? "Saving…" : "Save") : "Edit"}
        </button>
      </div>

      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#ffdbcd] text-[#360f00] text-[11px] font-bold tracking-wider">01</span>
          <span className="font-bold text-xs tracking-wider uppercase text-[#424844]">Authenticated Canine Dossier</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e9e9dd] text-[#16281f] text-xs font-semibold shadow-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Live Sync Active</span>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="relative overflow-hidden rounded-2xl bg-[#02120a] text-[#fbfaee] shadow-2xl border border-[#16281f]">
          <div className="absolute -right-12 -top-12 w-64 h-64 opacity-5 pointer-events-none">
            <svg className="w-full h-full text-[#ffdbcd]" fill="currentColor" viewBox="0 0 200 200">
              <circle cx="100" cy="100" fill="none" r="90" stroke="currentColor" strokeWidth="6"></circle>
              <path d="M100 40 C115 40 125 55 125 70 C125 85 110 95 100 95 C90 95 75 85 75 70 C75 55 85 40 100 40 Z"></path>
              <ellipse cx="65" cy="85" rx="14" ry="22"></ellipse>
              <ellipse cx="135" cy="85" rx="14" ry="22"></ellipse>
              <ellipse cx="45" cy="125" rx="13" ry="18"></ellipse>
              <ellipse cx="155" cy="125" rx="13" ry="18"></ellipse>
              <path d="M70 145 C70 120 85 110 100 110 C115 110 130 120 130 145 C130 165 118 175 100 175 C82 175 70 165 70 145 Z"></path>
            </svg>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-2">
                <BadgeCheck size={20} color="#fcba5a" />
                <div>
                  <span className="tracking-widest text-[10px] font-bold uppercase text-[#fcba5a] block">PawPassport™ • Official Document</span>
                  <p className="text-[11px] text-[#d2e8d9] tracking-widest uppercase font-mono mt-0.5">Barkado &amp; Co. • Republic of Canines</p>
                </div>
              </div>
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#16281f] text-[#fcba5a] text-[11px] font-mono font-bold tracking-wider shadow-inner border border-[#fcba5a]/20 shrink-0">
                {passportNumber(pet.id)}
              </span>
            </div>

            <div className="w-full h-0.5 bg-gradient-to-r from-[#fcba5a]/0 via-[#fcba5a] to-[#fcba5a]/0 my-3.5 opacity-70"></div>

            <div className="flex gap-4 items-center relative z-10">
              <div className="relative shrink-0">
                <label
                  className="w-24 h-24 rounded-full p-1 block relative cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #fcba5a, #fea67f, #904c2c)" }}
                >
                  {pet.photoUrl ? (
                    <img className="w-full h-full object-cover rounded-full" src={pet.photoUrl} alt={pet.name} />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#16281f] flex items-center justify-center">
                      <PawPrint size={30} color="#fcba5a" />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#16281f] flex items-center justify-center shadow-md border border-[#fcba5a]/30">
                    <Camera size={12} color="#fcba5a" />
                  </span>
                </label>
                {uploadingPhoto && <p className="text-[9px] mt-1 text-center text-[#d2e8d9]">Uploading…</p>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  {editing ? (
                    <input
                      className="text-lg font-bold rounded-lg px-2 py-1 text-[#02120a]"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  ) : (
                    <h2 className="font-bold text-xl text-[#fbfaee] tracking-tight truncate">{pet.name}</h2>
                  )}
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffffff] text-[#02120a] text-[10px] font-bold tracking-tight shadow-sm shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      VERIFIED
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#d2e8d9] font-medium mt-0.5">{subtitle}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  <div>
                    <span className="text-[#7c9084] block text-[9px] uppercase tracking-wider font-semibold">Age / DOB</span>
                    <span className="font-semibold text-[#ffffff]">{ageDobLine}</span>
                  </div>
                  <div>
                    <span className="text-[#7c9084] block text-[9px] uppercase tracking-wider font-semibold">Weight &amp; Coat</span>
                    <span className="font-semibold text-[#ffffff]">{weightCoatLine}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 rounded-lg bg-[#16281f]/80 p-3 relative z-10 flex flex-col gap-2 shadow-inner border border-[#c2c8c2]/10">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <QrCode size={16} color="#fcba5a" />
                  <span className="text-[10px] uppercase font-bold text-[#7c9084] tracking-wider">ISO Microchip</span>
                </div>
                <span className="font-mono text-xs font-semibold tracking-wider text-[#ffffff]">{microchipDisplay}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#e9e9dd]/10">
                <div className="flex items-center gap-1.5">
                  <UserIcon size={16} color="#fcba5a" />
                  <span className="text-[10px] uppercase font-bold text-[#7c9084] tracking-wider">Guardian</span>
                </div>
                <span className="text-xs font-medium text-[#f5f4e8] truncate">{guardianDisplay}</span>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 pb-1 px-3 rounded bg-black/40 border border-[#fcba5a]/20 font-mono text-[9px] tracking-widest text-[#fcba5a]/90 uppercase overflow-hidden leading-relaxed">
              <div className="truncate">{buildMrzLine(pet)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => alert("Share Pass is coming soon.")}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all text-center border border-[#c2c8c2]/30 active:scale-95"
          >
            <Share2 size={22} color="#904c2c" className="mb-1" />
            <span className="text-[11px] font-bold text-[#02120a] leading-tight">Share Pass</span>
            <span className="text-[9px] text-[#424844] font-medium">Public link</span>
          </button>
          <button
            onClick={() => alert("Travel Dossier PDF is coming soon.")}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white shadow-sm hover:shadow-md transition-all text-center border border-[#c2c8c2]/30 active:scale-95"
          >
            <Download size={22} color="#02120a" className="mb-1" />
            <span className="text-[11px] font-bold text-[#02120a] leading-tight">Travel Dossier</span>
            <span className="text-[9px] text-[#424844] font-medium">Official PDF</span>
          </button>
          <button
            disabled
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f4e8] shadow-sm text-center border border-dashed border-[#737874]/30 relative"
          >
            <ClipboardList size={22} color="#424844" className="mb-1" />
            <span className="text-[11px] font-bold text-[#424844] leading-tight">Vet Summary</span>
            <span className="text-[9px] font-bold text-[#904c2c] bg-[#ffdbcd] px-1.5 py-0.5 rounded-full mt-0.5">Coming Soon</span>
          </button>
        </div>
      </div>

      <div className="px-6 mb-2 flex items-center gap-1.5">
        <Clock size={12} color="var(--muted)" />
        <p className="text-[11px]" style={{ color: "var(--muted)" }}>
          Updated {timeAgo(pet.updatedAt)}
        </p>
      </div>

      {editing && (
        <div className="px-6 mb-6">
          <div className="card p-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted)" }}>Breed</label>
              <input className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: "var(--border)" }} value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="Breed" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted)" }}>Coat color</label>
              <input className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: "var(--border)" }} value={form.coatColor} onChange={(e) => setForm({ ...form, coatColor: e.target.value })} placeholder="e.g. Honey" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted)" }}>Weight (kg)</label>
              <input type="number" step="0.1" className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: "var(--border)" }} value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="kg" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted)" }}>Birthday</label>
              <input type="date" className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: "var(--border)" }} value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted)" }}>Gender</label>
              <select className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: "var(--border)" }} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted)" }}>Neutered / Spayed</label>
              <select className="w-full text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: "var(--border)" }} value={form.neutered} onChange={(e) => setForm({ ...form, neutered: e.target.value })}>
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 mb-8">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>App theme for {pet.name}</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {THEME_OPTIONS.map((opt) => {
            const isActive = (pet.themeOverride ?? "auto") === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setPetTheme(opt.key)}
                className="tap-scale flex flex-col items-center gap-1.5 shrink-0"
                style={{ width: 64 }}
              >
                <span
                  className="w-10 h-10 rounded-full block"
                  style={{
                    background: opt.swatch,
                    boxShadow: isActive ? "0 0 0 2.5px var(--card), 0 0 0 4.5px var(--terracotta)" : "none",
                  }}
                />
                <span className="text-[10px] text-center leading-tight" style={{ color: isActive ? "var(--terracotta)" : "var(--muted)", fontWeight: isActive ? 700 : 500 }}>
                  {opt.label === "Auto (match breed)" ? "Auto" : opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-3 pb-2 mb-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#c2c8c2]/20">
          <div className="flex items-center justify-between pb-3 border-b border-[#efeee3]">
            <div className="flex items-center gap-2">
              <Syringe size={22} color="#02120a" />
              <div>
                <h3 className="font-bold text-sm text-[#02120a]">Vaccination &amp; Health Records</h3>
                <p className="text-[10px] text-[#424844]">Certified Medical Ledger</p>
              </div>
            </div>
            <Link
              href="/owner/vaccines"
              className="px-2.5 py-1 rounded-lg bg-[#d2e8d9] text-[#02120a] text-xs font-bold flex items-center gap-1 hover:bg-[#16281f] hover:text-white transition-colors"
            >
              <Plus size={14} />
              <span>Add Record</span>
            </Link>
          </div>

          <div className="my-3 p-2.5 rounded-xl bg-[#efeee3] flex items-center justify-around text-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="font-bold text-[#02120a]">{vaxCounts.VALID} Valid</span>
            </div>
            <div className="h-3 w-px bg-[#c2c8c2]"></div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#fcba5a]"></span>
              <span className="font-bold text-[#352000]">{vaxCounts.DUE_SOON} Booster Due</span>
            </div>
            <div className="h-3 w-px bg-[#c2c8c2]"></div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              <span className="font-medium text-[#424844]">{vaxCounts.OVERDUE} Overdue</span>
            </div>
          </div>

          {pet.vaccinations.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>No vaccination records yet.</p>
          ) : (
            <div className="space-y-3">
              {pet.vaccinations.map((v) => {
                const status = vaccinationStatus(v);
                const detailLine = [
                  v.lotNumber ? `Lot #${v.lotNumber}` : null,
                  v.administeringVet ? `Dr. ${v.administeringVet}` : null,
                ].filter(Boolean).join(" • ");

                if (status === "OVERDUE") {
                  return (
                    <div key={v.id} className="p-3.5 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/40 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-[#93000a]">{v.vaccineName}</h4>
                            <span className="px-2 py-0.5 rounded bg-[#ba1a1a] text-white text-[10px] font-bold">Overdue</span>
                          </div>
                          {detailLine && <p className="text-[10px] text-[#93000a]/80 font-mono mt-0.5">{detailLine}</p>}
                        </div>
                        <Link href="/owner/vaccines" className="px-2 py-1 rounded bg-[#ba1a1a] text-white text-[10px] font-bold shadow-sm hover:opacity-90 shrink-0">
                          Book Now
                        </Link>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#ba1a1a]/20">
                        <span className="text-[#93000a]/80">Was due:</span>
                        <span className="font-bold text-[#93000a]">{formatDate(v.nextDueDate)}</span>
                      </div>
                    </div>
                  );
                }

                if (status === "DUE_SOON") {
                  const daysUntil = Math.floor((new Date(v.nextDueDate).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={v.id} className="p-3.5 rounded-xl bg-[#f5f4e8] border border-[#fcba5a]/40 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-[#02120a]">{v.vaccineName}</h4>
                            <span className="px-2 py-0.5 rounded bg-[#fcba5a] text-[#291800] text-[10px] font-bold">Due in {daysUntil}d</span>
                          </div>
                          {detailLine && <p className="text-[10px] text-[#424844] font-mono mt-0.5">{detailLine}</p>}
                        </div>
                        <Link href="/owner/vaccines" className="px-2 py-1 rounded bg-[#904c2c] text-white text-[10px] font-bold shadow-sm hover:opacity-90 shrink-0">
                          Book Booster
                        </Link>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#efeee3]">
                        <span className="text-[#424844]">Scheduled window:</span>
                        <span className="font-bold text-[#352000]">{formatDate(v.nextDueDate, { month: "long", year: "numeric" })}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={v.id} className="p-3.5 rounded-xl bg-[#f5f4e8] border border-[#efeee3] flex flex-col gap-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-[#02120a]">{v.vaccineName}</h4>
                          <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-800 text-[10px] font-bold border border-emerald-600/20">Valid</span>
                        </div>
                        {detailLine && <p className="text-[10px] text-[#424844] font-mono mt-0.5">{detailLine}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#efeee3]">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-[#424844] block">Administered</span>
                        <span className="font-bold text-[#02120a]">{formatDate(v.dateGiven)}</span>
                      </div>
                      {v.nextDueDate && (
                        <div>
                          <span className="text-[9px] uppercase font-semibold text-[#424844] block">Expires</span>
                          <span className="font-bold text-emerald-700">{formatDate(v.nextDueDate)}</span>
                        </div>
                      )}
                    </div>
                    {v.clinicName && <p className="text-[10px] text-[#424844] italic">{v.clinicName}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-3 pb-2 mb-2">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Award size={20} color="#904c2c" />
            <h3 className="font-bold text-sm text-[#02120a]">Care Profile &amp; Passport Endorsements</h3>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#424844]">{stampsIssued} Stamps Issued</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {hasAllergyAlert && (
            <div className="col-span-2 p-4 rounded-xl bg-[#ffdad6] text-[#93000a] border-2 border-dashed border-[#ba1a1a] relative overflow-hidden shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={24} color="#ba1a1a" />
                  <span className="font-bold text-xs tracking-wider uppercase text-[#93000a]">Critical Allergy Alert Stamp</span>
                </div>
                <span className="text-[9px] font-bold uppercase bg-[#ba1a1a] text-white px-2 py-0.5 rounded">Strict Compliance</span>
              </div>
              <p className="text-[11px] leading-snug mt-2 opacity-90">{pet.allergies}</p>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-white border border-[#c2c8c2]/30 shadow-sm flex flex-col justify-between -rotate-1">
            <div>
              <div className="w-9 h-9 rounded-full bg-emerald-600/10 text-emerald-700 flex items-center justify-center mb-2">
                <ShieldCheck size={18} />
              </div>
              <h4 className="font-bold text-xs text-[#02120a]">Pack Social Certified</h4>
              <p className="text-[10px] text-[#424844] mt-1 leading-snug">Temperament evaluation not yet available — coming soon.</p>
            </div>
            <span className="text-[9px] font-mono text-[#904c2c] font-bold mt-2 uppercase tracking-wider">Not yet issued</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#c2c8c2]/30 shadow-sm flex flex-col justify-between rotate-1">
            <div>
              <div className="w-9 h-9 rounded-full bg-[#ffddb3] text-[#624000] flex items-center justify-center mb-2">
                <Sparkles size={18} />
              </div>
              <h4 className="font-bold text-xs text-[#02120a]">Approved Rewards</h4>
              <p className="text-[10px] text-[#424844] mt-1 leading-snug">Reward tracking not yet available — coming soon.</p>
            </div>
            <span className="text-[9px] font-mono text-[#904c2c] font-bold mt-2 uppercase tracking-wider">Not yet issued</span>
          </div>

          {hasHandlingNotes && (
            <div className="col-span-2 p-3.5 rounded-xl bg-white border border-[#c2c8c2]/30 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#16281f] text-[#d2e8d9] flex items-center justify-center shrink-0 mt-0.5">
                <Hand size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#02120a]">Handling &amp; Leash Protocols</h4>
                <p className="text-[11px] text-[#424844] mt-0.5 leading-snug">{pet.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-3 pb-2 mb-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#c2c8c2]/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse size={22} color="#02120a" />
              <h3 className="font-bold text-sm text-[#02120a]">Insurance &amp; Medical Coverage</h3>
            </div>
            {hasInsurance ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${insuranceExpired ? "bg-[#ffdad6] text-[#93000a]" : "bg-[#d2e8d9] text-[#02120a]"}`}>
                {insuranceExpired ? "Policy Expired" : "Active Policy"}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e9e9dd] text-[#424844]">No Policy on File</span>
            )}
          </div>

          {hasInsurance ? (
            <div className="p-3.5 rounded-xl bg-[#f5f4e8] border border-[#efeee3]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#02120a]">{pet.insuranceProvider}</p>
                  <p className="text-[10px] font-mono text-[#424844] mt-0.5">
                    Policy #{pet.insurancePolicy}
                    {pet.insuranceExpiryDate ? ` • Valid thru ${formatDate(pet.insuranceExpiryDate, { month: "short", year: "numeric" })}` : ""}
                  </p>
                </div>
                {pet.insuranceCoveragePaise != null && (
                  <span className="text-xs font-bold text-[#02120a] shrink-0">₹{(pet.insuranceCoveragePaise / 100).toLocaleString("en-IN")}</span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-[#efeee3] flex items-center justify-end text-[11px]">
                <button onClick={() => setEditing(true)} className="font-bold text-[#904c2c] hover:underline text-xs">
                  Edit Insurance Details
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="w-full p-3.5 rounded-xl bg-[#f5f4e8] border border-dashed border-[#737874]/30 text-xs font-semibold text-[#424844] hover:text-[#02120a]">
              No insurance on file — tap to add policy details
            </button>
          )}

          <div className="space-y-2 pt-1">
            <span className="text-[10px] uppercase font-bold text-[#424844] tracking-wider block">Emergency Dispatch Hotlines</span>

            {knownClinic ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#efeee3]">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0">
                    <Hospital size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#02120a]">{knownClinic.clinicName}</p>
                    <p className="text-[10px] text-[#424844]">From latest vaccination record • no phone on file</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] px-1" style={{ color: "var(--muted)" }}>No clinic on file yet — logged when a vaccination record includes a clinic name.</p>
            )}

            {pet.owner.phone ? (
              <a href={`tel:${pet.owner.phone}`} className="flex items-center justify-between p-3 rounded-lg bg-[#efeee3] hover:bg-[#e9e9dd] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#ffdbcd] text-[#360f00] flex items-center justify-center shrink-0">
                    <Phone size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#02120a]">{pet.owner.name} (Guardian)</p>
                    <p className="text-[10px] text-[#424844]">{pet.owner.phone}</p>
                  </div>
                </div>
                <PhoneCall size={18} color="#02120a" />
              </a>
            ) : (
              <p className="text-[11px] px-1" style={{ color: "var(--muted)" }}>No guardian phone on file yet.</p>
            )}

            <div className="p-3 rounded-lg bg-[#16281f] text-[#fbfaee] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#fea67f] text-[#78391b] flex items-center justify-center shrink-0">
                  <Siren size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#fbfaee]">Barkado Concierge Pet Ambulance</p>
                  <p className="text-[10px] text-[#d2e8d9]">Not yet available</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#904c2c] text-white text-[10px] font-bold">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {FIELD_META.map(({ key, label, icon: Icon, placeholder, multiline }) => (
            <div
              key={key}
              className="flex items-start gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <Icon size={16} color="var(--tan)" className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>{label}</p>
                {editing ? (
                  multiline ? (
                    <textarea
                      className="w-full text-sm border rounded-lg px-2 py-1.5"
                      style={{ borderColor: "var(--border)" }}
                      rows={3}
                      placeholder={placeholder}
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  ) : (
                    <input
                      className="w-full text-sm border rounded-lg px-2 py-1.5"
                      style={{ borderColor: "var(--border)" }}
                      placeholder={placeholder}
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  )
                ) : (
                  <p className="text-sm">{(pet[key] as string) || "—"}</p>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <ShieldCheck size={16} color="var(--tan)" className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Coverage amount</p>
              {editing ? (
                <input
                  type="number"
                  className="w-full text-sm border rounded-lg px-2 py-1.5"
                  style={{ borderColor: "var(--border)" }}
                  placeholder="Coverage in ₹"
                  value={form.insuranceCoverageRupees}
                  onChange={(e) => setForm({ ...form, insuranceCoverageRupees: e.target.value })}
                />
              ) : (
                <p className="text-sm">
                  {pet.insuranceCoveragePaise ? `₹${(pet.insuranceCoveragePaise / 100).toLocaleString("en-IN")}` : "—"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3 px-5 py-4">
            <ShieldCheck size={16} color="var(--tan)" className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Policy expiry</p>
              {editing ? (
                <input
                  type="date"
                  className="w-full text-sm border rounded-lg px-2 py-1.5"
                  style={{ borderColor: "var(--border)" }}
                  value={form.insuranceExpiryDate}
                  onChange={(e) => setForm({ ...form, insuranceExpiryDate: e.target.value })}
                />
              ) : (
                <p className="text-sm">
                  {pet.insuranceExpiryDate ? new Date(pet.insuranceExpiryDate).toDateString() : "—"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6">
        <h2 className="text-lg font-bold mb-4">Care history</h2>
        {pet.bookings.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No bookings yet.</p>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {pet.bookings.map((b, i) => (
              <div
                key={b.id}
                className="flex justify-between items-center px-5 py-3.5"
                style={i !== pet.bookings.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
              >
                <div>
                  <p className="text-sm font-medium">{b.type === "WALKING" ? "Adventure Walk" : "Home Staycation"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    with {b.provider.user.name} · {new Date(b.startTime).toDateString()}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--cream)", color: "var(--chestnut)" }}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 mt-10 mb-4">
        <button
          onClick={removePet}
          disabled={deleting}
          className="text-sm font-medium tap-scale"
          style={{ color: "var(--terracotta)" }}
        >
          {deleting ? "Removing…" : `Remove ${pet.name} from Barkado & Co.`}
        </button>
      </div>

      <BottomNav />
    </main>
    </div>
  );
}