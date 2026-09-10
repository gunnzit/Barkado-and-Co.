"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  HelpCircle,
  Camera,
  ShieldCheck,
  QrCode,
  Utensils,
  Brain,
  X,
  Plus,
} from "lucide-react";

const DIETARY_PRESETS = ["Poultry / Chicken Free", "Sensitive Stomach", "Grain Free", "Dairy Free"];
const TEMPERAMENT_PRESETS = ["Friendly with dogs", "Human affectionate", "High energy", "Leash reactive", "Anxious with thunder"];

const SIZE_OPTIONS: { key: "SMALL" | "MEDIUM" | "LARGE" | "GIANT"; label: string; hint: string }[] = [
  { key: "SMALL", label: "Small", hint: "< 10 kg" },
  { key: "MEDIUM", label: "Medium", hint: "10-25 kg" },
  { key: "LARGE", label: "Large", hint: "25-45 kg" },
  { key: "GIANT", label: "Giant", hint: "> 45 kg" },
];

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
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
              isActive ? "bg-[#02120a] text-white" : "bg-[#efeee3] text-[#424844]"
            }`}
          >
            {isActive && <ShieldCheck size={12} />}
            {tag}
          </button>
        );
      })}
      {addingCustom ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            className="px-2 py-1 rounded-full text-xs border w-28"
            style={{ borderColor: "var(--border)" }}
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
          <button type="button" onClick={() => setAddingCustom(false)} className="text-[#424844]">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCustom(true)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 bg-[#efeee3] text-[#424844]"
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

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
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
    if (file.size > 4 * 1024 * 1024) {
      alert("Please choose an image under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
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
        photoUrl: photoDataUrl || undefined,
        isDraft,
      }),
    });
    setSaving(null);
    if (res.ok) {
      const pet = await res.json();
      // Steps 2 and 3 of this wizard aren't built yet — landing on the
      // real Passport page for now rather than a step that doesn't exist.
      router.push(isDraft ? "/owner/pets" : `/owner/pets/${pet.id}`);
    } else {
      alert("Something went wrong saving. Please try again.");
    }
  };

  const ageLabel = ageFromDob(birthday);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-28 max-w-2xl mx-auto">
        <div className="flex items-center justify-between px-6 py-5">
          <button onClick={() => router.back()} className="tap-scale">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold">Add New Pet</h1>
          <div className="flex items-center gap-2">
            <HelpCircle size={20} color="var(--muted)" />
          </div>
        </div>

        {/* Step indicator — real: this is genuinely step 1 of a planned 3-step
            flow, though steps 2 and 3 aren't built yet. */}
        <div className="px-6 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#02120a] text-white flex items-center justify-center text-[10px] font-bold">1</span>
              <span className="font-bold tracking-wide uppercase text-[10px] text-[#424844]">Step 1 of 3: Core Identity</span>
            </div>
            <span className="text-[#904c2c] font-bold text-[10px]">33% Completed</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#efeee3] overflow-hidden">
            <div className="h-full bg-[#02120a]" style={{ width: "33%" }} />
          </div>
        </div>

        <div className="px-6 mb-4">
          <div className="rounded-xl bg-white border border-[#c2c8c2]/20 p-4 flex gap-3">
            <div className="w-9 h-9 rounded-full bg-[#d2e8d9] flex items-center justify-center shrink-0">
              <ShieldCheck size={18} color="#16281f" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#02120a]">PawPassport™ Registry</p>
              <p className="text-xs text-[#424844] mt-0.5">Create a real profile for your dog to book walks, sitting, grooming, and training.</p>
            </div>
          </div>
        </div>

        <div className="px-6 mb-2 flex flex-col items-center">
          <label className="w-24 h-24 rounded-full relative cursor-pointer">
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="Pet" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-[#efeee3] flex items-center justify-center">
                <Camera size={24} color="#737874" />
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#02120a] flex items-center justify-center border-2 border-white">
              <Camera size={13} color="white" />
            </span>
          </label>
          <p className="text-[11px] text-[#424844] mt-3 text-center max-w-[240px]">
            A clear, front-facing photo helps sitters and walkers recognize your dog instantly.
          </p>
        </div>

        <div className="px-6 mb-4">
          <div className="rounded-2xl bg-white border border-[#c2c8c2]/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[#02120a]">Essential Details</h3>
              <span className="text-[9px] font-bold uppercase text-[#904c2c]">Required</span>
            </div>

            <label className="text-xs font-semibold mb-1 block text-[#424844]">Pet Name</label>
            <input
              className="w-full text-sm border rounded-lg px-3 py-2 mb-3"
              style={{ borderColor: "var(--border)" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cooper"
            />

            <label className="text-xs font-semibold mb-1 block text-[#424844]">Species</label>
            <select
              className="w-full text-sm border rounded-lg px-3 py-2 mb-3"
              style={{ borderColor: "var(--border)" }}
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            >
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
            </select>

            <label className="text-xs font-semibold mb-1 block text-[#424844]">Breed</label>
            <input
              className="w-full text-sm border rounded-lg px-3 py-2 mb-3"
              style={{ borderColor: "var(--border)" }}
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="e.g. Golden Retriever"
            />

            <label className="text-xs font-semibold mb-1 block text-[#424844]">Sex &amp; Biological Status</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setGender("MALE")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${gender === "MALE" ? "bg-[#02120a] text-white" : "bg-[#efeee3] text-[#424844]"}`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender("FEMALE")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${gender === "FEMALE" ? "bg-[#02120a] text-white" : "bg-[#efeee3] text-[#424844]"}`}
              >
                Female
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-[#424844] mb-3">
              <input type="checkbox" checked={neutered} onChange={(e) => setNeutered(e.target.checked)} />
              Neutered / Spayed
            </label>

            <label className="text-xs font-semibold mb-1 block text-[#424844]">Date of Birth</label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="date"
                className="flex-1 text-sm border rounded-lg px-3 py-2"
                style={{ borderColor: "var(--border)" }}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              {ageLabel && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#d2e8d9] text-[#02120a] shrink-0">{ageLabel}</span>}
            </div>

            <label className="text-xs font-semibold mb-1 block text-[#424844]">Weight &amp; Size Class</label>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex rounded-lg overflow-hidden border shrink-0" style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={() => setWeightUnit("kg")} className={`px-3 py-2 text-xs font-bold ${weightUnit === "kg" ? "bg-[#02120a] text-white" : "bg-white text-[#424844]"}`}>kg</button>
                <button type="button" onClick={() => setWeightUnit("lbs")} className={`px-3 py-2 text-xs font-bold ${weightUnit === "lbs" ? "bg-[#02120a] text-white" : "bg-white text-[#424844]"}`}>lbs</button>
              </div>
              <input
                type="number"
                step="0.1"
                className="flex-1 text-sm border rounded-lg px-3 py-2"
                style={{ borderColor: "var(--border)" }}
                value={displayWeight}
                onChange={(e) => handleWeightInput(e.target.value)}
                placeholder={weightUnit}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSize(opt.key)}
                  className={`py-2 rounded-lg text-center ${size === opt.key ? "bg-[#02120a] text-white" : "bg-[#efeee3] text-[#424844]"}`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[9px] opacity-80">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 mb-4">
          <div className="rounded-2xl bg-white border border-[#c2c8c2]/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[#02120a] flex items-center gap-2">
                <QrCode size={16} color="#904c2c" /> Microchip &amp; Tag
              </h3>
              <span className="text-[9px] font-bold uppercase text-[#424844] bg-[#efeee3] px-2 py-0.5 rounded-full">Recommended</span>
            </div>
            <p className="text-[11px] text-[#424844] mb-2">ISO 11784/11785 standard 15-digit microchip code, if your pet has one on file.</p>
            <input
              className="w-full text-sm border rounded-lg px-3 py-2 mb-2 font-mono disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
              value={microchipId}
              disabled={noMicrochip}
              onChange={(e) => setMicrochipId(e.target.value)}
              placeholder="15-digit code"
            />
            <label className="flex items-center gap-2 text-xs text-[#424844]">
              <input type="checkbox" checked={noMicrochip} onChange={(e) => setNoMicrochip(e.target.checked)} />
              {name || "This pet"} does not have an active microchip yet
            </label>
          </div>
        </div>

        <div className="px-6 mb-4">
          <div className="rounded-2xl bg-white border border-[#c2c8c2]/20 p-4">
            <h3 className="font-bold text-sm text-[#02120a] flex items-center gap-2 mb-1">
              <Utensils size={16} color="#904c2c" /> Dietary Restrictions &amp; Allergens
            </h3>
            <p className="text-[11px] text-[#424844] mb-3">Shown to your pet's walker, sitter, or groomer before any booking.</p>
            <TagPicker
              presets={DIETARY_PRESETS}
              selected={allergyTags}
              onToggle={(tag) => toggleTag(allergyTags, setAllergyTags, tag)}
              onAddCustom={(tag) => setAllergyTags([...allergyTags, tag])}
            />
          </div>
        </div>

        <div className="px-6 mb-4">
          <div className="rounded-2xl bg-white border border-[#c2c8c2]/20 p-4">
            <h3 className="font-bold text-sm text-[#02120a] flex items-center gap-2 mb-1">
              <Brain size={16} color="#904c2c" /> Temperament &amp; Social Instincts
            </h3>
            <p className="text-[11px] text-[#424844] mb-3">Select tags that describe typical behavior around people and other dogs.</p>
            <TagPicker
              presets={TEMPERAMENT_PRESETS}
              selected={temperamentTags}
              onToggle={(tag) => toggleTag(temperamentTags, setTemperamentTags, tag)}
              onAddCustom={(tag) => setTemperamentTags([...temperamentTags, tag])}
            />
            <label className="text-xs font-semibold mt-3 mb-1 block text-[#424844]">Handling Notes &amp; Special Rituals</label>
            <textarea
              className="w-full text-sm border rounded-lg px-3 py-2"
              style={{ borderColor: "var(--border)" }}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. loves belly rubs before naps, nervous around skateboards"
            />
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="rounded-xl bg-[#f5f4e8] border border-[#efeee3] p-4">
            <p className="text-xs text-[#424844]">
              Completing this step creates {name || "your pet"}'s Barkado profile. You can add vaccine and insurance details anytime from the Passport page.
            </p>
          </div>
        </div>

        <div className="px-6 flex gap-3">
          <button
            onClick={() => submit(true)}
            disabled={saving !== null}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#efeee3] text-[#424844]"
          >
            {saving === "draft" ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={() => submit(false)}
            disabled={saving !== null}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#02120a] text-white"
          >
            {saving === "create" ? "Creating…" : "Create PawPassport™"}
          </button>
        </div>
      </main>
    </div>
  );
}