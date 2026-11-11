"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Undo2, Lock, Sun, CloudSun, Moon, Plus, PawPrint, MapPin, Phone,
  Sparkles, Star, Check, ChevronDown, ChevronRight, Clock, ArrowRight, Loader2,
} from "lucide-react";
import { useCart } from "@/components/CartProvider";

/*
 * One-screen walk booking (replaces the old intro → schedule → walkers steps).
 * Dog → length → day & time → walker (best available by default) → book.
 * The price and the Book button live in a sticky bar, always visible.
 *
 * Prices must match /api/cart/service (base tiers, 10% first-walk discount
 * rounded to whole rupees). Times are sent as India-time wall clock strings
 * and parsed server-side by lib/istTime.
 */

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const YELLOW = "#f9dd8a";
const MUTED = "#5e4752";
const CARD = "0 8px 24px -4px rgba(61,20,38,0.06)";
const H = { fontFamily: "var(--font-heading)" } as const;

const WALK_PRICING_PAISE: Record<30 | 45 | 60, number> = { 30: 30000, 45: 32500, 60: 35000 };
const LENGTHS: { min: 30 | 45 | 60; name: string; blurb: string }[] = [
  { min: 30, name: "Standard", blurb: "Neighbourhood stroll" },
  { min: 45, name: "Extended", blurb: "More time to sniff" },
  { min: 60, name: "Marathon", blurb: "Full workout" },
];
const walkPrice = (min: 30 | 45 | 60, firstWalk: boolean) =>
  firstWalk ? Math.round((WALK_PRICING_PAISE[min] * 0.9) / 100) : WALK_PRICING_PAISE[min] / 100;

type Slot = { label: string; hour: number; minute: number };
const PERIODS: { key: "morning" | "afternoon" | "evening"; label: string; icon: typeof Sun; slots: Slot[] }[] = [
  {
    key: "morning", label: "Morning", icon: Sun,
    slots: [
      { label: "6:00 AM", hour: 6, minute: 0 }, { label: "7:00 AM", hour: 7, minute: 0 },
      { label: "8:00 AM", hour: 8, minute: 0 }, { label: "9:30 AM", hour: 9, minute: 30 },
      { label: "11:00 AM", hour: 11, minute: 0 },
    ],
  },
  {
    key: "afternoon", label: "Afternoon", icon: CloudSun,
    slots: [{ label: "12:30 PM", hour: 12, minute: 30 }, { label: "2:00 PM", hour: 14, minute: 0 }, { label: "3:30 PM", hour: 15, minute: 30 }],
  },
  {
    key: "evening", label: "Evening", icon: Moon,
    slots: [
      { label: "5:00 PM", hour: 17, minute: 0 }, { label: "6:00 PM", hour: 18, minute: 0 },
      { label: "7:00 PM", hour: 19, minute: 0 }, { label: "7:30 PM", hour: 19, minute: 30 },
    ],
  },
];

// Same lead time the server enforces (lib/istTime MIN_LEAD_MINUTES).
const LEAD_MINUTES = 45;
const pad = (n: number) => String(n).padStart(2, "0");

type Day = { iso: string; top: string; num: number; date: Date };
function buildDays(): Day[] {
  const out: Day[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      top: i === 0 ? "Today" : i === 1 ? "Tmrw" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      num: d.getDate(),
      date: d,
    });
  }
  return out;
}
const slotDate = (day: Day, s: Slot) => new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), s.hour, s.minute);
const isPast = (day: Day, s: Slot) => slotDate(day, s).getTime() < Date.now() + LEAD_MINUTES * 60_000;
const wallClock = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

type Pet = { id: string; name: string; photoUrl: string | null; breed?: string | null };
type Walker = {
  id: string;
  photoUrl: string | null;
  ratingAvg: number;
  ratingCount?: number;
  bio?: string | null;
  user: { name: string };
  _count: { bookings: number };
  availableAtRequestedTime: boolean | null;
  isSponsored?: boolean;
  isCampaignBoosted?: boolean;
  activeCampaignId?: string | null;
};

