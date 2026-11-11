"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  Pencil, Phone, MapPin, CalendarClock, Syringe, PawPrint, Plus, Calendar, Sparkles, Heart, Bell,
  ChevronRight, Hospital, CreditCard, LifeBuoy, LogOut, Check, AlertCircle, Briefcase, Loader2,
} from "lucide-react";
import EditDetailsSheet from "@/components/EditDetailsSheet";

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const YELLOW = "#f9dd8a";
const MUTED = "#5e4752";
const IVORY = "#fbf0d9";
const CARD = "0 8px 24px -4px rgba(61,20,38,0.06)";
const H = { fontFamily: "var(--font-heading)" } as const;
const SERVICE_NAME: Record<string, string> = { WALKING: "Walk", GROOMING: "Grooming", TRAINING: "Training", SITTING: "Sitting" };
const SUPPORT_PHONE_DISPLAY = "+91 99888 75745";
const SUPPORT_PHONE_TEL = "+919988875745";
const SUPPORT_EMAIL = "hello@barkadoandco.com";

export type ProfilePet = {
  id: string;
  name: string;
  breed: string | null;
  photoUrl: string | null;
  vaccine: "NONE" | "OK" | "DUE_SOON" | "OVERDUE";
  nextDue: { name: string; date: string } | null;
};
export type ProfileData = {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  pets: ProfilePet[];
  activePetId: string | null;
  upcoming: { type: string; startTime: string; status: string; providerName: string; petName: string } | null;
  counts: { bookings: number; activeBookings: number; wishlist: number; favorites: number; addresses: number };
  pawPoints: number;
  pawPointsValuePaise: number;
  vetName: string | null;
  vetEditHref: string;
};

const area = (address: string | null) => {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.find((p) => /\b(sector|phase|block|colony|nagar|vihar|enclave)\b/i.test(p)) ?? parts.slice(-2).join(", ");
};

const VAX_CHIP: Record<ProfilePet["vaccine"], { text: string; bg: string; fg: string }> = {
  NONE: { text: "No vaccines added", bg: "#fef3dc", fg: MUTED },
  OK: { text: "Vaccines up to date", bg: "#dbe5f3", fg: INK },
  DUE_SOON: { text: "Vaccine due soon", bg: YELLOW, fg: INK },
  OVERDUE: { text: "Vaccine overdue", bg: "#fdf1d6", fg: "#8a2a4d" },
};

function Row({ href, icon: Icon, title, sub, badge, external }: { href: string; icon: typeof Bell; title: string; sub: string; badge?: string | null; external?: boolean }) {
  const inner = (
    <>
      <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef3dc" }}>
        <Icon size={17} color={PLUM} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-sm" style={{ ...H, color: INK }}>{title}</span>
        <span className="block text-xs truncate" style={{ color: MUTED }}>{sub}</span>
      </span>
      {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: YELLOW, color: INK }}>{badge}</span>}
      <ChevronRight size={16} color={MUTED} className="shrink-0" />
    </>
  );
  const cls = "flex items-center gap-3 px-4 py-3 tap-scale";
  return external ? <a href={href} className={cls}>{inner}</a> : <Link href={href} className={cls}>{inner}</Link>;
}

