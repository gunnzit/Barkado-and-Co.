"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, ArrowLeft, Camera } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import { useActiveBreedTheme } from "@/hooks/useActiveBreedTheme";

type Pet = {
  id: string;
  name: string;
  breed?: string;
  size: string;
  photoUrl?: string | null;
  vaccinations: { id: string; vaccineName: string; nextDueDate: string }[];
};

const EMPTY_FORM = {
  name: "",
  breed: "",
  size: "MEDIUM",
  temperament: "",
  notes: "",
  birthday: "",
  weightKg: "",
  allergies: "",
  medicalHistory: "",
  favoriteTreats: "",
  microchipId: "",
  insuranceProvider: "",
  insurancePolicy: "",
};

export default function PetsClient() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showMore, setShowMore] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadPets = async () => {
    const res = await fetch("/api/pets");
    if (res.ok) setPets(await res.json());
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const addPet = async (e: React.FormEvent) => {
    e.preventDefault();

    let photoUrl: string | undefined;

    if (photoFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", photoFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        photoUrl = data.url;
      }
      setUploading(false);
    }

    const res = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        photoUrl,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        birthday: form.birthday || undefined,
      }),
    });
    if (res.ok) {
      setForm(EMPTY_FORM);
      setShowMore(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      loadPets();
    }
  };

  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm";
  const inputStyle = { borderColor: "var(--border)" };
  const themeClass = useActiveBreedTheme();

  return (
    <main className={`max-w-2xl mx-auto px-6 py-10 pb-28 ${themeClass}`} style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="flex items-center justify-between mb-4">
        <PetSwitcher />
        <ProfileMenu />
      </div>
      <Link href="/" className="flex items-center gap-2 tap-scale mb-4" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to home</span>
      </Link>
      <h1 className="text-2xl font-bold mb-6">Your pets</h1>

      <form onSubmit={addPet} className="card mb-8 space-y-3">
        <h2 className="font-bold">Add a pet</h2>

        {/* Photo upload */}
        <div className="flex items-center gap-4">
          <label
            htmlFor="pet-photo-input"
            className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 tap-scale overflow-hidden"
            style={{ background: "var(--cream)", border: "1px dashed var(--border)", cursor: "pointer" }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera size={20} color="var(--muted)" />
            )}
          </label>
          <div>
            <label htmlFor="pet-photo-input" className="text-sm font-semibold tap-scale" style={{ color: "var(--tan-dark, var(--tan))", cursor: "pointer" }}>
              {photoPreview ? "Change photo" : "Upload your pet's photo"}
            </label>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Optional — shown across the app</p>
          </div>
          <input
            id="pet-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <input
          className={inputClass}
          style={inputStyle}
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className={inputClass}
          style={inputStyle}
          placeholder="Breed"
          value={form.breed}
          onChange={(e) => setForm({ ...form, breed: e.target.value })}
        />
        <select
          className={inputClass}
          style={inputStyle}
          value={form.size}
          onChange={(e) => setForm({ ...form, size: e.target.value })}
        >
          <option value="SMALL">Small</option>
          <option value="MEDIUM">Medium</option>
          <option value="LARGE">Large</option>
        </select>
        <textarea
          className={inputClass}
          style={inputStyle}
          placeholder="Temperament / notes (e.g. scared of loud noises)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        {/* Optional passport details — collapsed by default, not required to add a pet */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1 text-sm font-medium tap-scale"
          style={{ color: "var(--tan-dark, var(--tan))" }}
        >
          {showMore ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Add Paw Passport details (optional)
        </button>

        {showMore && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>Birthday</label>
                <input type="date" className={inputClass} style={inputStyle} value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>Weight (kg)</label>
                <input type="number" step="0.1" className={inputClass} style={inputStyle} value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
              </div>
            </div>
            <input className={inputClass} style={inputStyle} placeholder="Allergies" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
            <textarea className={inputClass} style={inputStyle} placeholder="Medical history" rows={2} value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} />
            <input className={inputClass} style={inputStyle} placeholder="Favorite treats" value={form.favoriteTreats} onChange={(e) => setForm({ ...form, favoriteTreats: e.target.value })} />
            <input className={inputClass} style={inputStyle} placeholder="Microchip ID" value={form.microchipId} onChange={(e) => setForm({ ...form, microchipId: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputClass} style={inputStyle} placeholder="Insurance provider" value={form.insuranceProvider} onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })} />
              <input className={inputClass} style={inputStyle} placeholder="Policy number" value={form.insurancePolicy} onChange={(e) => setForm({ ...form, insurancePolicy: e.target.value })} />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? "Uploading photo…" : "Add pet"}
        </button>
      </form>

      <div className="space-y-3">
        {pets.map((p) => (
          <Link href={`/owner/pets/${p.id}`} key={p.id} className="card flex items-center justify-between tap-scale">
            <div className="flex items-center gap-3">
              {p.photoUrl && (
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
                  <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="font-bold">{p.name} <span className="text-sm font-normal" style={{ color: "var(--muted)" }}>{p.breed}</span></p>
                {p.vaccinations.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    💉 {p.vaccinations.length} vaccine{p.vaccinations.length > 1 ? "s" : ""} on record
                  </p>
                )}
              </div>
            </div>
            <ChevronRight size={18} color="var(--muted)" />
          </Link>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}