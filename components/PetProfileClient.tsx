"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { breedThemeClass } from "@/lib/breedTheme";

type Vaccination = { id: string; vaccineName: string; nextDueDate: string; dateGiven: string };
type Booking = { id: string; type: string; status: string; startTime: string; provider: { user: { name: string } } };

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  size: string;
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
  photoUrl: string | null;
  vaccinations: Vaccination[];
  bookings: Booking[];
};

function ageFromBirthday(birthday: string | null) {
  if (!birthday) return null;
  const years = (Date.now() - new Date(birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return years < 1 ? `${Math.round(years * 12)} mo` : `${Math.floor(years)} yr`;
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
  const [form, setForm] = useState({
    weightKg: pet.weightKg?.toString() ?? "",
    birthday: pet.birthday ? pet.birthday.slice(0, 10) : "",
    allergies: pet.allergies ?? "",
    medicalHistory: pet.medicalHistory ?? "",
    favoriteTreats: pet.favoriteTreats ?? "",
    microchipId: pet.microchipId ?? "",
    insuranceProvider: pet.insuranceProvider ?? "",
    insurancePolicy: pet.insurancePolicy ?? "",
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
        setPet((prev) => ({ ...prev, photoUrl: updated.photoUrl }));
      }
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        birthday: form.birthday || undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPet({ ...pet, ...updated });
      setEditing(false);
    }
    setSaving(false);
  };

  const age = ageFromBirthday(pet.birthday);
  const themeClass = breedThemeClass(pet.breed);

  return (
    <main className={`pb-28 max-w-2xl mx-auto ${themeClass}`} style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* ===== Header with clear back link ===== */}
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

      {/* ===== Identity ===== */}
      <div className="px-6 flex items-center gap-4 mb-6">
        <label
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 relative tap-scale overflow-hidden"
          style={{ background: "white", border: "1px solid var(--border)", cursor: "pointer" }}
        >
          {pet.photoUrl ? (
            <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <PawPrint size={26} color="var(--tan)" />
          )}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "var(--tan)" }}
          >
            <Camera size={11} color="white" />
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </label>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tan)" }}>
            Paw Passport
          </p>
          <h1 className="text-3xl font-bold">{pet.name}</h1>
          {uploadingPhoto && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Uploading photo…</p>}
        </div>
      </div>

      {/* ===== Vitals row ===== */}
      <div className="px-6 grid grid-cols-3 gap-3 mb-6">
        <div className="card flex flex-col items-center gap-1 py-4">
          <Cake size={18} color="var(--tan)" />
          {editing ? (
            <input
              type="date"
              className="text-xs text-center border rounded px-1 w-full"
              style={{ borderColor: "var(--border)" }}
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            />
          ) : (
            <p className="text-sm font-semibold">{age ?? "—"}</p>
          )}
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>Age</p>
        </div>
        <div className="card flex flex-col items-center gap-1 py-4">
          <Weight size={18} color="var(--tan)" />
          {editing ? (
            <input
              type="number"
              step="0.1"
              className="text-xs text-center border rounded px-1 w-full"
              style={{ borderColor: "var(--border)" }}
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              placeholder="kg"
            />
          ) : (
            <p className="text-sm font-semibold">{pet.weightKg ? `${pet.weightKg} kg` : "—"}</p>
          )}
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>Weight</p>
        </div>
        <div className="card flex flex-col items-center gap-1 py-4">
          <PawPrint size={18} color="var(--tan)" />
          <p className="text-sm font-semibold">{pet.breed ?? pet.size}</p>
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>Breed</p>
        </div>
      </div>

      {/* ===== Integrated passport card — one grouped list, not scattered boxes ===== */}
      <div className="px-6 mb-8">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {FIELD_META.map(({ key, label, icon: Icon, placeholder, multiline }, i) => (
            <div
              key={key}
              className="flex items-start gap-3 px-5 py-4"
              style={i !== FIELD_META.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
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
        </div>
      </div>

      {/* ===== Vaccination history ===== */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Syringe size={18} color="var(--tan)" /> Vaccinations
        </h2>
        {pet.vaccinations.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No vaccination records yet.</p>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {pet.vaccinations.map((v, i) => (
              <div
                key={v.id}
                className="flex justify-between items-center px-5 py-3.5"
                style={i !== pet.vaccinations.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
              >
                <p className="font-medium text-sm">{v.vaccineName}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Due {new Date(v.nextDueDate).toDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Care history ===== */}
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

      <BottomNav />
    </main>
  );
}