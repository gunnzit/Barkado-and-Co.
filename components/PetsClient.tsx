"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft, Plus, Check, PawPrint } from "lucide-react";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import { derivePassportNumber } from "@/lib/passportId";

const H = { fontFamily: "var(--font-heading)" } as const;

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Walk", SITTING: "Staycation", GROOMING: "Spa Groom", TRAINING: "Training",
};

type Pet = {
  id: string;
  name: string;
  breed?: string | null;
  species?: string;
  size: string;
  gender?: string | null;
  photoUrl?: string | null;
  birthday?: string | null;
  weightKg?: number | null;
  microchipId?: string | null;
  passportCompletedAt?: string | null;
  vaccinations: { id: string; vaccineName: string; nextDueDate: string | null }[];
  nextBooking: { type: string; startTime: string; providerName: string } | null;
};

function formatAge(birthday?: string | null): string | null {
  if (!birthday) return null;
  const b = new Date(birthday);
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} mo${remMonths === 1 ? "" : "s"}`;
  return `${years} yr${years === 1 ? "" : "s"}${remMonths > 0 ? ` ${remMonths} mo${remMonths === 1 ? "" : "s"}` : ""}`;
}

function breedTag(species: string | undefined, breed: string | null | undefined): string {
  if (species && species !== "Dog") return `${species} Care`;
  if (!breed) return "Mixed";
  const first = breed.split(/[\s/]+/)[0];
  return first.length > 14 ? "Mixed" : first;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString("en-IN", { weekday: "short" })} ${time}`;
}

