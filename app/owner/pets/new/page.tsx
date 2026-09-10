"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, ChevronRight, ChevronDown, X, Plus } from "lucide-react";

const DIETARY_PRESETS = ["Poultry / Chicken Free", "Sensitive Stomach", "Grain Free", "Dairy Free"];
const TEMPERAMENT_PRESETS = ["Friendly with dogs", "Human affectionate", "High energy", "Leash reactive", "Anxious with thunder"];

const SIZE_OPTIONS: { key: "SMALL" | "MEDIUM" | "LARGE" | "GIANT"; label: string; hint: string }[] = [
  { key: "SMALL", label: "Small", hint: "< 10 kg" },
  { key: "MEDIUM", label: "Medium", hint: "10-25 kg" },
  { key: "LARGE", label: "Large", hint: "25-45 kg" },
  { key: "GIANT", label: "Giant", hint: "> 45 kg" },
];

const inputClass = "w-full border rounded-lg px-3 py-2 text-sm";
const inputStyle = { borderColor: "var(--border)" };

function ageFromDob(dob: string) {
  if (!dob) return null;
  const years = (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 0) return null;
  const y = Math.floor(years);
  const m = Math.round((years % 1) * 12);
  return y > 0 ? `~${y} yrs ${m} mos old` : `~${m} mos old`;
}

function TagPicker({
  presets,
  selected,
  onToggle,
  onAddCustom,
}: {
  presets: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  onAddCustom: (tag: string) => void;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const customTags = selected.filter((t) => !presets.includes(t));

  return (
    <div className="flex flex-wrap gap-2">
      {[...presets, ...customTags].map((tag) => {
        const isActive = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold tap-scale"
            style={
              isActive
                ? { background: "var(--terracotta)", color: "white" }
                : { background: "var(--cream)", border: "1px solid var(--border)", color: "var(--muted)" }
            }
          >
            {tag}
          </button>
        );
      })}
      {addingCustom ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            className="px-2 py-1 rounded-full text-xs border w-28"
            style={inputStyle}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customValue.trim()) {
                onAddCustom(customValue.trim());
                setCustomValue("");
                setAddingCustom(false);
              }
            }}
            placeholder="Custom tag"
          />
          <button type="button" onClick={() => setAddingCustom(false)} style={{ color: "var(--muted)" }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCustom(true)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 tap-scale"
          style={{ background: "var(--cream)", border: "1px dashed var(--border)", color: "var(--tan-dark, var(--tan))" }}
        >
          <Plus size={12} /> Add Custom
        </button>
      )}
    </div>
  );
}

