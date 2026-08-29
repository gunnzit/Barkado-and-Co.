"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PawPrint, Star, ShieldCheck, Check, MapPin, ShoppingBag, Clock, Sparkles, Satellite, Camera, Navigation, Tag, Plus, Sun, CloudSun, Moon, GraduationCap } from "lucide-react";
import { getMascotPath } from "@/lib/mascotImage";
import { SAMPLE_EXPERIENCE, SAMPLE_SPECIALTIES, sampleIndexFor } from "@/lib/trainerSampleData";
import { useCart } from "@/components/CartProvider";
import FavoriteButton from "@/components/FavoriteButton";

type Provider = {
  id: string;
  photoUrl: string | null;
  pricePerWalk?: number;
  pricePerSitDay?: number;
  pricePerGroom?: number;
  pricePerTrain?: number;
  ratingAvg: number;
  reliabilityScore: number;
  user: { name: string };
  _count: { bookings: number };
  availableAtRequestedTime: boolean | null;
  isSponsored?: boolean;
};

type PetOption = {
  id: string;
  name: string;
  photoUrl: string | null;
};

const COPY: Record<
  "WALKING" | "SITTING" | "GROOMING" | "TRAINING",
  { noun: string; providerNoun: string; findLabel: string; detailsTitle: (pet: string) => string; needsEndDate: boolean }
> = {
  WALKING: { noun: "walk", providerNoun: "Walkers", findLabel: "Find a walker", detailsTitle: (pet) => `When should ${pet} walk?`, needsEndDate: false },
  SITTING: { noun: "stay", providerNoun: "Sitters", findLabel: "Find a sitter", detailsTitle: (pet) => `Plan ${pet}'s stay`, needsEndDate: true },
  GROOMING: { noun: "grooming session", providerNoun: "Groomers", findLabel: "Find a groomer", detailsTitle: (pet) => `Book ${pet}'s grooming`, needsEndDate: false },
  TRAINING: { noun: "training session", providerNoun: "Trainers", findLabel: "Find a trainer", detailsTitle: (pet) => `Book ${pet}'s training`, needsEndDate: false },
};

// Walking prices are set by the platform, not individual providers —
// Grooming, Training, and Sitting remain provider-set.
const WALK_PRICING_PAISE: Record<30 | 45 | 60, number> = {
  30: 30000, // ₹300
  45: 32500, // ₹325
  60: 35000, // ₹350
};

// Package labels shown on the Walking intro screen — deliberately distinct
// from SERVICE_LABEL's "Adventure Walk" (the overall product name used
// elsewhere, e.g. in cart) to avoid two different things sharing one name.
const WALK_PACKAGES: { min: 30 | 45 | 60; name: string; blurb: string }[] = [
  { min: 30, name: "Standard Walk", blurb: "Neighborhood stroll" },
  { min: 45, name: "Extended Walk", blurb: "More time to explore" },
  { min: 60, name: "The Marathon", blurb: "Full exercise session" },
];

// Fixed time slots for the Walking "Schedule & Pet" screen, grouped by
// period — spacing matches the reference design (~90 min apart). This is a
// simple, fixed menu of options, not a query against real provider
// schedules; actual per-provider availability is still checked afterward,
// once a specific provider is chosen on the next screen.
const TIME_SLOTS: { period: "Morning" | "Afternoon" | "Evening"; icon: typeof Sun; hours: string; slots: { label: string; hour: number; minute: number }[] }[] = [
  {
    period: "Morning",
    icon: Sun,
    hours: "8AM - 12PM",
    slots: [
      { label: "08:00 AM", hour: 8, minute: 0 },
      { label: "09:30 AM", hour: 9, minute: 30 },
      { label: "11:00 AM", hour: 11, minute: 0 },
    ],
  },
  {
    period: "Afternoon",
    icon: CloudSun,
    hours: "12PM - 4PM",
    slots: [
      { label: "12:30 PM", hour: 12, minute: 30 },
      { label: "02:00 PM", hour: 14, minute: 0 },
      { label: "03:30 PM", hour: 15, minute: 30 },
    ],
  },
  {
    period: "Evening",
    icon: Moon,
    hours: "4PM - 8PM",
    slots: [
      { label: "05:00 PM", hour: 17, minute: 0 },
      { label: "06:30 PM", hour: 18, minute: 30 },
    ],
  },
];

