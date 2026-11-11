"use client";

/*
 * Shared building blocks for the one-screen booking pages (walks, grooming,
 * training). Same look everywhere: numbered white cards, plum selection,
 * golden accents, a sticky price + Book bar above the bottom menu.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Undo2, Lock, Sun, CloudSun, Moon, Plus, PawPrint, MapPin, Phone,
  Sparkles, Star, Check, ChevronDown, ChevronRight, Clock, ArrowRight, Loader2,
} from "lucide-react";

export const PLUM = "#6e1e3b";
export const INK = "#3d1426";
export const YELLOW = "#f9dd8a";
export const MUTED = "#5e4752";
export const CARD = "0 8px 24px -4px rgba(61,20,38,0.06)";
export const H = { fontFamily: "var(--font-heading)" } as const;

// ===== Time =====
export type Slot = { label: string; hour: number; minute: number };
export type PeriodKey = "morning" | "afternoon" | "evening";
export type Period = { key: PeriodKey; label: string; icon: typeof Sun; slots: Slot[] };

const s = (label: string, hour: number, minute = 0): Slot => ({ label, hour, minute });

/** Walks start early and run late; at-home grooming and training keep daytime hours. */
export function periodsFor(kind: "walk" | "visit"): Period[] {
  return kind === "walk"
    ? [
        { key: "morning", label: "Morning", icon: Sun, slots: [s("6:00 AM", 6), s("7:00 AM", 7), s("8:00 AM", 8), s("9:30 AM", 9, 30), s("11:00 AM", 11)] },
        { key: "afternoon", label: "Afternoon", icon: CloudSun, slots: [s("12:30 PM", 12, 30), s("2:00 PM", 14), s("3:30 PM", 15, 30)] },
        { key: "evening", label: "Evening", icon: Moon, slots: [s("5:00 PM", 17), s("6:00 PM", 18), s("7:00 PM", 19), s("7:30 PM", 19, 30)] },
      ]
    : [
        { key: "morning", label: "Morning", icon: Sun, slots: [s("8:00 AM", 8), s("9:30 AM", 9, 30), s("11:00 AM", 11)] },
        { key: "afternoon", label: "Afternoon", icon: CloudSun, slots: [s("12:30 PM", 12, 30), s("2:00 PM", 14), s("3:30 PM", 15, 30)] },
        { key: "evening", label: "Evening", icon: Moon, slots: [s("5:00 PM", 17), s("6:00 PM", 18), s("7:00 PM", 19)] },
      ];
}

// Same lead time the server enforces (lib/istTime MIN_LEAD_MINUTES).
export const LEAD_MINUTES = 45;
const pad = (n: number) => String(n).padStart(2, "0");

export type Day = { iso: string; top: string; num: number; date: Date };
export function buildDays(count = 7): Day[] {
  const out: Day[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
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
export const slotDate = (day: Day, sl: Slot) => new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), sl.hour, sl.minute);
export const isPast = (day: Day, sl: Slot) => slotDate(day, sl).getTime() < Date.now() + LEAD_MINUTES * 60_000;
/** India-time wall clock string; the server parses it with lib/istTime. */
export const wallClock = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const dayLabel = (day: Day) => (day.top === "Today" ? "Today" : day.top === "Tmrw" ? "Tomorrow" : `${day.top} ${day.num}`);
export const dayFullyBooked = (day: Day, periods: Period[]) => periods.every((p) => p.slots.every((sl) => isPast(day, sl)));

// ===== People =====
export type Pet = { id: string; name: string; photoUrl: string | null; breed?: string | null; size?: string | null };
export type Pro = {
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
  pricePerGroom?: number | null;
  pricePerTrain?: number | null;
  groomingPackages?: { id: string; name: string; pricesBySize: Record<string, number> }[];
};

/** Free-at-this-time first, then no hours set, then not working — keeps the API ranking within each group. */
export function orderPros<T extends Pro>(pros: T[]): T[] {
  const rank = (p: Pro) => (p.availableAtRequestedTime === true ? 0 : p.availableAtRequestedTime === null ? 1 : 2);
  return [...pros].sort((a, b) => rank(a) - rank(b));
}

