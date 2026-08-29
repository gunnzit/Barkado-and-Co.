"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, Star, ShieldCheck, Check, MapPin, ShoppingBag, Clock, Sparkles, Satellite, Camera } from "lucide-react";
import { getMascotPath } from "@/lib/mascotImage";
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

function priceFor(serviceType: keyof typeof COPY, p: Provider, walkDurationMin: 30 | 45 | 60): number {
  if (serviceType === "WALKING") return WALK_PRICING_PAISE[walkDurationMin] / 100;
  const field = { SITTING: p.pricePerSitDay, GROOMING: p.pricePerGroom, TRAINING: p.pricePerTrain }[serviceType];
  return (field ?? 0) / 100;
}

export default function ServiceBookingFlow({
  serviceType,
  activePetId,
  activePetName,
  hasPets,
  showStartButton,
  isFirstWalk = false,
  defaultAddress,
  defaultPhone,
}: {
  serviceType: "WALKING" | "SITTING" | "GROOMING" | "TRAINING";
  activePetId: string | null;
  activePetName: string | null;
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
    setSubmittingId(providerId);
    setAddError(false);
    const result = await addService({
      serviceType,
      providerId,
      petId: activePetId!,
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

  const detailsValid = start && (COPY[serviceType].needsEndDate ? end : true) && address && phone;

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
    <div className="px-6">
      {/* ===== Intro (Walking only) — hero, packages, features, top walkers ===== */}
      {phase === "intro" && (
        <div className="animate-fade-up">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--cream)" }}>
              <PawPrint size={28} color="var(--terracotta)" />
            </div>
            {isFirstWalk && (
              <span
                className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3"
                style={{ background: "var(--gold)", color: "var(--forest, #16281f)" }}
              >
                Your first walk is free
              </span>
            )}
            <h1 className="text-2xl font-bold mb-2">Professional Dog Walking</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Adventure, exercise, and peace of mind for {activePetName ?? "your pup"}.
            </p>
          </div>

          {/* ===== Select Package ===== */}
          <div className="card mb-6">
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

          {/* ===== Why Choose Our Walks ===== */}
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-3">Why Choose Our Walks?</h2>
            <div className="space-y-2.5">
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
                  <div key={w.id} className="card shrink-0" style={{ width: 140 }}>
                    <img
                      src={w.photoUrl || `https://i.pravatar.cc/150?u=${w.id}`}
                      alt={w.user.name}
                      className="w-14 h-14 rounded-full object-cover mx-auto mb-2"
                      style={{ border: "1px solid var(--border)" }}
                    />
                    <p className="font-semibold text-xs text-center truncate">{w.user.name}</p>
                    <p className="flex items-center justify-center gap-1 text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                      <Star size={10} fill="var(--gold)" color="var(--gold)" /> {w.ratingAvg.toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Details ===== */}
      {phase === "details" && (
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
            {/* Duration is no longer selected here for Walking — it's locked in
                on the intro screen's package cards before this step is ever
                reached (Walking always passes through "intro" first). */}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm">{p.user.name}</p>
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
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
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
            <Link href={serviceType === "WALKING" ? "/owner/dashboard" : "/"} className="btn-secondary inline-block">Keep browsing</Link>
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