"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors, GraduationCap, Check } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import {
  PLUM, INK, MUTED, H, BookingHero, PetPicker, DayTimePicker, ProPicker, MeetingPoint, BookBar, Section, Radio,
  PAGE_BOTTOM_PAD, buildDays, periodsFor, slotDate, wallClock, dayLabel, dayFullyBooked, orderPros, trackCampaignClick,
  usePros, LEAD_MINUTES, type Pet, type Pro, type Slot,
} from "@/components/booking/parts";

/*
 * One-screen booking for at-home grooming and training — same design and
 * flow as walks (components/WalkBookingFlow.tsx).
 *
 * Grooming: pros price their own work. A groomer with packages gets a package
 * picker priced for the dog's size; otherwise the booking is their "Standard
 * groom" at their base rate (both handled in /api/cart/service).
 * Training: one 60-minute session at the trainer's rate. Multi-week plans need
 * recurring billing and aren't sold yet.
 */

type Service = "GROOMING" | "TRAINING";
const SESSION_MIN: Record<Service, number> = { GROOMING: 90, TRAINING: 60 };
const SIZE_LABEL: Record<string, string> = { SMALL: "small", MEDIUM: "medium", LARGE: "large", GIANT: "giant" };
const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

type Choice = { key: string; packageId: string | null; name: string; paise: number };

/** What this pro can do for this dog, with real prices. */
function choicesFor(service: Service, pro: Pro, petSize: string | null): Choice[] {
  if (service === "TRAINING") {
    return pro.pricePerTrain && pro.pricePerTrain > 0
      ? [{ key: "session", packageId: null, name: "60-minute training session", paise: pro.pricePerTrain }]
      : [];
  }
  const size = petSize ?? "MEDIUM";
  const pkgs: Choice[] = (pro.groomingPackages ?? [])
    .map((g) => ({ key: g.id, packageId: g.id, name: g.name, paise: Number((g.pricesBySize ?? {})[size]) }))
    .filter((c) => Number.isFinite(c.paise) && c.paise > 0);
  const standard: Choice[] = pro.pricePerGroom && pro.pricePerGroom > 0 ? [{ key: "standard", packageId: null, name: "Standard groom", paise: pro.pricePerGroom }] : [];
  // Packages first when they exist; the standard groom stays available only if the groomer has no packages for this size.
  return pkgs.length > 0 ? pkgs : standard;
}

