"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, PawPrint, Home as HomeIcon, ShieldCheck, Star, Check } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import WalkTransition from "@/components/WalkTransition";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import { useActiveBreedTheme } from "@/hooks/useActiveBreedTheme";

type Provider = {
  id: string;
  bio?: string;
  pricePerWalk?: number;
  pricePerSitDay?: number;
  ratingAvg: number;
  user: { name: string };
  _count: { bookings: number };
};

type Pet = { id: string; name: string; breed?: string };

const SERVICES = [
  { type: "WALKING" as const, title: "Adventure Walk", desc: "A verified walker, ready today", icon: PawPrint, photo: "/images/tab-walking.jpg" },
  { type: "SITTING" as const, title: "Home Staycation", desc: "In-home care while you're away", icon: HomeIcon, photo: "/images/tab-sitting.jpg" },
];

const STEPS = ["Service", "Pet", "Time", "Match"];

export default function BookFlow() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("service") as "WALKING" | "SITTING" | null;
  const themeClass = useActiveBreedTheme();

  const [step, setStep] = useState(preselected ? 1 : 0);
  const [service, setService] = useState<"WALKING" | "SITTING" | null>(preselected);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showWalkAnim, setShowWalkAnim] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [booked, setBooked] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/pets").then((r) => r.json()).then(setPets);
  }, []);

  useEffect(() => {
    if (service && step === 3) {
      fetch(`/api/providers?service=${service}`).then((r) => r.json()).then(setProviders);
    }
  }, [service, step]);

  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goBack = () => setStep((s) => Math.max(s - 1, preselected ? 1 : 0));

  const detectLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location isn't available on this device — enter your address instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          setAddress(data?.display_name || `Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } catch {
          setAddress(`Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
        setLocating(false);
      },
      () => {
        setLocationError("Couldn't access your location — enter your address instead.");
        setLocating(false);
      }
    );
  };

  const requestBooking = async (providerId: string) => {
    setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId,
        petId: selectedPet,
        type: service,
        startTime: start,
        endTime: end,
        address,
        phone,
        latitude: coords?.lat,
        longitude: coords?.lng,
      }),
    });
    if (res.ok) setBooked(providerId);
    setSubmitting(false);
  };

  const selectedPetObj = pets.find((p) => p.id === selectedPet);

  if (showWalkAnim) {
    return (
      <WalkTransition
        onDone={() => {
          setShowWalkAnim(false);
          setService("WALKING");
          goNext();
        }}
      />
    );
  }

  return (
    <div className={`w-full ${themeClass}`} style={{ background: "var(--cream)", minHeight: "100vh" }}>
    <main className="max-w-lg mx-auto px-6 py-8 pb-28">
      <div className="flex items-center justify-between mb-4">
        <PetSwitcher />
        <ProfileMenu />
      </div>

      <div className="flex items-center gap-3 mb-6">
        {step > (preselected ? 1 : 0) ? (
          <button onClick={goBack} className="tap-scale">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <Link href={service === "WALKING" ? "/owner/dashboard" : "/"} className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
        )}
        <div className="flex gap-1.5 flex-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: i <= step ? "var(--tan)" : "var(--border)", transition: "background 0.3s ease" }}
            />
          ))}
        </div>
      </div>

      {/* ===== Step 0: Service ===== */}
      {step === 0 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold mb-1">What does your pet need?</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>One tap, we'll take it from there.</p>
          <div className="space-y-3">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.type}
                  onClick={() => {
                    if (s.type === "WALKING") {
                      setShowWalkAnim(true);
                    } else {
                      setService(s.type);
                      goNext();
                    }
                  }}
                  className="w-full rounded-2xl overflow-hidden relative tap-scale text-left"
                  style={{ height: 120 }}
                >
                  <Image src={s.photo} alt={s.title} fill sizes="500px" className="object-cover" />
                  <div className="absolute inset-0 flex items-center gap-4 px-5" style={{ background: "linear-gradient(90deg, rgba(43,29,20,0.8) 40%, transparent 100%)" }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                      <Icon size={20} color="white" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{s.title}</p>
                      <p className="text-white/75 text-xs">{s.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Step 1: Pet ===== */}
      {step === 1 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold mb-1">For which pet?</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            {SERVICES.find((s) => s.type === service)?.title}
          </p>
          {pets.length === 0 ? (
            <div className="card">
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>You haven't added a pet yet.</p>
              <Link href="/owner/pets" className="btn-primary inline-block">Add a pet</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {pets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPet(p.id); goNext(); }}
                  className="w-full card flex items-center justify-between tap-scale"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--cream)" }}>
                      <PawPrint size={18} color="var(--tan)" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{p.breed}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Step 2: Time ===== */}
      {step === 2 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold mb-1">When?</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>For {selectedPetObj?.name}</p>
          <div className="card space-y-4 mb-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Start</label>
              <input
                type="datetime-local"
                className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
                style={{ borderColor: "var(--border)" }}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
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
          </div>

          <div className="card space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Location</label>
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="text-xs font-semibold tap-scale"
                style={{ color: "var(--terracotta, var(--tan))" }}
              >
                {locating ? "Locating…" : "Use my location"}
              </button>
            </div>
            <input
              type="text"
              placeholder="Address"
              className="w-full border rounded-xl px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
              value={address}
              onChange={(e) => { setAddress(e.target.value); setCoords(null); }}
            />
            {locationError && (
              <p className="text-xs" style={{ color: "var(--terracotta, var(--tan))" }}>{locationError}</p>
            )}
            <div>
              <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Mobile number</label>
              <input
                type="tel"
                placeholder="For the handler to reach you"
                className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
                style={{ borderColor: "var(--border)" }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={goNext}
            disabled={!start || !end || !address || !phone}
            className="btn-primary w-full tap-scale"
            style={{ opacity: !start || !end || !address || !phone ? 0.5 : 1 }}
          >
            Find a match
          </button>
        </div>
      )}

      {/* ===== Step 3: Match ===== */}
      {step === 3 && (
        <div className="animate-fade-up">
          {booked ? (
            <div className="card text-center py-10">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--cream)" }}>
                <Check size={26} color="var(--tan)" />
              </div>
              <h2 className="text-xl font-bold mb-2">Requested</h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
                You'll be notified once they accept.
              </p>
              <Link href={service === "WALKING" ? "/owner/dashboard" : "/"} className="btn-primary inline-block">Back to home</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">Choose your match</h1>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Verified providers near you</p>
              {providers.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted)" }}>No verified providers yet for this service.</p>
              ) : (
                <div className="space-y-3">
                  {providers.map((p) => (
                    <div key={p.id} className="card flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{p.user.name}</p>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--cream)", color: "var(--chestnut)" }}>
                            <ShieldCheck size={10} /> Verified
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                          <span className="flex items-center gap-1"><Star size={11} fill="var(--tan)" color="var(--tan)" /> {p.ratingAvg.toFixed(1)}</span>
                          <span>· {p._count.bookings} completed</span>
                          <span className="font-semibold" style={{ color: "var(--espresso)" }}>
                            ₹{service === "WALKING" ? ((p.pricePerWalk ?? 0) / 100).toFixed(0) : ((p.pricePerSitDay ?? 0) / 100).toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => requestBooking(p.id)}
                        disabled={submitting}
                        className="btn-primary text-sm tap-scale"
                      >
                        Choose
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <BottomNav />
    </main>
    </div>
  );
}