export function trackCampaignClick(id: string | null | undefined) {
  if (id) fetch(`/api/campaigns/${id}/click`, { method: "POST" }).catch(() => {});
}

export function Avatar({ name, photoUrl, size = 44 }: { name: string; photoUrl: string | null; size?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return photoUrl ? (
    <img src={photoUrl} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full shrink-0 flex items-center justify-center font-bold" style={{ width: size, height: size, background: "#fef3dc", color: PLUM, fontSize: size * 0.36, ...H }} aria-hidden="true">
      {initials || <PawPrint size={size * 0.4} />}
    </span>
  );
}

/** "★ 4.8 · 23 walks", or "New to Barkado" until there's real history. */
export function Track({ p, noun }: { p: Pro; noun: string }) {
  const rated = (p.ratingCount ?? 0) > 0;
  if (!rated && p._count.bookings === 0) return <span className="font-semibold" style={{ color: PLUM }}>New to Barkado</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {rated && (<><Star size={11} fill="#e9b949" color="#e9b949" /> <b style={{ color: INK }}>{p.ratingAvg.toFixed(1)}</b> ·</>)}
      {p._count.bookings} {noun}{p._count.bookings === 1 ? "" : "s"}
    </span>
  );
}

export function Radio({ on }: { on: boolean }) {
  return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ border: `2px solid ${on ? PLUM : "rgba(61,20,38,0.25)"}`, background: on ? PLUM : "transparent" }} aria-hidden="true">
      {on && <span className="w-2 h-2 rounded-full bg-white" />}
    </span>
  );
}

export function Section({ n, title, sub, children, right }: { n: number; title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="enter-up rounded-[1.75rem] p-4 sm:p-5" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD, ["--d" as string]: `${120 + n * 50}ms` }}>
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

// ===== Page pieces =====
export function BookingHero({
  eyebrow, title, line, img, imgAlt, imgPosition = "center",
}: { eyebrow?: string | null; title: string; line: React.ReactNode; img: string; imgAlt: string; imgPosition?: string }) {
  return (
    <section className="px-4 pt-2 pb-4">
      <div className="enter-up relative overflow-hidden rounded-[2rem]" style={{ background: PLUM, boxShadow: "0 12px 28px -6px rgba(110,30,59,0.22)" }}>
        <div className="relative z-10 flex items-end gap-3 pl-5 pr-3 pt-5 pb-9">
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: YELLOW, color: INK }}>
                <Sparkles size={11} /> {eyebrow}
              </span>
            )}
            <h1 className="font-script mt-2 text-[28px] leading-[1.05] text-white">{title}</h1>
            <p className="mt-1.5 text-xs leading-snug" style={{ color: "rgba(251,240,217,0.88)" }}>{line}</p>
          </div>
          <img src={img} alt={imgAlt} className="enter-pop w-28 h-36 object-cover rounded-2xl shrink-0" style={{ objectPosition: imgPosition, boxShadow: "0 8px 16px rgba(0,0,0,0.25)", ["--d" as string]: "80ms" }} />
        </div>
        <span className="brand-wave" aria-hidden="true" />
      </div>
      <div className="enter-fade grid grid-cols-3 gap-1.5 mt-3" style={{ ["--d" as string]: "160ms" }}>
        {[
          { icon: ShieldCheck, t: "ID-verified" },
          { icon: Undo2, t: "Cancel anytime" },
          { icon: Lock, t: "Secure pay" },
        ].map((g) => (
          <span key={g.t} className="inline-flex items-center justify-center gap-1 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color: INK, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(61,20,38,0.06)" }}>
            <g.icon size={12} color={PLUM} /> {g.t}
          </span>
        ))}
      </div>
    </section>
  );
}