export default function ProBookingFlow({
  service,
  pets,
  activePetId,
  address,
  phone,
  fromPaise,
}: {
  service: Service;
  pets: Pet[];
  activePetId: string | null;
  address: string | null;
  phone: string | null;
  fromPaise: number | null;
}) {
  const router = useRouter();
  const { refresh } = useCart();
  const grooming = service === "GROOMING";
  const noun = grooming ? "groomer" : "trainer";
  const periods = useMemo(() => periodsFor("visit"), []);
  const days = useMemo(() => buildDays(), []);

  const [petId, setPetId] = useState<string | null>(activePetId ?? pets[0]?.id ?? null);
  const [dayIso, setDayIso] = useState(days[0].iso);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [choiceKey, setChoiceKey] = useState<string | null>(null);

  useEffect(() => {
    if (dayFullyBooked(days[0], periods)) setDayIso(days[1].iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pet = pets.find((p) => p.id === petId) ?? null;
  const day = days.find((d) => d.iso === dayIso)!;
  const start = slot ? slotDate(day, slot) : null;
  const startStr = start ? wallClock(start) : null;
  const endStr = start ? wallClock(new Date(start.getTime() + SESSION_MIN[service] * 60_000)) : null;

  const { pros, loading } = usePros<Pro>(service, startStr);
  // Only pros this dog can actually be booked with (a real price for its size).
  const ordered = useMemo(
    () => orderPros((pros ?? []).filter((p) => choicesFor(service, p, pet?.size ?? null).length > 0)),
    [pros, service, pet?.size],
  );
  const best = ordered.find((p) => p.availableAtRequestedTime !== false) ?? null;
  const chosen = pickedId ? ordered.find((p) => p.id === pickedId) ?? null : best;
  useEffect(() => {
    if (pickedId && !ordered.some((p) => p.id === pickedId)) setPickedId(null);
  }, [ordered, pickedId]);

  const choices = chosen ? choicesFor(service, chosen, pet?.size ?? null) : [];
  const choice = choices.find((c) => c.key === choiceKey) ?? choices[0] ?? null;
  useEffect(() => {
    if (choiceKey && !choices.some((c) => c.key === choiceKey)) setChoiceKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen?.id, pet?.size]);

  const hasContact = !!(address && phone);
  const ready = !!(pet && startStr && endStr && chosen && choice && hasContact);
  const missing = !pet ? "Add your dog" : !slot ? "Pick a time" : loading ? `Finding ${noun}s…` : !chosen ? `No ${noun} free` : !hasContact ? "Add your address" : null;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const book = async () => {
    if (!ready || !chosen || !pet || !choice || !startStr || !endStr) return;
    if (start && start.getTime() < Date.now() + LEAD_MINUTES * 60_000) {
      setError("That time is too soon now. Please pick a later slot.");
      setSlot(null);
      return;
    }
    setBusy(true);
    setError(null);
    trackCampaignClick(chosen.activeCampaignId);
    const res = await fetch("/api/cart/service", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: service,
        providerId: chosen.id,
        petId: pet.id,
        startTime: startStr,
        endTime: endStr,
        address,
        phone,
        ...(grooming && choice.packageId ? { groomingPackageId: choice.packageId, groomingSize: pet.size ?? "MEDIUM" } : {}),
      }),
    });
    if (res.ok) {
      await refresh();
      router.push("/cart");
      return;
    }
    setBusy(false);
    if (res.status === 401) {
      router.push("/sign-in");
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(typeof body.error === "string" ? body.error : "Couldn't book that. Please try another time.");
  };

  const proPrice = (p: Pro) => {
    const c = choicesFor(service, p, pet?.size ?? null);
    if (c.length === 0) return null;
    const min = Math.min(...c.map((x) => x.paise));
    return c.length > 1 ? `from ${rupees(min)}` : rupees(min);
  };

  const summary = start
    ? `${choice?.name ?? (grooming ? "Grooming" : "Training")} · ${dayLabel(day)}, ${slot!.label}`
    : grooming ? "At-home grooming" : "60-minute session at home";
  const price = choice ? rupees(choice.paise) : fromPaise ? `from ${rupees(fromPaise)}` : "—";

  return (
    <div className={PAGE_BOTTOM_PAD}>
      <BookingHero
        eyebrow={grooming ? "A spa day fit for a tiara" : null}
        title={grooming ? `Spa day for ${pet?.name ?? "your dog"}` : `Good manners for ${pet?.name ?? "your dog"}`}
        line={
          <>
            {fromPaise ? <>From <b style={{ color: "#f9dd8a" }}>{rupees(fromPaise)}</b> · </> : null}
            {grooming ? "At-home grooming by ID-verified groomers" : "One-to-one sessions at your home"} · 8 AM to 7 PM
          </>
        }
        img={grooming ? "/images/brand/golden-bandana.jpg" : "/images/hero-dog-german-shepherd.jpg"}
        imgAlt={grooming ? "A freshly groomed golden retriever" : "An alert German shepherd"}
        imgPosition={grooming ? "center 30%" : "center 35%"}
      />

      <div className="px-4 space-y-3.5">
        <PetPicker n={1} title={grooming ? "Who's getting pampered?" : "Who's training?"} pets={pets} petId={petId} onChange={setPetId} />

        <DayTimePicker n={2} days={days} periods={periods} dayIso={dayIso} onDay={setDayIso} slot={slot} onSlot={setSlot} />

        <ProPicker
          n={3}
          title={grooming ? "Your groomer" : "Your trainer"}
          noun={noun}
          slotLabel={slot?.label ?? null}
          loading={loading}
          pros={ordered}
          pickedId={pickedId}
          onPick={setPickedId}
          priceOf={proPrice}
        />

        {/* What's included — real options from the chosen pro */}
        <Section
          n={4}
          title={grooming ? "What's included?" : "About the session"}
          sub={grooming && pet?.size ? `Priced for ${pet.name}'s size (${SIZE_LABEL[pet.size] ?? "medium"})` : undefined}
        >
          {!chosen ? (
            <p className="text-xs p-3 rounded-2xl" style={{ background: "#fffaf0", color: MUTED }}>
              Pick a time and {noun} to see prices.
            </p>
          ) : choices.length > 1 ? (
            <div className="space-y-2">
              {choices.map((c) => {
                const on = choice?.key === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setChoiceKey(c.key)}
                    aria-pressed={on}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left tap-scale"
                    style={{ background: on ? "#fef3dc" : "#ffffff", border: `1.5px solid ${on ? PLUM : "rgba(61,20,38,0.1)"}` }}
                  >
                    <Radio on={on} />
                    <span className="flex-1 min-w-0 font-bold text-sm truncate" style={{ ...H, color: INK }}>{c.name}</span>
                    <span className="font-bold text-sm shrink-0" style={{ ...H, color: PLUM }}>{rupees(c.paise)}</span>
                  </button>
                );
              })}
            </div>
          ) : choice ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#fef3dc" }}>
              <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#ffffff" }}>
                {grooming ? <Scissors size={17} color={PLUM} /> : <GraduationCap size={17} color={PLUM} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-sm" style={{ ...H, color: INK }}>{choice.name}</span>
                <span className="block text-xs" style={{ color: MUTED }}>
                  {grooming
                    ? `With ${chosen.user.name.split(" ")[0]}, at your home · about ${SESSION_MIN.GROOMING} minutes`
                    : `One-to-one with ${chosen.user.name.split(" ")[0]}, at your home`}
                </span>
              </span>
              <span className="font-bold text-sm shrink-0" style={{ ...H, color: PLUM }}>{rupees(choice.paise)}</span>
            </div>
          ) : null}
          {chosen && (
            <p className="flex items-center gap-1.5 text-[11px] mt-2.5" style={{ color: MUTED }}>
              <Check size={12} color={PLUM} /> Price set by your {noun}. You&rsquo;ll see the total before paying.
            </p>
          )}
        </Section>

        <MeetingPoint n={5} title="Where?" noun={noun} address={address} phone={phone} />

        <p className="text-center text-[11px] px-6" style={{ color: MUTED }}>
          You&rsquo;ll review and pay on the next screen. Cancel any time before the {grooming ? "appointment" : "session"} for a full refund.
        </p>
      </div>

      <BookBar
        price={price}
        summary={summary}
        ready={ready}
        missing={missing}
        busy={busy}
        onBook={book}
        error={error}
        cta={grooming ? "Book grooming" : "Book session"}
      />
    </div>
  );
}