// Experience/specialty sample data now lives in lib/trainerSampleData.ts —
// shared with the provider profile page so the same trainer shows the
// same placeholder values everywhere they appear.

function priceFor(serviceType: keyof typeof COPY, p: Provider, walkDurationMin: 30 | 45 | 60): number {
  if (serviceType === "WALKING") return WALK_PRICING_PAISE[walkDurationMin] / 100;
  const field = { SITTING: p.pricePerSitDay, GROOMING: p.pricePerGroom, TRAINING: p.pricePerTrain }[serviceType];
  return (field ?? 0) / 100;
}

// Builds the next 7 days starting today, for the date strip.
function buildDateStrip(): { label: string; dayNum: number; iso: string; isToday: boolean }[] {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      isToday: i === 0,
    });
  }
  return days;
}

export default function ServiceBookingFlow({
  serviceType,
  activePetId,
  activePetName,
  pets = [],
  hasPets,
  showStartButton,
  isFirstWalk = false,
  defaultAddress,
  defaultPhone,
}: {
  serviceType: "WALKING" | "SITTING" | "GROOMING" | "TRAINING";
  activePetId: string | null;
  activePetName: string | null;
  pets?: PetOption[];
  hasPets: boolean;
  showStartButton: boolean;
  isFirstWalk?: boolean;
  defaultAddress?: string | null;
  defaultPhone?: string | null;
}) {
  const { addService } = useCart();
  const [phase, setPhase] = useState<"intro" | "details" | "providers" | "done">(
    showStartButton ? "intro" : "details"
  );
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [walkDurationMin, setWalkDurationMin] = useState<30 | 45 | 60>(30);
  const address = defaultAddress ?? "";
  const phone = defaultPhone ?? "";
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [addError, setAddError] = useState(false);

  // Schedule & Pet screen state (Walking only) — which pet, which date,
  // which fixed time slot. Defaults to the globally "active" pet, but can
  // be changed here without affecting the pet switcher elsewhere in the app.
  const [selectedPetId, setSelectedPetId] = useState<string | null>(activePetId);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ label: string; hour: number; minute: number } | null>(null);
  const dateStrip = buildDateStrip();
  const selectedPet = pets.find((p) => p.id === selectedPetId);

  useEffect(() => {
    if (dateStrip.length > 0 && !selectedDateIso) setSelectedDateIso(dateStrip[0].iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDateIso && selectedSlot) {
      const hh = String(selectedSlot.hour).padStart(2, "0");
      const mm = String(selectedSlot.minute).padStart(2, "0");
      setStart(`${selectedDateIso}T${hh}:${mm}`);
    }
  }, [selectedDateIso, selectedSlot]);

  // Training has no real "time of day" concept yet — trainers offer
  // week/month-long plans, not single time-slot sessions (that packages/
  // pricing model is a separate, later feature). Since the Booking table
  // still requires a non-null startTime today, this auto-fills a neutral
  // placeholder time once a start date is picked, without ever showing a
  // time-slot UI to the owner for Training.
  useEffect(() => {
    if (serviceType === "TRAINING" && selectedDateIso && !selectedSlot) {
      setSelectedSlot({ label: "12:00 PM", hour: 12, minute: 0 });
    }
  }, [serviceType, selectedDateIso, selectedSlot]);

  // Top-ranked walkers shown as a preview strip on the Walking intro screen,
  // before any time is picked — fetched with no startTime, so this is
  // ranking-only (composite score), not availability-filtered. Non-clickable
  // for now since individual provider profile pages don't exist yet.
  const [topWalkers, setTopWalkers] = useState<Provider[]>([]);
  useEffect(() => {
    if (phase !== "intro" || serviceType !== "WALKING") return;
    fetch(`/api/providers?service=WALKING`)
      .then((r) => r.json())
      .then((data: Provider[]) => setTopWalkers(data.slice(0, 4)))
      .catch(() => {});
  }, [phase, serviceType]);

  useEffect(() => {
    if (phase !== "providers") return;
    setLoadingProviders(true);
    const params = new URLSearchParams({ service: serviceType });
    if (start) params.set("startTime", start);
    fetch(`/api/providers?${params.toString()}`)
      .then((r) => r.json())
      .then(setProviders)
      .finally(() => setLoadingProviders(false));
  }, [phase, serviceType, start]);

  const goToProviders = () => {
    // Single-visit services default a short window from the chosen start time.
    if (!COPY[serviceType].needsEndDate && start && !end) {
      const startDate = new Date(start);
      const minutes = serviceType === "WALKING" ? walkDurationMin : 30;
      setEnd(new Date(startDate.getTime() + minutes * 60000).toISOString().slice(0, 16));
    }
    setPhase("providers");
  };

  const addToCart = async (providerId: string) => {
    const petId = (serviceType === "WALKING" || serviceType === "TRAINING") ? selectedPetId : activePetId;
    setSubmittingId(providerId);
    setAddError(false);
    const result = await addService({
      serviceType,
      providerId,
      petId: petId!,
      startTime: start,
      endTime: end,
      address,
      phone,
    });
    if (result === "ok") {
      setPhase("done");
    } else if (result === "error") {
      setAddError(true);
    }
    // "unauthorized" opens the sign-in modal via CartProvider; nothing else to do here.
    setSubmittingId(null);
  };

  const sharedScheduleDetailsValid = selectedPetId && selectedDateIso && selectedSlot && address && phone;
  const usesSharedScheduleScreen = serviceType === "WALKING" || serviceType === "TRAINING";
  const detailsValid = usesSharedScheduleScreen
      ? sharedScheduleDetailsValid
      : start && (COPY[serviceType].needsEndDate ? end : true) && address && phone;

  if (!hasPets) {
    return (
      <div className="card mx-6 mt-4 text-center">
        <img src={getMascotPath(null, "sitting")} alt="" className="w-24 h-24 mx-auto mb-3" />
        <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
          Add a pet first so we know who this is for.
        </p>
        <Link href="/owner/pets" className="btn-primary inline-block">Add a pet</Link>
      </div>
    );
  }

  return (
    <div className={phase === "intro" && (serviceType === "WALKING" || serviceType === "TRAINING") ? "" : "px-6"}>
      {/* ===== Intro (Walking) — hero photo, packages, features, top walkers ===== */}
      {phase === "intro" && serviceType === "WALKING" && (
        <div className="animate-fade-up">
          {/* ===== Hero photo ===== */}
          <div className="relative w-full mb-6 overflow-hidden" style={{ height: 280 }}>
            <Image
              src="/images/banner-instant-walk.jpg"
              alt="Dog on a walk"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg, rgba(22,40,31,0.85) 10%, rgba(22,40,31,0.1) 60%, transparent 100%)" }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {isFirstWalk && (
                <span
                  className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3"
                  style={{ background: "var(--gold)", color: "var(--forest, #16281f)" }}
                >
                  Your first walk is free
                </span>
              )}
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 tracking-wide uppercase"
                style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
              >
                Adventure Walk
              </div>
              <h1 className="text-3xl font-bold text-white mb-1 leading-tight">Professional Dog Walking</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                Adventure, exercise, and peace of mind for {activePetName ?? "your pup"}.
              </p>
            </div>
          </div>

          <div className="px-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
            {/* ===== Select Package — sticky on desktop ===== */}
            <div className="lg:col-span-1 lg:order-last mb-6 lg:mb-0">
              <div className="card lg:sticky lg:top-6">
                <h2 className="font-bold text-lg mb-1">Select Package</h2>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                  Choose the best fit for {activePetName ?? "your pet"}'s energy level.
                </p>
                <div className="space-y-2.5">
                  {WALK_PACKAGES.map((pkg) => {
                    const selected = walkDurationMin === pkg.min;
                    return (
                      <button
                        key={pkg.min}
                        onClick={() => setWalkDurationMin(pkg.min)}
                        className="tap-scale w-full flex items-center justify-between rounded-xl px-4 py-3 text-left"
                        style={{
                          background: selected ? "var(--cream)" : "var(--card)",
                          border: `2px solid ${selected ? "var(--panel-dark)" : "var(--border)"}`,
                        }}
                      >
                        <div>
                          <p className="font-bold text-sm">{pkg.name}</p>
                          <p className="text-xs" style={{ color: "var(--muted)" }}>
                            {pkg.min} minutes · {pkg.blurb}
                          </p>
                        </div>
                        <p className="font-bold text-base">₹{WALK_PRICING_PAISE[pkg.min] / 100}</p>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPhase("details")}
                  className="btn-primary w-full tap-scale mt-5"
                >
                  Book a Walk
                </button>
                <p className="text-center text-[11px] mt-2" style={{ color: "var(--muted)" }}>
                  Free cancellation up to 24h before.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              {/* ===== Why Choose Our Walks ===== */}
              <div className="mb-6">
                <h2 className="font-bold text-lg mb-3">Why Choose Our Walks?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { icon: Satellite, title: "GPS Tracking", desc: "Real-time map of every walk — coming soon.", color: "var(--forest, #16281f)" },
                    { icon: Camera, title: "Photo Updates", desc: "Paw-some moments delivered to your phone — coming soon.", color: "var(--terracotta)" },
                    { icon: ShieldCheck, title: "Verified Walkers", desc: "Every walker is document-verified before going live.", color: "var(--gold)" },
                    { icon: Clock, title: "Flexible Durations", desc: "30, 45, or 60-minute walks to fit your schedule.", color: "var(--heritage-red, #c0392b)" },
                  ].map((f) => (
                    <div key={f.title} className="card flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${f.color}1A` }}>
                        <f.icon size={16} color={f.color} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{f.title}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== Meet Our Top Walkers ===== */}
              {topWalkers.length > 0 && (
                <div className="mb-4">
                  <h2 className="font-bold text-lg mb-3">Meet Our Top Walkers</h2>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {topWalkers.map((w) => (
                      <div key={w.id} className="card shrink-0 text-center" style={{ width: 160 }}>
                        <img
                          src={w.photoUrl || `https://i.pravatar.cc/150?u=${w.id}`}
                          alt={w.user.name}
                          className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                          style={{ border: "1px solid var(--border)" }}
                        />
                        <p className="font-semibold text-sm">{w.user.name}</p>
                        <p className="flex items-center justify-center gap-1 text-xs mb-2" style={{ color: "var(--muted)" }}>
                          <Star size={11} fill="var(--gold)" color="var(--gold)" /> {w.ratingAvg.toFixed(1)}
                        </p>
                        {/* Distance and specialty tags aren't real data yet
                            (no provider location or specialty field exists) —
                            shown as a plain "coming soon" note rather than
                            faking numbers or tags. */}
                        <p className="flex items-center justify-center gap-1 text-[11px]" style={{ color: "var(--muted)" }}>
                          <Navigation size={10} /> Distance coming soon
                        </p>
                        <p className="flex items-center justify-center gap-1 text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                          <Tag size={10} /> Specialties coming soon
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Intro (Training) — hero photo, categories (no price — Training
          stays provider-set), features. No top-trainers strip, per product
          decision, since provider profile pages don't exist yet. ===== */}
      {phase === "intro" && serviceType === "TRAINING" && (
        <div className="animate-fade-up">
          {/* ===== Hero photo ===== */}
          <div className="relative w-full mb-6 overflow-hidden" style={{ height: 280 }}>
            <Image
              src="/images/hero-dog-german-shepherd.jpg"
              alt="Dog training session"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg, rgba(22,40,31,0.85) 10%, rgba(22,40,31,0.1) 60%, transparent 100%)" }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 tracking-wide uppercase"
                style={{ background: "var(--heritage-red, #c0392b)", color: "white" }}
              >
                Good Manners Programme
              </div>
              <h1 className="text-3xl font-bold text-white mb-1 leading-tight">Professional Pet Training</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                Expert guidance for a harmonious life together, tailored to {activePetName ?? "your pet"}.
              </p>
            </div>
          </div>

          <div className="px-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
            {/* ===== Training Categories — informational only, no price:
                Training stays provider-set, so price depends on which
                trainer gets chosen on the next screen, not on category. ===== */}
            <div className="lg:col-span-1 lg:order-last mb-6 lg:mb-0">
              <div className="card lg:sticky lg:top-6">
                <h2 className="font-bold text-lg mb-1">Training Categories</h2>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                  Explore categories and find the right trainer — each trainer sets their own rates.
                </p>
                <div className="space-y-3">
                  {[
                    { title: "Puppy Foundation", blurb: "Basic manners & socialization for a strong start." },
                    { title: "Behavioral Correction", blurb: "Specialized focus for specific behavioral issues." },
                    { title: "Agility & Sport", blurb: "High-energy skills, course work, and fitness." },
                  ].map((cat) => (
                    <div key={cat.title} className="flex items-start gap-3 rounded-xl px-3 py-3" style={{ border: "1px solid var(--border)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                        <GraduationCap size={16} color="var(--heritage-red, #c0392b)" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{cat.title}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{cat.blurb}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setPhase("details")}
                  className="btn-primary w-full tap-scale mt-5"
                >
                  Find a Trainer
                </button>
                <p className="text-center text-[11px] mt-2" style={{ color: "var(--muted)" }}>
                  Compare trainer profiles and pricing.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              {/* ===== Why Choose Our Training ===== */}
              <div className="mb-6">
                <h2 className="font-bold text-lg mb-3">Why Choose Our Training?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { icon: ShieldCheck, title: "Certified Trainers", desc: "Verified trainer certifications — coming soon.", color: "var(--forest, #16281f)" },
                    { icon: Sparkles, title: "Positive Reinforcement", desc: "We only work with reward-based, positive methods.", color: "var(--gold)" },
                    { icon: PawPrint, title: "Personalized Plans", desc: "Every dog is unique — tailored to your pet's needs.", color: "var(--terracotta)" },
                    { icon: Camera, title: "Progress Reports", desc: "Session updates and homework — coming soon.", color: "var(--heritage-red, #c0392b)" },
                  ].map((f) => (
                    <div key={f.title} className="card flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${f.color}1A` }}>
                        <f.icon size={16} color={f.color} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{f.title}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Details — Walking and Training share the Schedule & Pet
          screen (pet picker, date strip, fixed time slots); Sitting and
          Grooming keep the original free-entry date/time form. ===== */}
      {phase === "details" && usesSharedScheduleScreen && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold mb-6">Schedule &amp; Pet</h1>

          {/* ===== Select Pet ===== */}
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-3">Select Pet</h2>
            <div className="flex gap-4">
              {pets.map((p) => {
                const selected = selectedPetId === p.id;
                return (
                  <button key={p.id} onClick={() => setSelectedPetId(p.id)} className="tap-scale text-center">
                    <img
                      src={p.photoUrl || `https://i.pravatar.cc/150?u=pet-${p.id}`}
                      alt={p.name}
                      className="w-16 h-16 rounded-full object-cover mb-1.5"
                      style={{ border: `2px solid ${selected ? "var(--panel-dark)" : "var(--border)"}` }}
                    />
                    <p className="text-xs font-semibold" style={{ color: selected ? undefined : "var(--muted)" }}>{p.name}</p>
                  </button>
                );
              })}
              <Link href="/owner/pets" className="tap-scale text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-1.5"
                  style={{ border: "2px dashed var(--border)" }}
                >
                  <Plus size={20} color="var(--muted)" />
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Add Pet</p>
              </Link>
            </div>
          </div>

          {/* ===== Select Date ===== */}
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-3">
              {serviceType === "TRAINING" ? "When would you like to start?" : "Select Date"}
            </h2>
            <div className="card flex justify-between gap-1 p-3">
              {dateStrip.map((d) => {
                const selected = selectedDateIso === d.iso;
                return (
                  <button
                    key={d.iso}
                    onClick={() => setSelectedDateIso(d.iso)}
                    className="tap-scale flex-1 flex flex-col items-center py-2 rounded-xl"
                    style={{ background: selected ? "var(--panel-dark)" : "transparent" }}
                  >
                    <span className="text-[11px] font-semibold mb-1" style={{ color: selected ? "rgba(255,255,255,0.75)" : "var(--muted)" }}>
                      {d.label}
                    </span>
                    <span className="text-sm font-bold" style={{ color: selected ? "white" : undefined }}>{d.dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== Select Time — Walking only. Training has no single-slot
              time concept (real plan/scheduling handled trainer-side,
              later), so this section is skipped entirely for Training. ===== */}
          {serviceType === "WALKING" && (
            <div className="mb-6">
              <h2 className="font-bold text-sm mb-3">Select Time</h2>
              <div className="space-y-4">
                {TIME_SLOTS.map((group) => (
                  <div key={group.period}>
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
                      <group.icon size={12} /> {group.period} ({group.hours})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.slots.map((slot) => {
                        const selected = selectedSlot?.label === slot.label;
                        return (
                          <button
                            key={slot.label}
                            onClick={() => setSelectedSlot(slot)}
                            className="tap-scale px-4 py-2.5 rounded-xl text-sm font-semibold"
                            style={{
                              background: selected ? "var(--card)" : "var(--card)",
                              border: `2px solid ${selected ? "var(--panel-dark)" : "var(--border)"}`,
                            }}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== Address/phone — shown if on file, prompt to add if missing ===== */}
          {address && phone ? (
            <div className="card mb-6">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Meeting at</p>
              <p className="text-sm mb-1">{address}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{phone}</p>
              <Link href="/owner/profile" className="text-xs font-semibold inline-block mt-2" style={{ color: "var(--terracotta)" }}>
                Edit in profile
              </Link>
            </div>
          ) : (
            <div className="card mb-6" style={{ border: "1px solid var(--terracotta)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--terracotta)" }}>
                Add your address and phone number to continue
              </p>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                Your {serviceType === "TRAINING" ? "trainer" : "walker"} needs to know where and how to reach you.
              </p>
              <Link href="/owner/profile" className="btn-primary inline-block text-sm">
                Add in profile
              </Link>
            </div>
          )}

          <button
            onClick={goToProviders}
            disabled={!detailsValid}
            className="btn-primary w-full tap-scale"
            style={{ opacity: detailsValid ? 1 : 0.5 }}
          >
            Continue to {COPY[serviceType].findLabel.charAt(0).toLowerCase() + COPY[serviceType].findLabel.slice(1)}
          </button>
        </div>
      )}

      {phase === "details" && !usesSharedScheduleScreen && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold mb-1">
            {COPY[serviceType].detailsTitle(activePetName ?? "your pet")}
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            {COPY[serviceType].needsEndDate ? "Pick dates and where to pick up / drop off." : "Pick a time and where to meet."}
          </p>

          <div className="card space-y-4 mb-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                {COPY[serviceType].needsEndDate ? "Start" : "Time"}
              </label>
              <input
                type="datetime-local"
                className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
                style={{ borderColor: "var(--border)" }}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            {COPY[serviceType].needsEndDate && (
              <div>
                <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>End</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
                  style={{ borderColor: "var(--border)" }}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="card mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Meeting at</p>
            <p className="text-sm mb-1">{address || "No address on file"}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{phone || "No phone on file"}</p>
            <Link href="/owner/profile" className="text-xs font-semibold inline-block mt-2" style={{ color: "var(--terracotta)" }}>
              Edit in profile
            </Link>
          </div>

          <button
            onClick={goToProviders}
            disabled={!detailsValid}
            className="btn-primary w-full tap-scale"
            style={{ opacity: detailsValid ? 1 : 0.5 }}
          >
            {COPY[serviceType].findLabel}
          </button>
        </div>
      )}

      {/* ===== Providers nearby ===== */}
      {phase === "providers" && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <MapPin size={20} color="var(--terracotta)" />
            {COPY[serviceType].providerNoun} nearby
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Verified, ready to help.</p>

          {addError && (
            <p className="text-xs mb-4" style={{ color: "var(--terracotta)" }}>
              Couldn't add that to your cart — please try again.
            </p>
          )}

          {loadingProviders ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
          ) : providers.length === 0 ? (
            <div className="text-center py-6">
              <img src={getMascotPath(null, "headshot")} alt="" className="w-16 h-16 mx-auto mb-2 rounded-full" />
              <p className="text-sm" style={{ color: "var(--muted)" }}>No verified providers yet for this service.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((p) => (
                <div key={p.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Real photo if the provider has uploaded one; otherwise a
                          consistent placeholder avatar seeded by provider ID, so
                          the same provider always shows the same stand-in face
                          instead of a different random one on every reload. */}
                      <img
                        src={p.photoUrl || `https://i.pravatar.cc/150?u=${p.id}`}
                        alt={p.user.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                        style={{ border: "1px solid var(--border)" }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm truncate">{p.user.name}</p>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                            <ShieldCheck size={10} /> Verified
                          </span>
                          {p.isSponsored && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>
                              <Sparkles size={10} /> Sponsored
                            </span>
                          )}
                          {p.availableAtRequestedTime === false && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "#fdece0", color: "#a5652a" }}>
                              <Clock size={10} /> Outside their hours
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--muted)" }}>
                          <span className="flex items-center gap-1"><Star size={11} fill="var(--gold)" color="var(--gold)" /> {p.ratingAvg.toFixed(1)}</span>
                          <span>· {p._count.bookings} completed</span>
                          <span className="font-semibold" style={{ color: "var(--terracotta)" }}>
                            ₹{priceFor(serviceType, p, walkDurationMin).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <FavoriteButton providerId={p.id} />
                      <button onClick={() => addToCart(p.id)} disabled={submittingId === p.id} className="btn-primary text-sm tap-scale">
                        {submittingId === p.id ? "…" : "Choose"}
                      </button>
                    </div>
                  </div>

                  {/* Reliability score bar — based on the same declined/expired/
                      provider-cancelled calculation used in ranking, now shown directly. */}
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                      <span style={{ color: "var(--muted)" }}>Reliability Score</span>
                      <span>{p.reliabilityScore}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p.reliabilityScore}%`, background: "var(--panel-dark)" }}
                      />
                    </div>
                  </div>

                  {/* ===== Training-only: experience + specialty tags are
                      SAMPLE data (no real field exists yet — providers will
                      set these themselves later). Plans price uses the
                      provider's real pricePerTrain rate, just framed to
                      match the "Plans from" style. "View Profile" is
                      non-clickable — no profile page exists yet. ===== */}
                  {serviceType === "TRAINING" && (
                    <>
                      <div className="mt-3 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid var(--border)" }}>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--muted)" }}>Experience</p>
                          <p className="text-sm font-semibold">{SAMPLE_EXPERIENCE[sampleIndexFor(p.id, SAMPLE_EXPERIENCE.length)]}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--muted)" }}>Specialties</p>
                          <div className="flex flex-wrap gap-1">
                            {SAMPLE_SPECIALTIES[sampleIndexFor(p.id, SAMPLE_SPECIALTIES.length)].map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--cream)", color: "var(--forest, #16281f)" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                        <div>
                          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Plans from</p>
                          <p className="font-bold text-base">₹{priceFor(serviceType, p, walkDurationMin).toFixed(0)}</p>
                        </div>
                        <Link
                          href={`/provider/${p.id}`}
                          className="tap-scale text-xs font-semibold px-3 py-1.5 rounded-full"
                          style={{ border: "1px solid var(--panel-dark)", color: "var(--panel-dark)" }}
                        >
                          View Profile
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Done — added to cart ===== */}
      {phase === "done" && (
        <div className="card text-center py-10 animate-fade-up">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--cream)" }}>
            <ShoppingBag size={24} color="var(--terracotta)" />
          </div>
          <h2 className="text-xl font-bold mb-2">Added to your cart</h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Review it alongside anything else you're getting, then pay when you're ready.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/cart" className="btn-primary inline-block">View cart</Link>
            <Link href="/" className="btn-secondary inline-block">Keep browsing</Link>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes walkStartPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201, 122, 86, 0.5); }
          50% { box-shadow: 0 0 0 12px rgba(201, 122, 86, 0); }
        }
        .walk-start-pulse {
          animation: walkStartPulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}