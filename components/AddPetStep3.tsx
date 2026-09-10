"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle, PawPrint, Users, Plus, X, MapPin, Check } from "lucide-react";

type Contact = { id: string; name: string; phone: string; relationship: string | null };
type Pet = {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
  owner: { name: string; phone: string | null };
  homeAccessAddress: string | null;
  homeAccessNotes: string | null;
  passportCompletedAt: string | null;
  emergencyContacts: Contact[];
};

const inputClass = "w-full border rounded-lg px-3 py-2 text-sm";
const inputStyle = { borderColor: "var(--border)" };

export default function AddPetStep3({ pet: initialPet }: { pet: Pet }) {
  const [pet, setPet] = useState(initialPet);
  const router = useRouter();
  const [addingContact, setAddingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", relationship: "" });

  const [accessForm, setAccessForm] = useState({
    homeAccessAddress: pet.homeAccessAddress ?? "",
    homeAccessNotes: pet.homeAccessNotes ?? "",
  });
  const [savingAccess, setSavingAccess] = useState(false);

  const [confirmed, setConfirmed] = useState(false);
  const [completing, setCompleting] = useState(false);

  const addContact = async () => {
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return;
    setAddingContact(true);
    const res = await fetch(`/api/pets/${pet.id}/emergency-contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: contactForm.name,
        phone: contactForm.phone,
        relationship: contactForm.relationship || undefined,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setPet((p) => ({ ...p, emergencyContacts: [...p.emergencyContacts, created] }));
      setContactForm({ name: "", phone: "", relationship: "" });
    }
    setAddingContact(false);
  };

  const removeContact = async (id: string) => {
    await fetch(`/api/pets/${pet.id}/emergency-contacts?contactId=${id}`, { method: "DELETE" });
    setPet((p) => ({ ...p, emergencyContacts: p.emergencyContacts.filter((c) => c.id !== id) }));
  };

  const saveAccess = async () => {
    setSavingAccess(true);
    const res = await fetch(`/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accessForm),
    });
    if (res.ok) setPet((p) => ({ ...p, ...accessForm }));
    setSavingAccess(false);
  };

  const complete = async () => {
    if (!confirmed) return;
    setCompleting(true);
    // Save any unsaved access-info edits as part of completing, so nothing
    // typed but not explicitly "saved" gets lost.
    await fetch(`/api/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...accessForm, passportCompletedAt: true }),
    });
    setCompleting(false);
    router.push(`/owner/pets/${pet.id}`);
  };

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto px-6 py-10 pb-28">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push(`/owner/pets/${pet.id}/step-2`)} className="tap-scale flex items-center gap-2" style={{ color: "var(--muted)" }}>
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Step 2</span>
          </button>
          <HelpCircle size={18} color="var(--muted)" />
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Guardians &amp; Access</h1>
          <span className="text-xs font-semibold" style={{ color: "var(--tan-dark, var(--tan))" }}>Step 3 of 3</span>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Who to contact, and how a walker or sitter gets in.</p>

        {/* Identity strip */}
        <div className="card flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
            {pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" /> : <PawPrint size={20} color="var(--tan)" />}
          </div>
          <div>
            <p className="font-bold">{pet.name}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{pet.breed || "—"}</p>
          </div>
        </div>

        {/* Guardian & Co-owner contacts — real, no authorization framing */}
        <div className="card mb-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Users size={16} color="var(--tan)" /> Guardian &amp; Emergency Contacts</h3>
          <p className="text-xs" style={{ color: "var(--muted)" }}>People a walker or sitter can call if they can't reach you.</p>

          <div className="p-3 rounded-lg" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold">{pet.owner.name} <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>(You — primary)</span></p>
            {pet.owner.phone && <p className="text-xs" style={{ color: "var(--muted)" }}>{pet.owner.phone}</p>}
          </div>

          {pet.emergencyContacts.map((c) => (
            <div key={c.id} className="p-3 rounded-lg flex items-center justify-between" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-sm font-semibold">{c.name} {c.relationship && <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>({c.relationship})</span>}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{c.phone}</p>
              </div>
              <button onClick={() => removeContact(c.id)} style={{ color: "var(--muted)" }}><X size={14} /></button>
            </div>
          ))}

          <div className="space-y-2 pt-1">
            <input className={inputClass} style={inputStyle} placeholder="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} style={inputStyle} placeholder="Phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
              <input className={inputClass} style={inputStyle} placeholder="Relationship (optional)" value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} />
            </div>
            <button onClick={addContact} disabled={addingContact || !contactForm.name.trim() || !contactForm.phone.trim()} className="btn-secondary text-sm w-full flex items-center justify-center gap-1.5">
              <Plus size={14} /> {addingContact ? "Adding…" : "Add contact"}
            </button>
          </div>
        </div>

        {/* Home Access & Drop-off — plain real fields */}
        <div className="card mb-6 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><MapPin size={16} color="var(--tan)" /> Home Access &amp; Drop-off</h3>
          <input className={inputClass} style={inputStyle} placeholder="Address / access gate" value={accessForm.homeAccessAddress} onChange={(e) => setAccessForm({ ...accessForm, homeAccessAddress: e.target.value })} />
          <textarea className={inputClass} style={inputStyle} rows={3} placeholder="Entry notes for walkers/sitters (e.g. gate code, where to park, pet behavior at the door)" value={accessForm.homeAccessNotes} onChange={(e) => setAccessForm({ ...accessForm, homeAccessNotes: e.target.value })} />
          <button onClick={saveAccess} disabled={savingAccess} className="btn-secondary text-sm w-full">{savingAccess ? "Saving…" : "Save access notes"}</button>
        </div>

        {/* Real completion step */}
        <div className="card mb-6 space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>I confirm the information provided for {pet.name} is accurate.</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.push(`/owner/pets/${pet.id}/step-2`)} className="btn-secondary flex-1 text-sm">← Step 2</button>
          <button onClick={complete} disabled={!confirmed || completing} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5">
            <Check size={14} /> {completing ? "Completing…" : "Complete PawPassport™"}
          </button>
        </div>
      </main>
    </div>
  );
}