function vaccineChip(vaccinations: Pet["vaccinations"]): { text: string; tone: "amber" | "red" } | null {
  const withDates = vaccinations.filter((v) => v.nextDueDate);
  if (withDates.length === 0) return null;
  const now = new Date();
  const soonest = withDates.reduce((a, b) => (new Date(a.nextDueDate!) < new Date(b.nextDueDate!) ? a : b));
  const due = new Date(soonest.nextDueDate!);
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return { text: "Vaccine overdue", tone: "red" };
  if (daysUntil <= 21) return { text: `Vaccine booster in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, tone: "amber" };
  return { text: `Vaccines valid (${due.getFullYear()})`, tone: "amber" };
}

export default function PetsClient({
  initialThemeClass = "",
  activePetId = null,
}: {
  initialThemeClass?: string;
  activePetId?: string | null;
}) {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [pawPointsBalance, setPawPointsBalance] = useState(0);
  const [switching, setSwitching] = useState<string | null>(null);

  const loadPets = async () => {
    const res = await fetch("/api/pets");
    if (res.ok) setPets(await res.json());
  };

  useEffect(() => {
    loadPets();
    fetch("/api/owner/pawpoints")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setPawPointsBalance(data.balance ?? 0))
      .catch(() => {});
  }, []);

  const setActive = (petId: string) => {
    setSwitching(petId);
    document.cookie = `active_pet_id=${petId}; path=/; max-age=31536000`;
    router.refresh();
    setTimeout(() => setSwitching(null), 400);
  };

  const themeClass = initialThemeClass;

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "#fbfaee", minHeight: "100vh" }}>
      <header className="sticky top-0 z-30 px-5 pt-3 pb-3" style={{ background: "rgba(251,250,238,0.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(194,200,194,0.2)" }}>
        <div className="flex items-center justify-between">
          <PetSwitcher />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold" style={{ background: "#f4eada", color: "#a26227", border: "1px solid #e9dcc8" }}>
              <PawPrint size={13} /> {pawPointsBalance.toLocaleString("en-IN")} pts
            </div>
            <ProfileMenu />
          </div>
        </div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold mt-3 tap-scale" style={{ color: "#665f52" }}>
          <ArrowLeft size={14} /> Back to home
        </Link>
      </header>

      <main className="max-w-lg lg:max-w-2xl mx-auto px-5 pt-4 pb-28">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ ...H, color: "#132a1f" }}>Your Pets</h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.7)", color: "#8c8271", border: "1px solid #e5dfd1" }}>
            {pets.length} registered
          </span>
        </div>
        <p className="text-xs mt-1 mb-5 leading-relaxed" style={{ color: "#6f6759" }}>
          Manage PawPassport™ certificates, vaccination schedules, grooming notes &amp; active care routines.
        </p>

        <Link
          href="/owner/pets/new"
          className="flex items-center justify-between p-4 rounded-2xl mb-4 tap-scale"
          style={{ background: "linear-gradient(135deg, #ffffff, #f9f5ec)", border: "2px dashed #d2c5b0" }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(217,107,67,0.1)", color: "#d96b43" }}>
              <Plus size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: "#132a1f" }}>
                Add a New Pet
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded" style={{ background: "#132a1f", color: "white" }}>New</span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#7a7160" }}>Generate a verified PawPassport ID &amp; medical log</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "white", border: "1px solid #e3dcce" }}>
            <ChevronRight size={16} color="#132a1f" />
          </div>
        </Link>

        <div className="space-y-3.5">
          {pets.map((p) => {
            const isActive = p.id === activePetId;
            const age = formatAge(p.birthday);
            const vChip = vaccineChip(p.vaccinations);
            const chips: { text: string; tone: "green" | "amber" | "blue" | "red" }[] = [];
            if (!isActive && p.nextBooking) {
              chips.push({ text: `${SERVICE_LABEL[p.nextBooking.type] ?? p.nextBooking.type}: ${formatWhen(p.nextBooking.startTime)}`, tone: "blue" });
            }
            if (vChip) chips.push(vChip);
            if (p.microchipId) chips.push({ text: "Microchip Registered", tone: "green" });
            if (p.passportCompletedAt) chips.push({ text: "PawPassport Verified", tone: "green" });

            const toneStyles: Record<string, { bg: string; fg: string; border: string }> = {
              green: { bg: "#ebf5ee", fg: "#1d693b", border: "#d5ebdc" },
              amber: { bg: "#faf2e6", fg: "#a6611b", border: "#f2e0c7" },
              blue: { bg: "#ebf3f8", fg: "#1e5d88", border: "#d1e5f3" },
              red: { bg: "#fbe9e7", fg: "#a3261a", border: "#f3d3ce" },
            };

            return (
              <article
                key={p.id}
                className="relative overflow-hidden rounded-2xl p-4"
                style={{
                  background: "#ffffff",
                  border: isActive ? "1px solid rgba(19,42,31,0.15)" : "1px solid #e8e2d5",
                  boxShadow: "0 4px 20px -2px rgba(19,42,31,0.05)",
                }}
              >
                {isActive && <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ background: "#132a1f" }} />}
                <div className={isActive ? "pl-2" : ""}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: "#ebe5d8", border: "2px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                          {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🐾</span>}
                        </div>
                        {isActive && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#1e8e47", border: "2px solid white" }}>
                            <Check size={9} color="white" />
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-extrabold text-base leading-tight" style={{ ...H, color: "#132a1f" }}>{p.name}</h2>
                          {isActive ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: "#132a1f", color: "#faf8f2" }}>Primary Active</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#f5efeb", color: "#8c6239", border: "1px solid #e9dcd1" }}>{breedTag(p.species, p.breed)}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium mt-0.5" style={{ color: "#6f6759" }}>
                          {[p.breed, p.gender ? (p.gender === "MALE" ? "Male" : "Female") : null].filter(Boolean).join(" • ")}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#8f8574" }}>
                          {[age, p.weightKg ? `${p.weightKg} kg` : null].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                    </div>
                    {!isActive && (
                      <button
                        onClick={() => setActive(p.id)}
                        disabled={switching === p.id}
                        className="text-xs font-bold px-2.5 py-1 rounded-full tap-scale shrink-0"
                        style={{ background: "#faf8f2", color: "#132a1f", border: "1px solid #dfd8ca" }}
                      >
                        {switching === p.id ? "Setting…" : "Set Active"}
                      </button>
                    )}
                  </div>

                  {chips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #f2ece1" }}>
                      {chips.map((c, i) => {
                        const t = toneStyles[c.tone];
                        return (
                          <span key={i} className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: t.bg, color: t.fg, border: `1px solid ${t.border}` }}>
                            {c.text}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3.5 pt-2" style={{ borderTop: "1px solid #f5f0e6" }}>
                    {isActive && p.nextBooking ? (
                      <span className="text-[11px] font-semibold" style={{ color: "#877d6d" }}>
                        Next: {SERVICE_LABEL[p.nextBooking.type] ?? p.nextBooking.type} {formatWhen(p.nextBooking.startTime)}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: "#8f8574" }}>PawPassport™ #{derivePassportNumber(p.id)}</span>
                    )}
                    <Link href={`/owner/pets/${p.id}`} className="inline-flex items-center text-xs font-bold tap-scale" style={{ color: "#132a1f" }}>
                      {isActive ? "Passport & Care" : "View Profile"}
                      <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl p-4 flex items-center justify-between opacity-80" style={{ background: "#132a1f", color: "white" }} title="Placeholder — not a real feature yet">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(196,131,68,0.2)", border: "1px solid rgba(196,131,68,0.4)" }}>
              🛡️
            </div>
            <div>
              <h4 className="font-bold text-xs" style={{ color: "#faf8f2" }}>PawPassport™ Medical Share</h4>
              <p className="text-[11px]" style={{ color: "#c6beaf" }}>Coming soon — QR share for vets &amp; boarders</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: "rgba(196,131,68,0.5)", color: "white" }}>Soon</span>
        </div>
      </main>
    </div>
  );
}