export default function AddPetStep1() {
  const router = useRouter();
  const [saving, setSaving] = useState<"draft" | "create" | null>(null);
  const [showMore, setShowMore] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Dog");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [neutered, setNeutered] = useState(false);
  const [birthday, setBirthday] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [weightKg, setWeightKg] = useState("");
  const [size, setSize] = useState<"SMALL" | "MEDIUM" | "LARGE" | "GIANT">("MEDIUM");
  const [microchipId, setMicrochipId] = useState("");
  const [noMicrochip, setNoMicrochip] = useState(false);
  const [allergyTags, setAllergyTags] = useState<string[]>([]);
  const [temperamentTags, setTemperamentTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const toggleTag = (list: string[], setList: (v: string[]) => void, tag: string) => {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const displayWeight = weightUnit === "kg" ? weightKg : weightKg ? (parseFloat(weightKg) * 2.20462).toFixed(1) : "";
  const handleWeightInput = (val: string) => {
    if (!val) {
      setWeightKg("");
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setWeightKg(weightUnit === "kg" ? val : (num / 2.20462).toFixed(1));
  };

  const submit = async (isDraft: boolean) => {
    if (!name.trim()) {
      alert("Pet name is required.");
      return;
    }
    setSaving(isDraft ? "draft" : "create");

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
        name,
        species,
        breed: breed || undefined,
        size,
        gender: gender || undefined,
        neutered,
        birthday: birthday || undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        microchipId: noMicrochip ? undefined : microchipId || undefined,
        allergyTags,
        temperamentTags,
        notes: notes || undefined,
        photoUrl,
        isDraft,
      }),
    });
    setSaving(null);
    if (res.ok) {
      const pet = await res.json();
      router.push(isDraft ? "/owner/pets" : `/owner/pets/${pet.id}/step-2`);
    } else {
      alert("Something went wrong saving. Please try again.");
    }
  };

  const ageLabel = ageFromDob(birthday);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto px-6 py-10 pb-28">
        <Link href="/owner/pets" className="flex items-center gap-2 tap-scale mb-4" style={{ color: "var(--muted)" }}>
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to your pets</span>
        </Link>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Add a pet</h1>
          <span className="text-xs font-semibold" style={{ color: "var(--tan-dark, var(--tan))" }}>Step 1 of 3</span>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Core identity — the essentials to create {name || "your pet"}'s profile.</p>

        <div className="card space-y-3">
          {/* Photo upload — same pattern as the existing Add a pet form */}
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
            <input id="pet-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <input className={inputClass} style={inputStyle} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="grid grid-cols-2 gap-3">
            <select className={inputClass} style={inputStyle} value={species} onChange={(e) => setSpecies(e.target.value)}>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
            </select>
            <input className={inputClass} style={inputStyle} placeholder="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Sex &amp; status</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setGender("MALE")} className={inputClass} style={gender === "MALE" ? { background: "var(--terracotta)", color: "white", borderColor: "var(--terracotta)" } : inputStyle}>Male</button>
              <button type="button" onClick={() => setGender("FEMALE")} className={inputClass} style={gender === "FEMALE" ? { background: "var(--terracotta)", color: "white", borderColor: "var(--terracotta)" } : inputStyle}>Female</button>
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
              <input type="checkbox" checked={neutered} onChange={(e) => setNeutered(e.target.checked)} />
              Neutered / Spayed
            </label>
          </div>

           <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className="text-xs" style={{ color: "var(--muted)" }}>Birthday</label>
              <input type="date" className={inputClass} style={inputStyle} value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              {ageLabel && <p className="text-xs mt-1" style={{ color: "var(--terracotta)" }}>{ageLabel}</p>}
            </div>
           <div>
              <label className="text-xs" style={{ color: "var(--muted)" }}>Weight</label>
              <div className="flex gap-1.5 items-center">
                <input type="number" step="0.1" className={inputClass} style={inputStyle} value={displayWeight} onChange={(e) => handleWeightInput(e.target.value)} placeholder={weightUnit} />
                <button type="button" onClick={() => setWeightUnit(weightUnit === "kg" ? "lbs" : "kg")} className="px-2.5 py-2 rounded-lg text-xs font-semibold shrink-0" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                  {weightUnit}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Size class</label>
            <div className="grid grid-cols-4 gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSize(opt.key)}
                  className="py-2 rounded-lg text-center"
                  style={size === opt.key ? { background: "var(--terracotta)", color: "white" } : { background: "var(--cream)", border: "1px solid var(--border)", color: "var(--muted)" }}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[9px] opacity-80">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <textarea className={inputClass} style={inputStyle} placeholder="Temperament / notes (e.g. scared of loud noises)" value={notes} onChange={(e) => setNotes(e.target.value)} />

          {/* Optional details — collapsed by default, same pattern as the existing form */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1 text-sm font-medium tap-scale"
            style={{ color: "var(--tan-dark, var(--tan))" }}
          >
            {showMore ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            More details (optional)
          </button>

          {showMore && (
            <div className="space-y-3 pt-1">
              <input className={inputClass} style={inputStyle} placeholder="Microchip ID" value={microchipId} disabled={noMicrochip} onChange={(e) => setMicrochipId(e.target.value)} />
              <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                <input type="checkbox" checked={noMicrochip} onChange={(e) => setNoMicrochip(e.target.checked)} />
                {name || "This pet"} does not have an active microchip yet
              </label>

              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Dietary restrictions</label>
                <TagPicker presets={DIETARY_PRESETS} selected={allergyTags} onToggle={(tag) => toggleTag(allergyTags, setAllergyTags, tag)} onAddCustom={(tag) => setAllergyTags([...allergyTags, tag])} />
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>Temperament tags</label>
                <TagPicker presets={TEMPERAMENT_PRESETS} selected={temperamentTags} onToggle={(tag) => toggleTag(temperamentTags, setTemperamentTags, tag)} onAddCustom={(tag) => setTemperamentTags([...temperamentTags, tag])} />
              </div>
            </div>
          )}

          <p className="text-xs pt-1" style={{ color: "var(--muted)" }}>
            You can add vaccine and insurance details anytime from {name || "your pet"}'s Passport page after this step.
          </p>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => submit(true)} disabled={saving !== null} className="btn-secondary flex-1 text-sm">
              {saving === "draft" ? "Saving…" : "Save Draft"}
            </button>
             <button type="button" onClick={() => submit(false)} disabled={saving !== null} className="btn-primary flex-1 text-sm">
              {uploading ? "Uploading photo…" : saving === "create" ? "Continuing…" : "Continue to Step 2 →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}