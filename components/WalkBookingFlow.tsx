"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import {
  PLUM, INK, YELLOW, MUTED, H, BookingHero, PetPicker, DayTimePicker, ProPicker, MeetingPoint, BookBar, Section,
  PAGE_BOTTOM_PAD, buildDays, periodsFor, slotDate, wallClock, dayLabel, dayFullyBooked, orderPros, trackCampaignClick,
  usePros, LEAD_MINUTES, type Pet, type Pro, type Slot,
} from "@/components/booking/parts";

/*
 * One-screen walk booking: dog → length → day & time → walker (best available
 * by default) → meeting point, with the price and Book button in a sticky bar.
 * Built from the shared booking parts, like grooming and training.
 *
 * Prices must match /api/cart/service (base tiers, 10% first-walk discount
 * rounded to whole rupees). Times are sent as India-time wall clock strings
 * and parsed server-side by lib/istTime.
 */

const WALK_PRICING_PAISE: Record<30 | 45 | 60, number> = { 30: 30000, 45: 32500, 60: 35000 };
const LENGTHS: { min: 30 | 45 | 60; name: string; blurb: string }[] = [
  { min: 30, name: "Standard", blurb: "Neighbourhood stroll" },
  { min: 45, name: "Extended", blurb: "More time to sniff" },
  { min: 60, name: "Marathon", blurb: "Full workout" },
];
const walkPrice = (min: 30 | 45 | 60, firstWalk: boolean) =>
  firstWalk ? Math.round((WALK_PRICING_PAISE[min] * 0.9) / 100) : WALK_PRICING_PAISE[min] / 100;

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
  const periods = useMemo(() => periodsFor("walk"), []);
  const days = useMemo(() => buildDays(), []);

  const [petId, setPetId] = useState<string | null>(activePetId ?? pets[0]?.id ?? null);
  const [minutes, setMinutes] = useState<30 | 45 | 60>(30);
  const [dayIso, setDayIso] = useState(days[0].iso);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);

  // Today with every slot gone: start on tomorrow.
  useEffect(() => {
    if (dayFullyBooked(days[0], periods)) setDayIso(days[1].iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pet = pets.find((p) => p.id === petId) ?? null;
  const day = days.find((d) => d.iso === dayIso)!;
  const start = slot ? slotDate(day, slot) : null;
  const startStr = start ? wallClock(start) : null;
  const endStr = start ? wallClock(new Date(start.getTime() + minutes * 60_000)) : null;

  const { pros, loading } = usePros<Pro>("WALKING", startStr);
  const ordered = useMemo(() => orderPros(pros ?? []), [pros]);
  const best = ordered.find((p) => p.availableAtRequestedTime !== false) ?? null;
  const chosen = pickedId ? ordered.find((p) => p.id === pickedId) ?? null : best;
  useEffect(() => {
    if (pickedId && !ordered.some((p) => p.id === pickedId)) setPickedId(null);
  }, [ordered, pickedId]);

  const price = walkPrice(minutes, isFirstWalk);
  const hasContact = !!(address && phone);
  const ready = !!(pet && startStr && endStr && chosen && hasContact);
  const missing = !pet ? "Add your dog" : !slot ? "Pick a time" : loading ? "Finding walkers…" : !chosen ? "No walker free" : !hasContact ? "Add your address" : null;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const book = async () => {
    if (!ready || !chosen || !pet || !startStr || !endStr) return;
    if (start && start.getTime() < Date.now() + LEAD_MINUTES * 60_000) {
      setError("That time is too soon now. Please pick a later slot.");
      setSlot(null);
      return;
    }
    setBusy(true);
    setError(null);
    trackCampaignClick(chosen.activeCampaignId);
    const result = await addService({
      serviceType: "WALKING",
      providerId: chosen.id,
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
    setBusy(false);
    if (result === "error") setError("Couldn't book that walk. The time may be too soon. Please try another slot.");
  };

  return (
    <div className={PAGE_BOTTOM_PAD}>
      <BookingHero
        eyebrow={isFirstWalk ? "10% off your first walk" : null}
        title={`Happy walks for ${pet?.name ?? "your dog"}`}
        line={
          <>
            From <b style={{ color: YELLOW }}>₹{walkPrice(30, isFirstWalk)}</b>
            {isFirstWalk && <span className="line-through ml-1 opacity-70">₹300</span>} · 30 to 60 minutes · 6 AM to 7:30 PM
          </>
        }
        img="/images/tab-walking.jpg"
        imgAlt="A dog out on a leash walk"
        imgPosition="center 75%"
      />

      <div className="px-4 space-y-3.5">
        <PetPicker n={1} title="Who's going for a walk?" pets={pets} petId={petId} onChange={setPetId} />

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
                  className="motion-select rounded-2xl px-2 py-3 text-center tap-scale"
                  style={{ background: on ? PLUM : "#fffaf0", border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.12)"}`, color: on ? "white" : INK }}
                >
                  <span className="block text-[22px] font-bold leading-none" style={H}>{l.min}</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ opacity: 0.8 }}>min</span>
                  <span className="block text-xs font-bold mt-2" style={H}>{l.name}</span>
                  <span className="motion-select block text-sm font-bold mt-1" style={{ ...H, color: on ? YELLOW : PLUM }}>₹{walkPrice(l.min, isFirstWalk)}</span>
                  {isFirstWalk && <span className="block text-[10px] line-through" style={{ opacity: 0.6 }}>₹{WALK_PRICING_PAISE[l.min] / 100}</span>}
                </button>
              );
            })}
          </div>
          <p key={minutes} className="enter-fade text-[11px] mt-2 text-center" style={{ color: MUTED }}>
            {LENGTHS.find((l) => l.min === minutes)!.blurb}
          </p>
        </Section>

        <DayTimePicker n={3} days={days} periods={periods} dayIso={dayIso} onDay={setDayIso} slot={slot} onSlot={setSlot} />

        <ProPicker n={4} title="Your walker" noun="walker" slotLabel={slot?.label ?? null} loading={loading} pros={ordered} pickedId={pickedId} onPick={setPickedId} />

        <MeetingPoint n={5} title="Meeting point" noun="walker" address={address} phone={phone} />

        <p className="text-center text-[11px] px-6" style={{ color: MUTED }}>
          You&rsquo;ll review and pay on the next screen. Cancel any time before the walk for a full refund.
        </p>
      </div>

      <BookBar
        price={`₹${price}`}
        was={isFirstWalk ? `₹${WALK_PRICING_PAISE[minutes] / 100}` : null}
        summary={start ? `${minutes} min · ${dayLabel(day)}, ${slot!.label}` : `${minutes}-minute walk`}
        ready={ready}
        missing={missing}
        busy={busy}
        onBook={book}
        error={error}
        cta="Book walk"
      />
    </div>
  );
}
