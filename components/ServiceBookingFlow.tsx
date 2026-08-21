"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, Star, ShieldCheck, Check, MapPin } from "lucide-react";
import { getMascotPath } from "@/lib/mascotImage";

type Provider = {
  id: string;
  pricePerWalk?: number;
  pricePerSitDay?: number;
  pricePerGroom?: number;
  pricePerTrain?: number;
  ratingAvg: number;
  user: { name: string };
  _count: { bookings: number };
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

function priceFor(serviceType: keyof typeof COPY, p: Provider): number {
  const field = { WALKING: p.pricePerWalk, SITTING: p.pricePerSitDay, GROOMING: p.pricePerGroom, TRAINING: p.pricePerTrain }[serviceType];
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
  const [phase, setPhase] = useState<"intro" | "details" | "providers" | "done">(
    showStartButton ? "intro" : "details"
  );
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const address = defaultAddress ?? "";
  const phone = defaultPhone ?? "";
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [bookedWith, setBookedWith] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "providers") return;
    setLoadingProviders(true);
    fetch(`/api/providers?service=${serviceType}`)
      .then((r) => r.json())
      .then(setProviders)
      .finally(() => setLoadingProviders(false));
  }, [phase, serviceType]);

  const goToProviders = () => {
    // Single-visit services default a short window from the chosen start time.
    if (!COPY[serviceType].needsEndDate && start && !end) {
      const startDate = new Date(start);
      setEnd(new Date(startDate.getTime() + 30 * 60000).toISOString().slice(0, 16));
    }
    setPhase("providers");
  };

  const book = async (providerId: string) => {
    setSubmittingId(providerId);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId,
        petId: activePetId,
        type: serviceType,
        startTime: start,
        endTime: end,
        address,
        phone,
      }),
    });
    if (res.ok) {
      setBookedWith(providerId);
      setPhase("done");
    }
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
      {/* ===== Intro (Walking only) — big Start button ===== */}
      {phase === "intro" && (
        <div className="animate-fade-up text-center py-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--cream)" }}>
            <PawPrint size={28} color="var(--terracotta)" />
          </div>
          {isFirstWalk ? (
            <>
              <span
                className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3"
                style={{ background: "var(--gold)", color: "var(--forest, #16281f)" }}
              >
                Your first walk is free
              </span>
              <h1 className="text-2xl font-bold mb-2">Let's get {activePetName ?? "your pet"} moving 🎉</h1>
              <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Pick a time and we'll find a walker nearby — on us.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">Ready for another walk?</h1>
              <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Pick a time and we'll find a walker nearby.</p>
            </>
          )}
          <button
            onClick={() => setPhase("details")}
            className="tap-scale walk-start-pulse px-8 py-4 rounded-full font-bold text-white"
            style={{ background: "var(--terracotta)" }}
          >
            {isFirstWalk ? "Start your free walk" : "Book walk again"}
          </button>
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
                <div key={p.id} className="card flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{p.user.name}</p>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                        <ShieldCheck size={10} /> Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="flex items-center gap-1"><Star size={11} fill="var(--gold)" color="var(--gold)" /> {p.ratingAvg.toFixed(1)}</span>
                      <span>· {p._count.bookings} completed</span>
                      <span className="font-semibold" style={{ color: "var(--terracotta)" }}>
                        ₹{priceFor(serviceType, p).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => book(p.id)} disabled={submittingId === p.id} className="btn-primary text-sm tap-scale">
                    {submittingId === p.id ? "…" : "Choose"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Done ===== */}
      {phase === "done" && (
        <div className="card text-center py-10 animate-fade-up">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--cream)" }}>
            <Check size={26} color="var(--terracotta)" />
          </div>
          <h2 className="text-xl font-bold mb-2">Requested</h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>You'll be notified once they accept.</p>
          <Link href={serviceType === "WALKING" ? "/owner/dashboard" : "/"} className="btn-primary inline-block">Back to home</Link>
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