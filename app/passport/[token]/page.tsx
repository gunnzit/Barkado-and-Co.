import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, PawPrint, Phone, Pill, Stethoscope, Syringe, HeartHandshake, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { derivePassportNumber } from "@/lib/passportId";
import BrandLogo from "@/components/BrandLogo";

/*
 * Public, read-only PawPassport, opened from a link or QR code the owner
 * shared (vet, boarder, a stranger who found the dog). Only what helps
 * someone care for the dog is shown. Never shown: the owner's address, home
 * access notes, insurance numbers, bookings.
 */

export const metadata: Metadata = {
  title: "PawPassport · Barkado & Co.",
  robots: { index: false, follow: false },
};

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const MUTED = "#5e4752";
const YELLOW = "#f9dd8a";
const H = { fontFamily: "var(--font-heading)" } as const;
const CARD = { background: "#ffffff", border: "1px solid rgba(61,20,38,0.08)", boxShadow: "0 8px 24px -6px rgba(61,20,38,0.07)" } as const;

const has = (v: string | null | undefined) => Boolean(v && v.trim());
const fmt = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

function ageLabel(birthday: Date | null) {
  if (!birthday) return null;
  const months = Math.floor((Date.now() - birthday.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return `${Math.max(months, 0)} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} yr ${m} mo` : `${y} yr`;
}

function Block({ title, icon: Icon, children }: { title: string; icon: typeof PawPrint; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] p-4" style={CARD}>
      <h2 className="flex items-center gap-2 font-bold text-[16px] mb-3" style={{ ...H, color: PLUM }}>
        <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#fef3dc" }}><Icon size={15} color={PLUM} /></span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function SharedPassportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const pet = await prisma.pet.findUnique({
    where: { shareToken: token },
    select: {
      id: true, name: true, breed: true, size: true, gender: true, neutered: true, birthday: true, weightKg: true, coatColor: true,
      photoUrl: true, allergies: true, allergyTags: true, medicalHistory: true, temperament: true, temperamentTags: true,
      notes: true, favoriteTreats: true, microchipId: true, vetHospitalName: true, attendingVetName: true, vetEmergencyPhone: true,
      updatedAt: true,
      owner: { select: { name: true, phone: true } },
      vaccinations: { select: { id: true, vaccineName: true, dateGiven: true, nextDueDate: true }, orderBy: { dateGiven: "desc" } },
      medications: { where: { active: true }, select: { id: true, name: true, dosage: true, schedule: true } },
      emergencyContacts: { select: { id: true, name: true, phone: true, relationship: true } },
    },
  });
  if (!pet) notFound();

  const firstName = pet.owner.name.trim().split(/\s+/)[0];
  const allergyText = [...pet.allergyTags, ...(has(pet.allergies) ? [pet.allergies!.trim()] : [])].join(", ");
  const hasAllergies = has(allergyText) && !/^(none|no|nil|na|n\/a)\.?$/i.test(allergyText.trim());
  const personality = [...pet.temperamentTags, ...(has(pet.temperament) ? [pet.temperament!.trim()] : [])];
  const subtitle = [pet.breed, pet.gender === "MALE" ? "Boy" : pet.gender === "FEMALE" ? "Girl" : null, pet.neutered ? (pet.gender === "FEMALE" ? "Spayed" : "Neutered") : null].filter(Boolean).join(" · ");
  const facts = [
    { k: "Age", v: ageLabel(pet.birthday) },
    { k: "Weight", v: pet.weightKg != null ? `${pet.weightKg} kg` : null },
    { k: "Coat", v: pet.coatColor },
  ].filter((f) => f.v);
  const contacts = [
    ...(pet.owner.phone ? [{ id: "owner", name: firstName, phone: pet.owner.phone, relationship: "Owner" }] : []),
    ...pet.emergencyContacts,
  ];

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto px-4 pt-5 pb-12 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Barkado & Co. home"><BrandLogo variant="wordmark" tone="plum" className="h-8 w-auto" /></Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#ffffff", color: MUTED, border: "1px solid rgba(61,20,38,0.1)" }}>
            <Lock size={11} /> Shared by {firstName}
          </span>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] p-5 pb-7" style={{ background: PLUM, boxShadow: "0 18px 36px -14px rgba(110,30,59,0.55)" }}>
          <span className="brand-wave" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: YELLOW }}>PawPassport</p>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider" style={{ background: "rgba(249,221,138,0.14)", color: YELLOW, border: "1px solid rgba(249,221,138,0.3)" }}>{derivePassportNumber(pet.id)}</span>
          </div>
          <div className="relative flex items-center gap-4 mt-4">
            <span className="block w-[92px] h-[92px] rounded-full p-[3px] shrink-0" style={{ background: YELLOW }}>
              {pet.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pet.photoUrl} alt={pet.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "#5a1830" }}><PawPrint size={30} color={YELLOW} /></span>
              )}
            </span>
            <div className="min-w-0">
              <h1 className="font-bold text-[26px] leading-tight truncate" style={{ ...H, color: "#fffaf0" }}>{pet.name}</h1>
              {subtitle && <p className="text-[13px] mt-0.5" style={{ color: "#a5bde1" }}>{subtitle}</p>}
            </div>
          </div>
          {facts.length > 0 && (
            <dl className="relative grid grid-cols-3 gap-2 mt-5">
              {facts.map((f) => (
                <div key={f.k} className="rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <dt className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(251,240,217,0.6)" }}>{f.k}</dt>
                  <dd className="text-sm font-bold mt-0.5 truncate" style={{ ...H, color: "#fffaf0" }}>{f.v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="relative text-right mt-4 text-[15px]" style={{ color: YELLOW, fontFamily: "var(--font-script)" }}>A Hug in every Paw</p>
        </section>

        {contacts.length > 0 && (
          <section className="rounded-[1.75rem] p-4" style={{ background: YELLOW }}>
            <p className="font-bold text-[15px] mb-2.5" style={{ ...H, color: INK }}>Found {pet.name} or need help? Call:</p>
            <div className="space-y-2">
              {contacts.map((c) => (
                <a key={c.id} href={`tel:${c.phone}`} className="tap-scale flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: "#fffaf0" }}>
                  <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: PLUM }}><Phone size={16} color="white" /></span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ ...H, color: INK }}>{c.name}{c.relationship ? <span className="font-semibold" style={{ color: MUTED }}> · {c.relationship}</span> : null}</p>
                    <p className="text-xs" style={{ color: MUTED }}>{c.phone}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {hasAllergies && (
          <section className="rounded-[1.75rem] p-4 flex items-start gap-3" style={{ background: "#fde7dc", border: "1.5px dashed #c2410c" }}>
            <AlertTriangle size={20} color="#c2410c" className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm" style={{ ...H, color: "#7c2d12" }}>Allergies</p>
              <p className="text-sm mt-0.5" style={{ color: "#7c2d12" }}>{allergyText}</p>
            </div>
          </section>
        )}

        <Block title="Vaccines" icon={Syringe}>
          {pet.vaccinations.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>No vaccines recorded.</p>
          ) : (
            <ul className="space-y-2">
              {pet.vaccinations.map((v) => {
                const overdue = v.nextDueDate && v.nextDueDate.getTime() < Date.now();
                return (
                  <li key={v.id} className="flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3" style={{ background: "#fffaf0" }}>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ ...H, color: INK }}>{v.vaccineName}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Given {fmt(v.dateGiven)}{v.nextDueDate ? ` · next ${fmt(v.nextDueDate)}` : ""}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full" style={overdue ? { background: "#fde7dc", color: "#9a3412" } : { background: "#e6edf8", color: INK }}>
                      {overdue ? "Overdue" : "Up to date"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Block>

        {(pet.medications.length > 0 || has(pet.medicalHistory) || has(pet.microchipId)) && (
          <Block title="Health" icon={Pill}>
            <div className="space-y-2 text-sm" style={{ color: INK }}>
              {pet.medications.map((m) => (
                <p key={m.id} className="rounded-2xl px-3.5 py-2.5" style={{ background: "#fffaf0" }}>
                  <b>{m.name}</b>{[m.dosage, m.schedule].filter(Boolean).length > 0 && <span style={{ color: MUTED }}> · {[m.dosage, m.schedule].filter(Boolean).join(" · ")}</span>}
                </p>
              ))}
              {has(pet.medicalHistory) && <p className="whitespace-pre-line">{pet.medicalHistory}</p>}
              {has(pet.microchipId) && <p className="text-xs" style={{ color: MUTED }}>Microchip: <b style={{ color: INK }}>{pet.microchipId}</b></p>}
            </div>
          </Block>
        )}

        {(personality.length > 0 || has(pet.notes) || has(pet.favoriteTreats)) && (
          <Block title="Care notes" icon={HeartHandshake}>
            <div className="space-y-3">
              {personality.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {personality.map((t) => <span key={t} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#e6edf8", color: INK }}>{t}</span>)}
                </div>
              )}
              {has(pet.notes) && <p className="text-sm whitespace-pre-line" style={{ color: INK }}>{pet.notes}</p>}
              {has(pet.favoriteTreats) && <p className="text-xs" style={{ color: MUTED }}>Favourite treats: <b style={{ color: INK }}>{pet.favoriteTreats}</b></p>}
            </div>
          </Block>
        )}

        {has(pet.vetHospitalName) && (
          <Block title="Vet" icon={Stethoscope}>
            <div className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: "#fffaf0" }}>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm" style={{ ...H, color: INK }}>{pet.vetHospitalName}</p>
                {has(pet.attendingVetName) && <p className="text-[11px]" style={{ color: MUTED }}>{pet.attendingVetName}</p>}
              </div>
              {has(pet.vetEmergencyPhone) && (
                <a href={`tel:${pet.vetEmergencyPhone}`} aria-label={`Call ${pet.vetHospitalName}`} className="tap-scale w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: PLUM }}>
                  <Phone size={16} color="white" />
                </a>
              )}
            </div>
          </Block>
        )}

        <p className="text-[11px] text-center" style={{ color: MUTED }}>Last updated {fmt(pet.updatedAt)} · Read-only copy</p>

        <Link href="/" className="tap-scale block rounded-[1.75rem] p-4 text-center" style={{ background: PLUM }}>
          <p className="font-bold text-[16px]" style={{ ...H, color: YELLOW }}>Give your dog a PawPassport too</p>
          <p className="text-xs mt-1" style={{ color: "#fbf0d9" }}>Free with Barkado &amp; Co. Vaccines, care notes and vet details in one place.</p>
        </Link>
      </main>
    </div>
  );
}