function Avatar({ name, photoUrl, size = 44 }: { name: string; photoUrl: string | null; size?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return photoUrl ? (
    <img src={photoUrl} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full shrink-0 flex items-center justify-center font-bold" style={{ width: size, height: size, background: "#fef3dc", color: PLUM, fontSize: size * 0.36, ...H }} aria-hidden="true">
      {initials || <PawPrint size={size * 0.4} />}
    </span>
  );
}

function Track({ w }: { w: Walker }) {
  const rated = (w.ratingCount ?? 0) > 0;
  if (!rated && w._count.bookings === 0) return <span className="font-semibold" style={{ color: PLUM }}>New to Barkado</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {rated && (<><Star size={11} fill="#e9b949" color="#e9b949" /> <b style={{ color: INK }}>{w.ratingAvg.toFixed(1)}</b> ·</>)}
      {w._count.bookings} walk{w._count.bookings === 1 ? "" : "s"}
    </span>
  );
}

function Section({ n, title, sub, children, right }: { n: number; title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] p-4 sm:p-5" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5" style={{ background: YELLOW, color: INK, ...H }}>{n}</span>
          <div>
            <h2 className="font-bold text-[17px] leading-6" style={{ ...H, color: PLUM }}>{title}</h2>
            {sub && <p className="text-xs" style={{ color: MUTED }}>{sub}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function WalkBookingFlow({
  pets,
  activePetId,
  isFirstWalk,
  address,
  phone,
}: {
  pets: Pet[];
  activePetId: string | null;
  isFirstWalk: boolean;
  address: string | null;
  phone: string | null;
}) {
  const router = useRouter();
  const { addService } = useCart();
  const days = useMemo(buildDays, []);

  const [petId, setPetId] = useState<string | null>(activePetId ?? pets[0]?.id ?? null);
  const [minutes, setMinutes] = useState<30 | 45 | 60>(30);
  const [dayIso, setDayIso] = useState(days[0].iso);
  const day = days.find((d) => d.iso === dayIso)!;
  const firstOpenPeriod = PERIODS.find((p) => p.slots.some((s) => !isPast(day, s)))?.key ?? "morning";
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>(firstOpenPeriod);
  const [slot, setSlot] = useState<Slot | null>(null);

  // Today with every slot gone: start on tomorrow so the screen isn't a wall of disabled chips.
  useEffect(() => {
    if (PERIODS.every((p) => p.slots.every((s) => isPast(days[0], s)))) setDayIso(days[1].iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changing the day can make the chosen slot unavailable; also jump to a period with open slots.
  useEffect(() => {
    if (slot && isPast(day, slot)) setSlot(null);
    const current = PERIODS.find((p) => p.key === period)!;
    if (current.slots.every((s) => isPast(day, s))) setPeriod(firstOpenPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIso]);

  const start = slot ? slotDate(day, slot) : null;
  const startStr = start ? wallClock(start) : null;
  const endStr = start ? wallClock(new Date(start.getTime() + minutes * 60_000)) : null;

  // Walkers for the chosen time. Ranking comes from /api/providers (rating,
  // reliability, volume, tenure); availability is checked against each
  // walker's weekly hours in India time.
  const [walkers, setWalkers] = useState<Walker[] | null>(null);
  const [loadingWalkers, setLoadingWalkers] = useState(false);
  const [pickedWalkerId, setPickedWalkerId] = useState<string | null>(null); // null = best available
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    if (!startStr) return;
    setLoadingWalkers(true);
    const params = new URLSearchParams({ service: "WALKING", startTime: startStr });
    fetch(`/api/providers?${params}`)
      .then((r) => r.json())
      .then((data: Walker[]) => setWalkers(Array.isArray(data) ? data : []))
      .catch(() => setWalkers([]))
      .finally(() => setLoadingWalkers(false));
  }, [startStr]);

  const ordered = useMemo(() => {
    if (!walkers) return [];
    const rank = (w: Walker) => (w.availableAtRequestedTime === true ? 0 : w.availableAtRequestedTime === null ? 1 : 2);
    return [...walkers].sort((a, b) => rank(a) - rank(b)); // stable: keeps the API's ranking within each group
  }, [walkers]);
  const bestAvailable = ordered.find((w) => w.availableAtRequestedTime !== false) ?? null;
  const chosenWalker = pickedWalkerId ? ordered.find((w) => w.id === pickedWalkerId) ?? null : bestAvailable;
  useEffect(() => {
    if (pickedWalkerId && !ordered.some((w) => w.id === pickedWalkerId)) setPickedWalkerId(null);
  }, [ordered, pickedWalkerId]);

  const pet = pets.find((p) => p.id === petId) ?? null;
  const price = walkPrice(minutes, isFirstWalk);
  const hasContact = !!(address && phone);
  const ready = !!(pet && startStr && endStr && chosenWalker && hasContact);

  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const book = async () => {
    if (!ready || !chosenWalker || !pet || !startStr || !endStr) return;
    if (start && start.getTime() < Date.now() + LEAD_MINUTES * 60_000) {
      setError("That time is too soon now. Please pick a later slot.");
      setSlot(null);
      return;
    }
    setBooking(true);
    setError(null);
    if (chosenWalker.activeCampaignId) {
      fetch(`/api/campaigns/${chosenWalker.activeCampaignId}/click`, { method: "POST" }).catch(() => {});
    }
    const result = await addService({
      serviceType: "WALKING",
      providerId: chosenWalker.id,
      petId: pet.id,
      startTime: startStr,
      endTime: endStr,
      address: address ?? "",
      phone: phone ?? "",
    });
    if (result === "ok") {
      router.push("/cart");
      return;
    }
    setBooking(false);
    if (result === "error") setError("Couldn't book that walk. The time may be too soon. Please try another slot.");
  };

  const missingStep = !pet ? "Add your dog" : !slot ? "Pick a time" : loadingWalkers ? "Finding walkers…" : !chosenWalker ? "No walker free" : !hasContact ? "Add your address" : null;
  const summary = start
    ? `${minutes} min · ${day.top === "Today" || day.top === "Tmrw" ? (day.top === "Tmrw" ? "Tomorrow" : "Today") : `${day.top} ${day.num}`}, ${slot!.label}`
    : `${minutes}-minute walk`;

  const activePeriod = PERIODS.find((p) => p.key === period)!;

  return (
    <div className="pb-[calc(env(safe-area-inset-bottom)+190px)] lg:pb-28">
      {/* ===== Hero ===== */}
      <section className="px-4 pt-1 pb-4">
        <div className="relative overflow-hidden rounded-[2rem]" style={{ background: PLUM, boxShadow: "0 12px 28px -6px rgba(110,30,59,0.22)" }}>
          <div className="relative z-10 flex items-end gap-3 pl-5 pr-3 pt-5 pb-9">
            <div className="flex-1 min-w-0">
              {isFirstWalk && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: YELLOW, color: INK }}>
                  <Sparkles size={11} /> 10% off your first walk
                </span>
              )}
              <h1 className="font-script mt-2 text-[28px] leading-[1.05] text-white">
                Happy walks for {pet?.name ?? "your dog"}
              </h1>
              <p className="mt-1.5 text-xs leading-snug" style={{ color: "rgba(251,240,217,0.88)" }}>
                From <b style={{ color: YELLOW }}>₹{walkPrice(30, isFirstWalk)}</b>
                {isFirstWalk && <span className="line-through ml-1 opacity-70">₹300</span>} · 30 to 60 minutes · 6 AM to 7:30 PM
              </p>
            </div>
            <img src="/images/tab-walking.jpg" alt="A dog out on a leash walk" className="w-28 h-36 object-cover object-[center_75%] rounded-2xl shrink-0" style={{ boxShadow: "0 8px 16px rgba(0,0,0,0.25)" }} />
          </div>
          <span className="brand-wave" aria-hidden="true" />
        </div>
        <div className="flex justify-between gap-2 mt-3 px-1">
          {[
            { icon: ShieldCheck, t: "ID-verified walkers" },
            { icon: Undo2, t: "Cancel any time" },
            { icon: Lock, t: "Secure payment" },
          ].map((g) => (
            <span key={g.t} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: INK }}>
              <g.icon size={13} color={PLUM} /> {g.t}
            </span>
          ))}
        </div>
      </section>

      <div className="px-4 space-y-3.5">
        {/* ===== 1. Dog ===== */}
        <Section n={1} title="Who's going for a walk?">
          {pets.length === 0 ? (
            <Link href="/owner/pets" className="flex items-center gap-3 p-3 rounded-2xl tap-scale" style={{ background: "#fef3dc" }}>
              <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#ffffff" }}><Plus size={18} color={PLUM} /></span>
              <span className="text-sm font-semibold" style={{ color: INK }}>Add your dog to book a walk</span>
            </Link>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
              {pets.map((p) => {
                const on = p.id === petId;
                return (
                  <button key={p.id} type="button" onClick={() => setPetId(p.id)} aria-pressed={on} className="shrink-0 flex flex-col items-center w-[68px] tap-scale">
                    <span className="relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#fef3dc", boxShadow: on ? `0 0 0 3px ${PLUM}` : "0 0 0 1px rgba(61,20,38,0.12)" }}>
                      {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : <PawPrint size={22} color={PLUM} />}
                    </span>
                    {on && (
                      <span className="-mt-3 relative w-5 h-5 rounded-full flex items-center justify-center" style={{ background: PLUM, border: "2px solid white" }}>
                        <Check size={11} color="white" />
                      </span>
                    )}
                    <span className={`text-xs font-bold mt-1 max-w-full truncate ${on ? "" : "mt-[1.4rem]"}`} style={{ color: on ? INK : MUTED }}>{p.name}</span>
                    {p.breed && <span className="text-[10px] max-w-full truncate" style={{ color: MUTED }}>{p.breed}</span>}
                  </button>
                );
              })}
              <Link href="/owner/pets/new" className="shrink-0 flex flex-col items-center w-[68px] tap-scale">
                <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ border: "2px dashed rgba(61,20,38,0.2)" }}><Plus size={18} color={MUTED} /></span>
                <span className="text-xs mt-[1.4rem]" style={{ color: MUTED }}>Add dog</span>
              </Link>
            </div>
          )}
        </Section>

        {/* ===== 2. Length ===== */}
        <Section n={2} title="How long?" sub={pet ? `Pick what suits ${pet.name}'s energy` : undefined}>
          <div className="grid grid-cols-3 gap-2">
            {LENGTHS.map((l) => {
              const on = l.min === minutes;
              return (
                <button
                  key={l.min}
                  type="button"
                  onClick={() => setMinutes(l.min)}
                  aria-pressed={on}
                  className="rounded-2xl px-2 py-3 text-center tap-scale"
                  style={{ background: on ? PLUM : "#fffaf0", border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.12)"}`, color: on ? "white" : INK }}
                >
                  <span className="block text-[22px] font-bold leading-none" style={H}>{l.min}</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ opacity: 0.8 }}>min</span>
                  <span className="block text-xs font-bold mt-2" style={H}>{l.name}</span>
                  <span className="block text-sm font-bold mt-1" style={{ ...H, color: on ? YELLOW : PLUM }}>₹{walkPrice(l.min, isFirstWalk)}</span>
                  {isFirstWalk && <span className="block text-[10px] line-through" style={{ opacity: 0.6 }}>₹{WALK_PRICING_PAISE[l.min] / 100}</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] mt-2 text-center" style={{ color: MUTED }}>{LENGTHS.find((l) => l.min === minutes)!.blurb}</p>
        </Section>

        {/* ===== 3. Day & time ===== */}
        <Section n={3} title="When?">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {days.map((d) => {
              const on = d.iso === dayIso;
              const allGone = PERIODS.every((p) => p.slots.every((s) => isPast(d, s)));
              return (
                <button
                  key={d.iso}
                  type="button"
                  disabled={allGone}
                  onClick={() => setDayIso(d.iso)}
                  aria-pressed={on}
                  className="shrink-0 w-[54px] py-2.5 rounded-2xl flex flex-col items-center tap-scale"
                  style={{ background: on ? PLUM : "#fffaf0", color: on ? "white" : INK, border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.1)"}`, opacity: allGone ? 0.35 : 1 }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ opacity: 0.8 }}>{d.top}</span>
                  <span className="text-lg font-bold leading-tight" style={H}>{d.num}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-full mt-3" style={{ background: "#fef3dc" }} role="tablist">
            {PERIODS.map((p) => {
              const on = p.key === period;
              const open = p.slots.some((s) => !isPast(day, s));
              return (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  disabled={!open}
                  onClick={() => setPeriod(p.key)}
                  className="flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold"
                  style={{ background: on ? "#ffffff" : "transparent", color: open ? INK : "rgba(61,20,38,0.35)", boxShadow: on ? "0 2px 8px rgba(61,20,38,0.08)" : undefined }}
                >
                  <p.icon size={13} /> {p.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            {activePeriod.slots.map((s) => {
              const past = isPast(day, s);
              const on = slot?.label === s.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  disabled={past}
                  onClick={() => setSlot(s)}
                  aria-pressed={on}
                  className={`py-2.5 rounded-full text-sm font-semibold ${past ? "line-through" : "tap-scale"}`}
                  style={{ background: on ? YELLOW : "#ffffff", border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.12)"}`, color: INK, opacity: past ? 0.35 : 1 }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ===== 4. Walker ===== */}
        <Section n={4} title="Your walker" sub={slot ? "We'll match the top-rated walker who's free, or you can choose" : "Pick a time to see who's free"}>
          {!slot ? (
            <div className="flex items-center gap-2 p-3 rounded-2xl text-xs" style={{ background: "#fffaf0", color: MUTED }}>
              <Clock size={14} /> Choose a day and time above.
            </div>
          ) : loadingWalkers ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1].map((i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "#fef3dc" }} />)}
            </div>
          ) : ordered.length === 0 || !bestAvailable ? (
            <div className="p-3 rounded-2xl text-sm" style={{ background: "#fdf1d6", color: INK }}>
              No walker is free at {slot.label}. Try another time.
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPickedWalkerId(null)}
                aria-pressed={pickedWalkerId === null}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left tap-scale"
                style={{ background: pickedWalkerId === null ? "#fef3dc" : "#fffaf0", border: `1.5px solid ${pickedWalkerId === null ? PLUM : "rgba(61,20,38,0.1)"}` }}
              >
                <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: PLUM }}>
                  <Sparkles size={18} color={YELLOW} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm" style={{ ...H, color: INK }}>Best available walker</span>
                  <span className="block text-xs truncate" style={{ color: MUTED }}>
                    Right now that&rsquo;s {bestAvailable.user.name.split(" ")[0]} · <Track w={bestAvailable} />
                  </span>
                </span>
                <Radio on={pickedWalkerId === null} />
              </button>

              <button type="button" onClick={() => setShowAll((v) => !v)} className="w-full flex items-center justify-center gap-1 py-2 text-xs font-bold" style={{ color: PLUM }}>
                {showAll ? "Hide walkers" : `Choose a specific walker (${ordered.length})`}
                <ChevronDown size={14} className={showAll ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>

              {showAll && (
                <ul className="space-y-2">
                  {ordered.map((w) => {
                    const on = pickedWalkerId === w.id;
                    const away = w.availableAtRequestedTime === false;
                    return (
                      <li key={w.id}>
                        <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: on ? "#fef3dc" : "#ffffff", border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.1)"}`, opacity: away ? 0.6 : 1 }}>
                          <button type="button" disabled={away} onClick={() => setPickedWalkerId(w.id)} className="flex items-start gap-3 flex-1 min-w-0 text-left" aria-pressed={on}>
                            <Avatar name={w.user.name} photoUrl={w.photoUrl} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1 font-bold text-sm" style={{ ...H, color: INK }}>
                                <span className="truncate">{w.user.name}</span>
                                <ShieldCheck size={13} color="#7f9cc7" className="shrink-0" aria-label="ID verified" />
                              </span>
                              <span className="block text-xs" style={{ color: MUTED }}>
                                <Track w={w} />
                                {w.availableAtRequestedTime === true && <span className="ml-1.5 font-semibold" style={{ color: INK }}>· Free at {slot.label}</span>}
                                {away && <span className="ml-1.5">· Not working then</span>}
                              </span>
                              {w.bio && <span className="block text-[11px] mt-1 line-clamp-2" style={{ color: MUTED }}>{w.bio}</span>}
                            </span>
                            {!away && <Radio on={on} />}
                          </button>
                        </div>
                        <Link href={`/provider/${w.id}`} className="inline-flex items-center gap-0.5 text-[11px] font-semibold mt-1 ml-14" style={{ color: PLUM }}>
                          View profile <ChevronRight size={12} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </Section>

        {/* ===== 5. Meeting point ===== */}
        <Section n={5} title="Meeting point" right={<Link href="/owner/profile" className="text-xs font-bold underline underline-offset-2" style={{ color: PLUM }}>{hasContact ? "Edit" : "Add"}</Link>}>
          {hasContact ? (
            <div className="space-y-1.5 text-sm" style={{ color: INK }}>
              <p className="flex items-start gap-2"><MapPin size={15} color={PLUM} className="mt-0.5 shrink-0" /> {address}</p>
              <p className="flex items-center gap-2" style={{ color: MUTED }}><Phone size={14} color={PLUM} className="shrink-0" /> {phone}</p>
            </div>
          ) : (
            <Link href="/owner/profile" className="block p-3 rounded-2xl text-sm font-semibold" style={{ background: "#fdf1d6", color: INK }}>
              Add your address and phone so your walker can find you →
            </Link>
          )}
        </Section>

        <p className="text-center text-[11px] px-6" style={{ color: MUTED }}>
          You&rsquo;ll review and pay on the next screen. Cancel any time before the walk for a full refund.
        </p>
      </div>

      {/* ===== Sticky book bar =====
          Sits 12px above the floating bottom menu (BottomNav: bottom 32px +
          safe area, 64px tall). On desktop the menu is hidden, so the bar
          drops to the bottom edge. */}
      <style>{BAR_CSS}</style>
      <div className="walk-book-bar fixed left-0 right-0 z-[45] px-3">
        <div className="max-w-lg mx-auto">
          {error && <p className="mb-2 text-xs font-semibold text-center px-3 py-2 rounded-xl" style={{ background: "#fdf1d6", color: "#8a2a4d" }}>{error}</p>}
          <div className="flex items-center gap-3 pl-5 pr-2 py-2 rounded-full" style={{ background: PLUM, boxShadow: "0 12px 28px -6px rgba(61,20,38,0.45)" }}>
            <div className="min-w-0 flex-1 text-white">
              <p className="leading-tight">
                <b className="text-lg" style={H}>₹{price}</b>
                {isFirstWalk && <span className="ml-1 text-xs line-through opacity-60">₹{WALK_PRICING_PAISE[minutes] / 100}</span>}
              </p>
              <p className="text-[11px] truncate" style={{ color: "rgba(251,240,217,0.8)" }}>{summary}</p>
            </div>
            <button
              type="button"
              onClick={book}
              disabled={!ready || booking}
              className="shrink-0 inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-sm font-bold tap-scale"
              style={{ background: ready ? YELLOW : "rgba(249,221,138,0.35)", color: INK, ...H }}
            >
              {booking ? <><Loader2 size={15} className="animate-spin" /> Booking…</> : missingStep ?? <>Book walk <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bottom menu is lg:hidden, so only lift the bar above it below the lg breakpoint.
const BAR_CSS = `
.walk-book-bar { bottom: calc(env(safe-area-inset-bottom) + 32px + 64px + 12px); }
@media (min-width: 1024px) { .walk-book-bar { bottom: 24px; } }
`;

function Radio({ on }: { on: boolean }) {
  return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ border: `2px solid ${on ? PLUM : "rgba(61,20,38,0.25)"}`, background: on ? PLUM : "transparent" }} aria-hidden="true">
      {on && <span className="w-2 h-2 rounded-full bg-white" />}
    </span>
  );
}