export default function ProfileView({ data }: { data: ProfileData }) {
  const { user } = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const [switching, startSwitch] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Booking pages send customers here with ?edit=details&next=/walk-booking.
  const next = params.get("next");
  useEffect(() => {
    if (params.get("edit") === "details") setEditOpen(true);
  }, [params]);

  const missing = !data.phone || !data.address;
  const first = data.name.split(" ")[0];

  const switchPet = (id: string) => {
    setSwitchingId(id);
    startSwitch(async () => {
      await fetch("/api/active-pet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ petId: id }) });
      router.refresh();
      setSwitchingId(null);
    });
  };

  return (
    <div className="px-4 space-y-4">
      {/* ===== You ===== */}
      <section className="enter-up relative overflow-hidden rounded-[2rem] p-5 pb-9" style={{ background: PLUM, boxShadow: "0 12px 28px -6px rgba(110,30,59,0.22)" }}>
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "rgba(251,240,217,0.12)", boxShadow: `0 0 0 3px ${YELLOW}` }}>
            {user?.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-white" style={H}>{first[0]?.toUpperCase()}</span>}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-script text-[26px] leading-tight text-white truncate">Hi, {first}!</p>
            <p className="text-xs truncate" style={{ color: "rgba(251,240,217,0.75)" }}>{data.email}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5 text-sm" style={{ color: IVORY }}>
          <p className="flex items-center gap-2"><Phone size={14} color={YELLOW} /> {data.phone ? `+91 ${data.phone.replace(/^\+?91/, "")}` : <span style={{ opacity: 0.7 }}>No mobile number yet</span>}</p>
          <p className="flex items-center gap-2 min-w-0"><MapPin size={14} color={YELLOW} className="shrink-0" /> <span className="truncate">{data.address ? area(data.address) : <span style={{ opacity: 0.7 }}>No address yet</span>}</span></p>
        </div>
        <button type="button" onClick={() => setEditOpen(true)} className="tap-scale mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold" style={{ background: YELLOW, color: INK, ...H }}>
          <Pencil size={14} /> {missing ? "Add your details" : "Edit details"}
        </button>
        {missing && (
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(251,240,217,0.85)" }}>
            <AlertCircle size={12} /> Your mobile and address are needed to book a visit.
          </p>
        )}
        <span className="brand-wave" aria-hidden="true" />
      </section>

      {/* ===== Coming up ===== */}
      <section className="enter-up" style={{ ["--d" as string]: "60ms" }}>
        <h2 className="font-bold text-[18px] mb-2 px-1" style={{ ...H, color: PLUM }}>Coming up</h2>
        <div className="rounded-[1.75rem] overflow-hidden divide-y" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD, borderColor: "rgba(61,20,38,0.07)" }}>
          {data.upcoming ? (
            <Link href="/owner/bookings" className="flex items-center gap-3 p-4 tap-scale">
              <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: YELLOW }}><CalendarClock size={19} color={PLUM} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                  {data.upcoming.status === "IN_PROGRESS" ? "Happening now" : data.upcoming.status === "REQUESTED" ? "Waiting for confirmation" : "Confirmed"}
                </span>
                <span className="block font-bold text-[15px] truncate" style={{ ...H, color: INK }}>
                  {SERVICE_NAME[data.upcoming.type]} for {data.upcoming.petName} with {data.upcoming.providerName.split(" ")[0]}
                </span>
                <span className="block text-xs" style={{ color: MUTED }}>
                  {new Date(data.upcoming.startTime).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </span>
              </span>
              <ChevronRight size={16} color={MUTED} />
            </Link>
          ) : (
            <div className="flex items-center gap-3 p-4">
              <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef3dc" }}><Calendar size={19} color={PLUM} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-sm" style={{ ...H, color: INK }}>Nothing booked yet</span>
                <span className="block text-xs" style={{ color: MUTED }}>Walks, grooming and training at home</span>
              </span>
              <Link href="/walk-booking" className="tap-scale shrink-0 px-4 py-2 rounded-full text-xs font-bold" style={{ background: PLUM, color: "white", ...H }}>Book a walk</Link>
            </div>
          )}
          {data.pets.find((p) => p.id === data.activePetId)?.nextDue && (() => {
            const p = data.pets.find((x) => x.id === data.activePetId)!;
            const due = new Date(p.nextDue!.date);
            const overdue = due.getTime() < Date.now();
            return (
              <Link href={`/owner/pets/${p.id}`} className="flex items-center gap-3 p-4 tap-scale">
                <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: overdue ? "#fdf1d6" : "#dbe5f3" }}><Syringe size={18} color={PLUM} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm" style={{ ...H, color: INK }}>{p.name}&rsquo;s {p.nextDue!.name}</span>
                  <span className="block text-xs" style={{ color: overdue ? "#8a2a4d" : MUTED }}>
                    {overdue ? "Overdue since" : "Due"} {due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </span>
                <ChevronRight size={16} color={MUTED} />
              </Link>
            );
          })()}
        </div>
      </section>

      {/* ===== Your dogs ===== */}
      <section className="enter-up" style={{ ["--d" as string]: "120ms" }}>
        <div className="flex items-end justify-between mb-2 px-1">
          <h2 className="font-bold text-[18px]" style={{ ...H, color: PLUM }}>Your dogs</h2>
          <Link href="/owner/pets" className="text-xs font-bold underline underline-offset-2" style={{ color: PLUM }}>Manage</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {data.pets.map((p) => {
            const active = p.id === data.activePetId;
            const chip = VAX_CHIP[p.vaccine];
            return (
              <div key={p.id} className="motion-select shrink-0 w-[168px] rounded-[1.5rem] p-3" style={{ background: "#ffffff", border: `1.5px solid ${active ? PLUM : "rgba(61,20,38,0.07)"}`, boxShadow: CARD }}>
                <Link href={`/owner/pets/${p.id}`} className="block tap-scale">
                  <span className="relative block w-full aspect-square rounded-[1.1rem] overflow-hidden" style={{ background: "#fef3dc" }}>
                    {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center"><PawPrint size={30} color={PLUM} /></span>}
                    {active && <span className="enter-pop absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: YELLOW, color: INK }}><Check size={10} /> Active</span>}
                  </span>
                  <span className="block font-bold text-sm mt-2 truncate" style={{ ...H, color: INK }}>{p.name}</span>
                  <span className="block text-[11px] truncate" style={{ color: MUTED }}>{p.breed ?? "Mixed breed"}</span>
                  <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: chip.bg, color: chip.fg }}>{chip.text}</span>
                </Link>
                {!active && (
                  <button type="button" disabled={switching} onClick={() => switchPet(p.id)} className="tap-scale mt-2 w-full h-8 rounded-full text-[11px] font-bold inline-flex items-center justify-center gap-1" style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.12)", color: PLUM }}>
                    {switchingId === p.id ? <Loader2 size={12} className="animate-spin" /> : null} Make active
                  </button>
                )}
              </div>
            );
          })}
          <Link href="/owner/pets/new" className="hover-lift shrink-0 w-[140px] rounded-[1.5rem] flex flex-col items-center justify-center gap-2 tap-scale" style={{ border: "2px dashed rgba(61,20,38,0.2)", color: PLUM, minHeight: 200 }}>
            <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#fef3dc" }}><Plus size={20} /></span>
            <span className="text-sm font-bold" style={H}>Add a dog</span>
          </Link>
        </div>
      </section>

      {/* ===== Quick tiles ===== */}
      <section className="enter-up grid grid-cols-2 gap-3" style={{ ["--d" as string]: "180ms" }}>
        {[
          { href: "/owner/bookings", icon: Calendar, title: "Bookings", value: String(data.counts.bookings), sub: data.counts.activeBookings > 0 ? `${data.counts.activeBookings} active` : "History & receipts" },
          { href: "/owner/wallet", icon: Sparkles, title: "PawPoints", value: data.pawPoints.toLocaleString("en-IN"), sub: `= ₹${Math.floor(data.pawPointsValuePaise / 100)} off` },
          { href: "/owner/wishlist", icon: Heart, title: "Wishlist", value: String(data.counts.wishlist + data.counts.favorites), sub: `${data.counts.wishlist} products · ${data.counts.favorites} pros` },
          { href: "/owner/notifications", icon: Bell, title: "Alerts", value: "", sub: "Bookings, vaccines, offers" },
        ].map((t) => (
          <Link key={t.title} href={t.href} className="hover-lift tap-scale rounded-[1.5rem] p-4" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD }}>
            <span className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fef3dc" }}><t.icon size={16} color={PLUM} /></span>
              {t.value && <span className="text-[22px] font-bold leading-none" style={{ ...H, color: PLUM }}>{t.value}</span>}
            </span>
            <span className="block font-bold text-sm mt-3" style={{ ...H, color: INK }}>{t.title}</span>
            <span className="block text-[11px] truncate" style={{ color: MUTED }}>{t.sub}</span>
          </Link>
        ))}
      </section>

      {/* ===== Settings ===== */}
      <section className="enter-up" style={{ ["--d" as string]: "240ms" }}>
        <h2 className="font-bold text-[18px] mb-2 px-1" style={{ ...H, color: PLUM }}>Settings &amp; help</h2>
        <div className="rounded-[1.75rem] overflow-hidden divide-y" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD, borderColor: "rgba(61,20,38,0.07)" }}>
          <Row href="/owner/addresses" icon={MapPin} title="Saved addresses" sub={data.counts.addresses > 0 ? `${data.counts.addresses} saved` : data.address ? "1 in use · save more" : "Add where we should come"} />
          <Row href={data.vetEditHref} icon={Hospital} title="Emergency vet" sub={data.vetName ?? "Add your dog's vet for emergencies"} badge={data.vetName ? null : "Add"} />
          <Row href="/owner/notifications" icon={Bell} title="Notifications" sub="Choose what we send you" />
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef3dc" }}><CreditCard size={17} color={PLUM} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-sm" style={{ ...H, color: INK }}>Payments</span>
              <span className="block text-xs" style={{ color: MUTED }}>Paid securely through Razorpay. We never store your card.</span>
            </span>
          </div>
          <Row href={`tel:${SUPPORT_PHONE_TEL}`} external icon={LifeBuoy} title="Help & support" sub={`${SUPPORT_PHONE_DISPLAY} · ${SUPPORT_EMAIL}`} />
          <Row href="/provider" icon={Briefcase} title="Become a pro" sub="Walk, groom or train with Barkado" />
        </div>
      </section>

      <SignOutButton>
        <button type="button" className="enter-up tap-scale w-full h-12 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2" style={{ ["--d" as string]: "300ms", background: "#ffffff", border: "1.5px solid rgba(61,20,38,0.15)", color: PLUM }}>
          <LogOut size={15} /> Sign out
        </button>
      </SignOutButton>

      <p className="text-center text-[11px] pb-2" style={{ color: MUTED }}>
        <Link href="/legal/privacy" className="underline underline-offset-2">Privacy</Link> · <Link href="/legal/terms" className="underline underline-offset-2">Terms</Link> · <Link href="/legal/refund" className="underline underline-offset-2">Refunds</Link>
      </p>

      <EditDetailsSheet open={editOpen} onClose={() => setEditOpen(false)} initial={{ name: data.name, phone: data.phone, address: data.address }} next={next} />
    </div>
  );
}