export function PetPicker({ n, title, pets, petId, onChange }: { n: number; title: string; pets: Pet[]; petId: string | null; onChange: (id: string) => void }) {
  return (
    <Section n={n} title={title}>
      {pets.length === 0 ? (
        <Link href="/owner/pets" className="flex items-center gap-3 p-3 rounded-2xl tap-scale" style={{ background: "#fef3dc" }}>
          <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#ffffff" }}><Plus size={18} color={PLUM} /></span>
          <span className="text-sm font-semibold" style={{ color: INK }}>Add your dog to book</span>
        </Link>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {pets.map((p) => {
            const on = p.id === petId;
            return (
              <button key={p.id} type="button" onClick={() => onChange(p.id)} aria-pressed={on} className="shrink-0 flex flex-col items-center w-[68px] tap-scale">
                <span className="motion-select relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#fef3dc", boxShadow: on ? `0 0 0 3px ${PLUM}` : "0 0 0 1px rgba(61,20,38,0.12)" }}>
                  {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : <PawPrint size={22} color={PLUM} />}
                </span>
                {on && (
                  <span className="enter-pop -mt-3 relative w-5 h-5 rounded-full flex items-center justify-center" style={{ background: PLUM, border: "2px solid white" }}>
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
  );
}

/** Day strip + Morning/Afternoon/Evening tabs + slot chips. Past slots are disabled. */
export function DayTimePicker({
  n, days, periods, dayIso, onDay, slot, onSlot,
}: { n: number; days: Day[]; periods: Period[]; dayIso: string; onDay: (iso: string) => void; slot: Slot | null; onSlot: (s: Slot | null) => void }) {
  const day = days.find((d) => d.iso === dayIso) ?? days[0];
  const firstOpen = periods.find((p) => p.slots.some((sl) => !isPast(day, sl)))?.key ?? "morning";
  const [period, setPeriod] = useState<PeriodKey>(firstOpen);

  useEffect(() => {
    if (slot && isPast(day, slot)) onSlot(null);
    const current = periods.find((p) => p.key === period)!;
    if (current.slots.every((sl) => isPast(day, sl))) setPeriod(firstOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIso]);

  const active = periods.find((p) => p.key === period)!;
  return (
    <Section n={n} title="When?">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {days.map((d) => {
          const on = d.iso === dayIso;
          const gone = dayFullyBooked(d, periods);
          return (
            <button
              key={d.iso}
              type="button"
              disabled={gone}
              onClick={() => onDay(d.iso)}
              aria-pressed={on}
              className="motion-select shrink-0 w-[54px] py-2.5 rounded-2xl flex flex-col items-center tap-scale"
              style={{ background: on ? PLUM : "#fffaf0", color: on ? "white" : INK, border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.1)"}`, opacity: gone ? 0.35 : 1 }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ opacity: 0.8 }}>{d.top}</span>
              <span className="text-lg font-bold leading-tight" style={H}>{d.num}</span>
            </button>
          );
        })}
      </div>

      <div className="relative grid grid-cols-3 p-1 rounded-full mt-3" style={{ background: "#fef3dc" }} role="tablist">
        {/* Indicator slides to the chosen period (state indication). */}
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 rounded-full"
          style={{
            width: "calc((100% - 8px) / 3)",
            background: "#ffffff",
            boxShadow: "0 2px 8px rgba(61,20,38,0.08)",
            transform: `translateX(${periods.findIndex((p) => p.key === period) * 100}%)`,
            transition: "transform 250ms var(--ease-in-out)",
          }}
        />
        {periods.map((p) => {
          const on = p.key === period;
          const open = p.slots.some((sl) => !isPast(day, sl));
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={!open}
              onClick={() => setPeriod(p.key)}
              className="motion-select relative z-10 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold"
              style={{ color: open ? (on ? INK : MUTED) : "rgba(61,20,38,0.35)" }}
            >
              <p.icon size={13} /> {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {active.slots.map((sl) => {
          const past = isPast(day, sl);
          const on = slot?.label === sl.label;
          return (
            <button
              key={sl.label}
              type="button"
              disabled={past}
              onClick={() => onSlot(sl)}
              aria-pressed={on}
              className={`motion-select py-2.5 rounded-full text-sm font-semibold ${past ? "line-through" : "tap-scale"}`}
              style={{ background: on ? YELLOW : "#ffffff", border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.12)"}`, color: INK, opacity: past ? 0.35 : 1 }}
            >
              {sl.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/** "Best available" by default, with an optional list to pick a specific pro. */
export function ProPicker<T extends Pro>({
  n, title, noun, slotLabel, loading, pros, pickedId, onPick, priceOf,
}: {
  n: number;
  title: string;
  noun: string; // "walker" | "groomer" | "trainer"
  slotLabel: string | null;
  loading: boolean;
  pros: T[]; // already ordered
  pickedId: string | null; // null = best available
  onPick: (id: string | null) => void;
  priceOf?: (p: T) => string | null;
}) {
  const [showAll, setShowAll] = useState(false);
  const best = pros.find((p) => p.availableAtRequestedTime !== false) ?? null;
  const bookingNoun = noun === "walker" ? "walk" : "booking";

  return (
    <Section n={n} title={title} sub={slotLabel ? `We'll match the top-rated ${noun} who's free, or you can choose` : "Pick a time to see who's free"}>
      {!slotLabel ? (
        <div className="flex items-center gap-2 p-3 rounded-2xl text-xs" style={{ background: "#fffaf0", color: MUTED }}>
          <Clock size={14} /> Choose a day and time above.
        </div>
      ) : loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "#fef3dc" }} />)}
        </div>
      ) : !best ? (
        <div className="p-3 rounded-2xl text-sm" style={{ background: "#fdf1d6", color: INK }}>
          No {noun} is free at {slotLabel}. Try another time.
        </div>
      ) : (
        <div key={slotLabel} className="enter-fade space-y-2">
          <button
            type="button"
            onClick={() => onPick(null)}
            aria-pressed={pickedId === null}
            className="motion-select w-full flex items-center gap-3 p-3 rounded-2xl text-left tap-scale"
            style={{ background: pickedId === null ? "#fef3dc" : "#fffaf0", border: `1.5px solid ${pickedId === null ? PLUM : "rgba(61,20,38,0.1)"}` }}
          >
            <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: PLUM }}>
              <Sparkles size={18} color={YELLOW} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-sm" style={{ ...H, color: INK }}>Best available {noun}</span>
              <span className="block text-xs truncate" style={{ color: MUTED }}>
                Right now that&rsquo;s {best.user.name.split(" ")[0]} · <Track p={best} noun={bookingNoun} />
              </span>
            </span>
            <Radio on={pickedId === null} />
          </button>

          <button type="button" onClick={() => setShowAll((v) => !v)} className="w-full flex items-center justify-center gap-1 py-2 text-xs font-bold" style={{ color: PLUM }}>
            {showAll ? `Hide ${noun}s` : `Choose a specific ${noun} (${pros.length})`}
            <ChevronDown size={14} className={showAll ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {showAll && (
            <ul className="space-y-2">
              {pros.map((p, i) => {
                const on = pickedId === p.id;
                const away = p.availableAtRequestedTime === false;
                const price = priceOf?.(p) ?? null;
                return (
                  <li key={p.id} className="enter-up" style={{ ["--d" as string]: `${Math.min(i, 6) * 40}ms` }}>
                    <div className="motion-select flex items-start gap-3 p-3 rounded-2xl" style={{ background: on ? "#fef3dc" : "#ffffff", border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.1)"}`, opacity: away ? 0.6 : 1 }}>
                      <button type="button" disabled={away} onClick={() => onPick(p.id)} className="flex items-start gap-3 flex-1 min-w-0 text-left" aria-pressed={on}>
                        <Avatar name={p.user.name} photoUrl={p.photoUrl} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1 font-bold text-sm" style={{ ...H, color: INK }}>
                            <span className="truncate">{p.user.name}</span>
                            <ShieldCheck size={13} color="#7f9cc7" className="shrink-0" aria-label="ID verified" />
                          </span>
                          <span className="block text-xs" style={{ color: MUTED }}>
                            <Track p={p} noun={bookingNoun} />
                            {p.availableAtRequestedTime === true && <span className="ml-1.5 font-semibold" style={{ color: INK }}>· Free at {slotLabel}</span>}
                            {away && <span className="ml-1.5">· Not working then</span>}
                          </span>
                          {p.bio && <span className="block text-[11px] mt-1 line-clamp-2" style={{ color: MUTED }}>{p.bio}</span>}
                        </span>
                        <span className="flex flex-col items-end gap-1 shrink-0">
                          {!away && <Radio on={on} />}
                          {price && <span className="text-xs font-bold" style={{ ...H, color: PLUM }}>{price}</span>}
                        </span>
                      </button>
                    </div>
                    <Link href={`/provider/${p.id}`} className="inline-flex items-center gap-0.5 text-[11px] font-semibold mt-1 ml-14" style={{ color: PLUM }}>
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
  );
}

export function MeetingPoint({ n, title, noun, address, phone }: { n: number; title: string; noun: string; address: string | null; phone: string | null }) {
  const has = !!(address && phone);
  return (
    <Section n={n} title={title} right={<Link href="/owner/profile" className="text-xs font-bold underline underline-offset-2" style={{ color: PLUM }}>{has ? "Edit" : "Add"}</Link>}>
      {has ? (
        <div className="space-y-1.5 text-sm" style={{ color: INK }}>
          <p className="flex items-start gap-2"><MapPin size={15} color={PLUM} className="mt-0.5 shrink-0" /> {address}</p>
          <p className="flex items-center gap-2" style={{ color: MUTED }}><Phone size={14} color={PLUM} className="shrink-0" /> {phone}</p>
        </div>
      ) : (
        <Link href="/owner/profile" className="block p-3 rounded-2xl text-sm font-semibold" style={{ background: "#fdf1d6", color: INK }}>
          Add your address and phone so your {noun} can find you →
        </Link>
      )}
    </Section>
  );
}

// Bottom menu (BottomNav) sits 32px + safe area from the bottom and is 64px
// tall; the bar floats 12px above it. On desktop the menu is hidden.
const BAR_CSS = `
.bk-book-bar { bottom: calc(env(safe-area-inset-bottom) + 32px + 64px + 12px); }
@media (min-width: 1024px) { .bk-book-bar { bottom: 24px; } }
`;

export function BookBar({
  price, was, summary, ready, missing, busy, onBook, error, cta,
}: { price: string; was?: string | null; summary: string; ready: boolean; missing: string | null; busy: boolean; onBook: () => void; error: string | null; cta: string }) {
  return (
    <>
      <style>{BAR_CSS}</style>
      <div className="bk-book-bar bar-in fixed left-0 right-0 z-[45] px-3">
        <div className="max-w-lg mx-auto">
          {error && <p className="enter-fade mb-2 text-xs font-semibold text-center px-3 py-2 rounded-xl" style={{ background: "#fdf1d6", color: "#8a2a4d" }}>{error}</p>}
          <div className="flex items-center gap-3 pl-5 pr-2 py-2 rounded-full" style={{ background: PLUM, boxShadow: "0 12px 28px -6px rgba(61,20,38,0.45)" }}>
            <div className="min-w-0 flex-1 text-white">
              <p className="leading-tight">
                <b className="text-lg" style={H}>{price}</b>
                {was && <span className="ml-1 text-xs line-through opacity-60">{was}</span>}
              </p>
              <p className="text-[11px] truncate" style={{ color: "rgba(251,240,217,0.8)" }}>{summary}</p>
            </div>
            <button
              type="button"
              onClick={onBook}
              disabled={!ready || busy}
              className="motion-select shrink-0 inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-sm font-bold tap-scale"
              style={{ background: ready ? YELLOW : "rgba(249,221,138,0.35)", color: INK, ...H }}
            >
              {busy ? <><Loader2 size={15} className="animate-spin" /> Booking…</> : missing ?? <>{cta} <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Bottom padding so the last card clears the sticky bar and the bottom menu. */
export const PAGE_BOTTOM_PAD = "pb-[calc(env(safe-area-inset-bottom)+190px)] lg:pb-28";

/** Loads ranked pros for a service at a time (India-time wall clock). */
export function usePros<T extends Pro>(service: "WALKING" | "GROOMING" | "TRAINING", startStr: string | null) {
  const [pros, setPros] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!startStr) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/providers?${new URLSearchParams({ service, startTime: startStr })}`)
      .then((r) => r.json())
      .then((data: T[]) => !cancelled && setPros(Array.isArray(data) ? data : []))
      .catch(() => !cancelled && setPros([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [service, startStr]);
  return { pros, loading };
}
