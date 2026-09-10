"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, HelpCircle, PawPrint, Syringe, Plus, X, Hospital, Pill,
  ShieldAlert, ShieldCheck, AlertTriangle,
} from "lucide-react";

type Vaccination = {
  id: string;
  vaccineName: string;
  nextDueDate: string | null;
  dateGiven: string;
  lotNumber: string | null;
  administeringVet: string | null;
  clinicName: string | null;
};
type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  schedule: string | null;
  instructions: string | null;
};
type Pet = {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
  gender: "MALE" | "FEMALE" | null;
  neutered: boolean | null;
  birthday: string | null;
  microchipId: string | null;
  allergies: string | null;
  allergyTags: string[];
  insuranceProvider: string | null;
  insurancePolicy: string | null;
  insuranceCoveragePaise: number | null;
  insuranceExpiryDate: string | null;
  vetHospitalName: string | null;
  vetHospitalAddress: string | null;
  vetHospitalLicense: string | null;
  attendingVetName: string | null;
  vetEmergencyPhone: string | null;
  vaccinations: Vaccination[];
  medications: Medication[];
};

const inputClass = "w-full border rounded-lg px-3 py-2 text-sm";
const inputStyle = { borderColor: "var(--border)" };

function ageFromBirthday(birthday: string | null) {
  if (!birthday) return null;
  const years = (Date.now() - new Date(birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return years < 1 ? `${Math.round(years * 12)}mo` : `${Math.floor(years)}y ${Math.round((years % 1) * 12)}m`;
}

type VaxStatus = "VALID" | "DUE_SOON" | "OVERDUE";
function vaccinationStatus(v: Vaccination): VaxStatus {
  if (!v.nextDueDate) return "VALID";
  const days = Math.floor((new Date(v.nextDueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return "OVERDUE";
  if (days <= 60) return "DUE_SOON";
  return "VALID";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AddPetStep2({ pet: initialPet }: { pet: Pet }) {
  const [pet, setPet] = useState(initialPet);
  const router = useRouter();
  const [savingVet, setSavingVet] = useState(false);
  const [savingInsurance, setSavingInsurance] = useState(false);
  const [addingMed, setAddingMed] = useState(false);

  const [vetForm, setVetForm] = useState({
    vetHospitalName: pet.vetHospitalName ?? "",
    vetHospitalAddress: pet.vetHospitalAddress ?? "",
    vetHospitalLicense: pet.vetHospitalLicense ?? "",
    attendingVetName: pet.attendingVetName ?? "",
    vetEmergencyPhone: pet.vetEmergencyPhone ?? "",
  });

  const [insuranceForm, setInsuranceForm] = useState({
    insuranceProvider: pet.insuranceProvider ?? "",
    insurancePolicy: pet.insurancePolicy ?? "",
    insuranceCoverageRupees: pet.insuranceCoveragePaise ? (pet.insuranceCoveragePaise / 100).toString() : "",
    insuranceExpiryDate: pet.insuranceExpiryDate ? pet.insuranceExpiryDate.slice(0, 10) : "",
  });

  const [medForm, setMedForm] = useState({ name: "", dosage: "", schedule: "", instructions: "" });

  const saveVetInfo = async () => {
    setSavingVet(true);
    const res = await fetch(`/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vetForm),
    });
    if (res.ok) setPet({ ...pet, ...(await res.json()) });
    setSavingVet(false);
  };

  const saveInsurance = async () => {
    setSavingInsurance(true);
    const res = await fetch(`/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        insuranceProvider: insuranceForm.insuranceProvider || undefined,
        insurancePolicy: insuranceForm.insurancePolicy || undefined,
        insuranceCoveragePaise: insuranceForm.insuranceCoverageRupees ? Math.round(parseFloat(insuranceForm.insuranceCoverageRupees) * 100) : undefined,
        insuranceExpiryDate: insuranceForm.insuranceExpiryDate || undefined,
      }),
    });
    if (res.ok) setPet({ ...pet, ...(await res.json()) });
    setSavingInsurance(false);
  };

  const addMedication = async () => {
    if (!medForm.name.trim()) return;
    setAddingMed(true);
    const res = await fetch(`/api/pets/${pet.id}/medications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: medForm.name,
        dosage: medForm.dosage || undefined,
        schedule: medForm.schedule || undefined,
        instructions: medForm.instructions || undefined,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setPet((p) => ({ ...p, medications: [created, ...p.medications] }));
      setMedForm({ name: "", dosage: "", schedule: "", instructions: "" });
    }
    setAddingMed(false);
  };

  const removeMedication = async (id: string) => {
    await fetch(`/api/pets/${pet.id}/medications?medicationId=${id}`, { method: "DELETE" });
    setPet((p) => ({ ...p, medications: p.medications.filter((m) => m.id !== id) }));
  };

  const age = ageFromBirthday(pet.birthday);
  const genderLabel = pet.gender ? (pet.gender === "MALE" ? "Male" : "Female") : null;
  const neuteredLabel = pet.neutered === true ? "Neutered" : pet.neutered === false ? "Intact" : null;
  const subtitle = [pet.breed, age, [genderLabel, neuteredLabel].filter(Boolean).join(" ")].filter(Boolean).join(" · ");

  const vaxCounts = pet.vaccinations.reduce(
    (acc, v) => {
      acc[vaccinationStatus(v)]++;
      return acc;
    },
    { VALID: 0, DUE_SOON: 0, OVERDUE: 0 } as Record<VaxStatus, number>
  );

  const dietaryItems = [...pet.allergyTags, ...(pet.allergies ? [pet.allergies] : [])];

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto px-6 py-10 pb-28">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push("/owner/pets")} className="tap-scale flex items-center gap-2" style={{ color: "var(--muted)" }}>
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to your pets</span>
          </button>
          <HelpCircle size={18} color="var(--muted)" />
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Health &amp; Vaccines</h1>
          <span className="text-xs font-semibold" style={{ color: "var(--tan-dark, var(--tan))" }}>Step 2 of 3</span>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Vaccination records, your vet, and any medications.</p>

        {/* Identity strip */}
        <div className="card flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
            {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" /> : <PawPrint size={20} color="var(--tan)" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{pet.name}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{subtitle || "—"}</p>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
            style={pet.microchipId ? { background: "var(--cream)", border: "1px solid var(--border)", color: "var(--muted)" } : { background: "var(--cream)", border: "1px dashed var(--border)", color: "var(--muted)" }}
          >
            {pet.microchipId ? "Microchip on file" : "No microchip"}
          </span>
        </div>

        {/* Vaccination Ledger — dark card, same treatment as the Passport page */}
        <div className="rounded-2xl bg-[#02120a] text-[#fbfaee] p-4 mb-2 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Syringe size={18} color="#fcba5a" />
              <p className="font-bold text-sm">Vaccination Ledger</p>
            </div>
            <Link href="/owner/vaccines" className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#fcba5a] text-[#291800] flex items-center gap-1">
              <Plus size={12} /> Add Record
            </Link>
          </div>
          <div className="flex items-center justify-around text-center text-xs bg-[#16281f] rounded-xl p-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold">{vaxCounts.VALID} Valid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#fcba5a]"></span>
              <span className="font-bold">{vaxCounts.DUE_SOON} Booster Due</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              <span className="font-bold">{vaxCounts.OVERDUE} Overdue</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          {pet.vaccinations.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
              No vaccination records yet.{" "}
              <Link href="/owner/vaccines" className="font-semibold" style={{ color: "var(--tan-dark, var(--tan))" }}>Add one</Link>
            </p>
          ) : (
            <div className="space-y-2 mt-2">
              {pet.vaccinations.map((v) => {
                const status = vaccinationStatus(v);
                const badgeStyle =
                  status === "OVERDUE" ? { background: "#ffdad6", color: "#93000a" } :
                  status === "DUE_SOON" ? { background: "#fcba5a", color: "#291800" } :
                  { background: "#d2e8d9", color: "#02120a" };
                const badgeLabel = status === "OVERDUE" ? "Overdue" : status === "DUE_SOON" ? "Booster Due" : "Valid";
                return (
                  <div key={v.id} className="card flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold">{v.vaccineName}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Given {formatDate(v.dateGiven)}{v.nextDueDate ? ` · Due ${formatDate(v.nextDueDate)}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={badgeStyle}>{badgeLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Primary Veterinary Hospital */}
        <div className="card mb-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Hospital size={16} color="var(--tan)" /> Primary Veterinary Hospital</h3>
          <input className={inputClass} style={inputStyle} placeholder="Hospital name" value={vetForm.vetHospitalName} onChange={(e) => setVetForm({ ...vetForm, vetHospitalName: e.target.value })} />
          <input className={inputClass} style={inputStyle} placeholder="Address" value={vetForm.vetHospitalAddress} onChange={(e) => setVetForm({ ...vetForm, vetHospitalAddress: e.target.value })} />
          <input className={inputClass} style={inputStyle} placeholder="Council license # (optional)" value={vetForm.vetHospitalLicense} onChange={(e) => setVetForm({ ...vetForm, vetHospitalLicense: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} style={inputStyle} placeholder="Attending vet" value={vetForm.attendingVetName} onChange={(e) => setVetForm({ ...vetForm, attendingVetName: e.target.value })} />
            <input className={inputClass} style={inputStyle} placeholder="Emergency phone" value={vetForm.vetEmergencyPhone} onChange={(e) => setVetForm({ ...vetForm, vetEmergencyPhone: e.target.value })} />
          </div>
          <button onClick={saveVetInfo} disabled={savingVet} className="btn-secondary text-sm w-full">{savingVet ? "Saving…" : "Save vet info"}</button>
        </div>

        {/* Handling Protocols & Rx */}
        <div className="card mb-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Pill size={16} color="var(--tan)" /> Daily Prescriptions</h3>

          {dietaryItems.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "#ffdad6" }}>
              <AlertTriangle size={14} color="#93000a" className="mt-0.5 shrink-0" />
              <p className="text-xs font-semibold" style={{ color: "#93000a" }}>{dietaryItems.join(", ")} <span className="font-normal opacity-80">(from Step 1)</span></p>
            </div>
          )}

          {pet.medications.length > 0 && (
            <div className="space-y-2">
              {pet.medications.map((m) => (
                <div key={m.id} className="flex items-start justify-between p-3 rounded-lg" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-sm font-semibold">{m.name}{m.dosage ? ` · ${m.dosage}` : ""}</p>
                    {m.schedule && <p className="text-xs" style={{ color: "var(--muted)" }}>{m.schedule}</p>}
                    {m.instructions && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{m.instructions}</p>}
                  </div>
                  <button onClick={() => removeMedication(m.id)} style={{ color: "var(--muted)" }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-1" style={{ borderTop: pet.medications.length > 0 ? "1px solid var(--border)" : "none" }}>
            <input className={inputClass} style={inputStyle} placeholder="Medication name" value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} style={inputStyle} placeholder="Dosage (e.g. 16mg)" value={medForm.dosage} onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })} />
              <input className={inputClass} style={inputStyle} placeholder="Schedule (e.g. Daily 8:30am)" value={medForm.schedule} onChange={(e) => setMedForm({ ...medForm, schedule: e.target.value })} />
            </div>
            <input className={inputClass} style={inputStyle} placeholder="Instructions (optional)" value={medForm.instructions} onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })} />
            <button onClick={addMedication} disabled={addingMed || !medForm.name.trim()} className="btn-secondary text-sm w-full flex items-center justify-center gap-1.5">
              <Plus size={14} /> {addingMed ? "Adding…" : "Add medication"}
            </button>
          </div>
        </div>

        {/* Insurance */}
        <div className="card mb-6 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><ShieldCheck size={16} color="var(--tan)" /> Pet Health Insurance</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} style={inputStyle} placeholder="Provider" value={insuranceForm.insuranceProvider} onChange={(e) => setInsuranceForm({ ...insuranceForm, insuranceProvider: e.target.value })} />
            <input className={inputClass} style={inputStyle} placeholder="Policy #" value={insuranceForm.insurancePolicy} onChange={(e) => setInsuranceForm({ ...insuranceForm, insurancePolicy: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs" style={{ color: "var(--muted)" }}>Annual cap (₹)</label>
              <input type="number" className={inputClass} style={inputStyle} value={insuranceForm.insuranceCoverageRupees} onChange={(e) => setInsuranceForm({ ...insuranceForm, insuranceCoverageRupees: e.target.value })} />
            </div>
            <div>
              <label className="text-xs" style={{ color: "var(--muted)" }}>Expiry</label>
              <input type="date" className={inputClass} style={inputStyle} value={insuranceForm.insuranceExpiryDate} onChange={(e) => setInsuranceForm({ ...insuranceForm, insuranceExpiryDate: e.target.value })} />
            </div>
          </div>
          <button onClick={saveInsurance} disabled={savingInsurance} className="btn-secondary text-sm w-full">{savingInsurance ? "Saving…" : "Save insurance"}</button>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.push("/owner/pets")} className="btn-secondary flex-1 text-sm">← Back</button>
          {/* Step 3 doesn't exist yet — landing on the real Passport page,
              same fallback pattern as Step 1 used before Step 2 existed. */}
          <button onClick={() => router.push(`/owner/pets/${pet.id}`)} className="btn-primary flex-1 text-sm">Continue →</button>
        </div>
      </main>
    </div>
  );
}