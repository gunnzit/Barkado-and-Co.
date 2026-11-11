"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus, Plus, Trash2, PawPrint, Scissors, GraduationCap, Home as HomeIcon,
  Tag, Sparkles, MessageSquare, CheckCircle2, Pencil, ShieldCheck, Lock,
  CalendarClock, AlertTriangle, MapPin, Phone, ShoppingBag, Loader2, Check, ChevronRight,
} from "lucide-react";
import { useCart, type CartItem } from "@/components/CartProvider";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";
import EditDetailsSheet from "@/components/EditDetailsSheet";
import FreeDeliveryBar from "@/components/FreeDeliveryBar";
import MonogramMark from "@/components/MonogramMark";
import { computeServiceCommission } from "@/lib/commission";
import { computeCartTotals, WELCOME10_CODE } from "@/lib/checkoutPricing";
import { isTooSoon } from "@/lib/istTime";

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const MUTED = "#5e4752";
const YELLOW = "#f9dd8a";
const H = { fontFamily: "var(--font-heading)" } as const;
const CARD = { background: "#ffffff", border: "1px solid rgba(61,20,38,0.08)", boxShadow: "0 8px 24px -6px rgba(61,20,38,0.07)" } as const;

type ServiceType = NonNullable<CartItem["serviceType"]>;
const SERVICE: Record<ServiceType, { label: string; icon: typeof PawPrint; href: string }> = {
  WALKING: { label: "Walk", icon: PawPrint, href: "/walk-booking" },
  GROOMING: { label: "Grooming", icon: Scissors, href: "/grooming" },
  TRAINING: { label: "Training session", icon: GraduationCap, href: "/training" },
  SITTING: { label: "Home stay", icon: HomeIcon, href: "/" },
};

const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

function whenLabel(startIso: string | null, endIso: string | null) {
  if (!startIso) return null;
  const start = new Date(startIso);
  const opts = { timeZone: "Asia/Kolkata" } as const;
  const day = start.toLocaleDateString("en-IN", { ...opts, weekday: "short", day: "numeric", month: "short" });
  const time = start.toLocaleTimeString("en-IN", { ...opts, hour: "numeric", minute: "2-digit" });
  const mins = endIso ? Math.round((new Date(endIso).getTime() - start.getTime()) / 60000) : 0;
  const length = mins >= 60 ? `${mins / 60 === Math.floor(mins / 60) ? mins / 60 : (mins / 60).toFixed(1)} hr` : mins > 0 ? `${mins} min` : null;
  return { day, time, length };
}

type SuggestedProduct = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrls: string[];
  colorOptions: string[];
  sizeOptions: string[];
};

type Details = { name: string; phone: string | null; address: string | null };

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2.5">
      <h2 className="font-bold text-[16px]" style={{ ...H, color: PLUM }}>{children}</h2>
      {action}
    </div>
  );
}

export default function CartItemsList({
  petName,
  suggested,
  details,
}: {
  petName?: string | null;
  suggested?: SuggestedProduct[];
  details: Details | null;
}) {
  const router = useRouter();
  const { items, quantities, setQuantity, removeItem, ready } = useCart();

  const serviceItems = items.filter((i) => i.kind === "SERVICE");
  const productItems = items.filter((i) => i.kind === "PRODUCT" && i.product);
  const hasProducts = productItems.length > 0;
  const hasServices = serviceItems.length > 0;

  // Re-check "too soon / passed" every minute while the cart is open.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const staleIds = useMemo(
    () => new Set(serviceItems.filter((i) => i.startTime && isTooSoon(new Date(i.startTime), now)).map((i) => i.id)),
    [serviceItems, now]
  );

  const productSubtotalPaise = productItems.reduce((sum, i) => sum + i.product!.price * i.quantity, 0);
  const productCompareSavingsPaise = productItems.reduce((sum, i) => {
    const was = i.product!.compareAtPrice;
    return was && was > i.product!.price ? sum + (was - i.product!.price) * i.quantity : sum;
  }, 0);
  const serviceBasePaise = serviceItems.reduce((sum, i) => sum + (i.priceAmount ?? 0), 0);
  const serviceSellingPaise = serviceItems.reduce((sum, i) => sum + computeServiceCommission(i.priceAmount ?? 0).sellingPricePaise, 0);
  const maintenanceFeePaise = serviceItems.reduce((sum, i) => sum + computeServiceCommission(i.priceAmount ?? 0).maintenanceFeePaise, 0);

  const [pawPointsBalance, setPawPointsBalance] = useState(0);
  useEffect(() => {
    fetch("/api/owner/pawpoints")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setPawPointsBalance(data.balance ?? 0))
      .catch(() => {});
  }, []);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // The only code we have takes 10% off shop items, so it can't apply to a
  // bookings-only cart; drop it if the last product leaves.
  useEffect(() => {
    if (!hasProducts && appliedCoupon) setAppliedCoupon(null);
  }, [hasProducts, appliedCoupon]);

  const applyCoupon = () => {
    setCouponError(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (code === WELCOME10_CODE) {
      setAppliedCoupon(WELCOME10_CODE);
      setCouponInput("");
    } else {
      setCouponError("That code isn't valid or has expired.");
    }
  };

  const totals = computeCartTotals({
    productSubtotalPaise,
    serviceSellingPaise,
    serviceBasePaise,
    maintenanceFeePaise,
    productCompareSavingsPaise,
    couponCode: appliedCoupon,
    redeemPoints: redeemPoints ? pawPointsBalance : 0,
    pawPointsBalance,
  });

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  };

  const rebook = (item: CartItem) =>
    run(item.id, async () => {
      await removeItem(item.id);
      router.push(SERVICE[item.serviceType ?? "WALKING"].href);
    });

  const quickAdd = (p: SuggestedProduct) =>
    run(p.id, async () => {
      await setQuantity(p.id, 1);
    });

  const missingDetails = hasProducts && (!details?.address?.trim() || !details?.phone?.trim());
  const blocker = staleIds.size > 0
    ? { label: "Pick a new time to pay", note: `${staleIds.size === 1 ? "A booking" : "Some bookings"} can't go ahead at the chosen time.` }
    : missingDetails
      ? { label: "Add delivery details to pay", note: "We need an address and a mobile number for delivery." }
      : null;

  const notesTitle = hasServices && hasProducts ? "Notes for your pro and rider" : hasServices ? "Notes for your pro" : "Delivery notes";

  /* ---------- Loading and empty ---------- */

  if (!ready && items.length === 0) {
    return (
      <div className="px-4 pt-3 space-y-3" aria-busy="true" aria-label="Loading your cart">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-[1.5rem] animate-pulse" style={{ background: "rgba(61,20,38,0.06)" }} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="enter-up px-6 pt-16 pb-24 text-center">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: PLUM }}>
          <MonogramMark className="w-11 h-11" color="#fbf0d9" title="" />
        </div>
        <p className="font-bold text-[22px] mb-1.5" style={{ ...H, color: PLUM }}>Nothing to fetch yet</p>
        <p className="text-sm mb-7" style={{ color: MUTED }}>
          Book a walk, grooming or training{petName ? ` for ${petName}` : ""}, or pick something from the shop.
        </p>
        <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
          <Link href="/walk-booking" className="tap-scale h-12 rounded-full flex items-center justify-center text-[15px] font-bold" style={{ ...H, background: PLUM, color: "white" }}>
            Book a walk
          </Link>
          <Link href="/accessories" className="tap-scale h-12 rounded-full flex items-center justify-center text-[15px] font-bold" style={{ ...H, background: "#ffffff", color: PLUM, border: "1px solid rgba(61,20,38,0.14)" }}>
            Visit the shop
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Cart ---------- */

  return (
    <div className="px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+128px)] space-y-6">
      {hasServices && (
        <section>
          <SectionTitle>Your bookings</SectionTitle>
          <div className="space-y-3">
            {serviceItems.map((item, i) => {
              const meta = SERVICE[item.serviceType ?? "WALKING"];
              const Icon = meta.icon;
              const when = whenLabel(item.startTime, item.endTime);
              const stale = staleIds.has(item.id);
              const price = computeServiceCommission(item.priceAmount ?? 0).sellingPricePaise;
              return (
                <article key={item.id} data-stale={stale || undefined} className="enter-up rounded-[1.5rem] p-4" style={{ ["--d" as string]: `${i * 50}ms`, ...CARD, border: stale ? "1.5px solid #c2410c" : CARD.border }}>
                  <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: PLUM }}>
                      <Icon size={19} color={YELLOW} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[15px] leading-tight" style={{ ...H, color: INK }}>
                          {meta.label}
                          {when?.length && <span className="font-semibold" style={{ color: MUTED }}> · {when.length}</span>}
                        </p>
                        <p className="font-bold text-[15px] shrink-0" style={{ ...H, color: INK }}>{rupees(price)}</p>
                      </div>
                      <p className="text-xs mt-1 truncate" style={{ color: MUTED }}>
                        {item.pet?.name ? `For ${item.pet.name}` : "For your dog"} · with {item.provider?.user.name ?? "your pro"}
                      </p>
                      {item.address && (
                        <p className="text-xs mt-0.5 truncate flex items-center gap-1" style={{ color: MUTED }}>
                          <MapPin size={11} className="shrink-0" /> {item.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3.5">
                    {when && (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={stale ? { background: "#fde7dc", color: "#9a3412", textDecoration: "line-through" } : { background: YELLOW, color: INK }}
                      >
                        <CalendarClock size={13} /> {when.day} · {when.time}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => run(item.id, () => removeItem(item.id))}
                      aria-label={`Remove ${meta.label.toLowerCase()} booking`}
                      className="tap-scale w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.1)" }}
                    >
                      {busyId === item.id ? <Loader2 size={14} className="animate-spin" color={MUTED} /> : <Trash2 size={14} color={MUTED} />}
                    </button>
                  </div>

                  {stale && (
                    <div className="enter-fade mt-3 rounded-2xl p-3 flex items-center gap-3" style={{ background: "#fdf1e8" }}>
                      <AlertTriangle size={16} color="#c2410c" className="shrink-0" />
                      <p className="text-xs flex-1" style={{ color: "#7c2d12" }}>This time has passed or is too soon for your pro to reach you.</p>
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => rebook(item)}
                        className="tap-scale shrink-0 px-3.5 h-9 rounded-full text-xs font-bold"
                        style={{ background: PLUM, color: "white" }}
                      >
                        Pick a new time
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {hasProducts && (
        <section>
          <SectionTitle>From the shop</SectionTitle>
          <div className="mb-3"><FreeDeliveryBar /></div>
          <div className="rounded-[1.5rem] px-4 divide-y" style={{ ...CARD, borderColor: "rgba(61,20,38,0.08)" }}>
            {productItems.map((item, i) => {
              const p = item.product!;
              const img = p.imageUrls?.[0];
              const options = [item.selectedColor, item.selectedSize].filter(Boolean).join(" · ");
              return (
                <div key={item.id} className="enter-up flex items-center gap-3 py-3.5" style={{ ["--d" as string]: `${i * 40}ms`, borderColor: "rgba(61,20,38,0.07)" }}>
                  <Link href={`/accessories/${p.id}`} className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#fef3dc" }}>
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <ShoppingBag size={22} color="rgba(110,30,59,0.35)" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/accessories/${p.id}`} className="block font-bold text-sm leading-snug line-clamp-2" style={{ ...H, color: INK }}>{p.name}</Link>
                    {options && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{options}</p>}
                    <p className="text-sm font-bold mt-1" style={{ ...H, color: INK }}>
                      {rupees(p.price * item.quantity)}
                      {item.quantity > 1 && <span className="text-[11px] font-semibold ml-1.5" style={{ color: MUTED }}>{rupees(p.price)} each</span>}
                    </p>
                  </div>
                  <div className="flex items-center rounded-full shrink-0" style={{ background: "#fef3dc" }}>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => run(item.id, () => setQuantity(item.productId!, item.quantity - 1))}
                      className="tap-scale w-9 h-9 rounded-full flex items-center justify-center"
                      aria-label={item.quantity === 1 ? `Remove ${p.name}` : `One less ${p.name}`}
                    >
                      {item.quantity === 1 ? <Trash2 size={14} color={PLUM} /> : <Minus size={15} color={PLUM} />}
                    </button>
                    <span className="w-6 text-center text-sm font-bold num-roll" key={item.quantity} style={{ color: INK }} aria-live="polite">
                      {busyId === item.id ? <Loader2 size={13} className="animate-spin inline" /> : item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => run(item.id, () => setQuantity(item.productId!, item.quantity + 1))}
                      className="tap-scale w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: PLUM }}
                      aria-label={`One more ${p.name}`}
                    >
                      <Plus size={15} color="white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-[1.5rem] p-4 flex items-start gap-3" style={{ ...CARD, border: missingDetails ? "1.5px solid #c2410c" : CARD.border }}>
            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef3dc" }}>
              <MapPin size={17} color={PLUM} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Deliver to</p>
              {details?.address ? (
                <p className="text-sm mt-0.5 line-clamp-2" style={{ color: INK }}>{details.address}</p>
              ) : (
                <p className="text-sm mt-0.5 font-semibold" style={{ color: "#9a3412" }}>Add your delivery address</p>
              )}
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: details?.phone ? MUTED : "#9a3412" }}>
                <Phone size={11} /> {details?.phone ?? "Add a mobile number for the rider"}
              </p>
            </div>
            <button type="button" onClick={() => setDetailsOpen(true)} className="tap-scale shrink-0 inline-flex items-center gap-1 px-3 h-9 rounded-full text-xs font-bold" style={{ background: missingDetails ? PLUM : "#fffaf0", color: missingDetails ? "white" : PLUM, border: missingDetails ? "none" : "1px solid rgba(61,20,38,0.12)" }}>
              {missingDetails ? "Add" : <><Pencil size={11} /> Edit</>}
            </button>
          </div>
        </section>
      )}

      {suggested && suggested.length > 0 && (
        <section>
          <SectionTitle>{petName ? `${petName} might also like` : "You might also like"}</SectionTitle>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x" style={{ scrollbarWidth: "none" }}>
            {suggested.slice(0, 6).map((p) => {
              const needsChoice = p.colorOptions.length > 0 || p.sizeOptions.length > 0;
              const added = (quantities[p.id] ?? 0) > 0;
              return (
                <div key={p.id} className="hover-lift shrink-0 snap-start rounded-[1.25rem] p-2.5 flex flex-col" style={{ width: 144, ...CARD }}>
                  <Link href={`/accessories/${p.id}`} className="block w-full aspect-square rounded-2xl overflow-hidden mb-2 flex items-center justify-center" style={{ background: "#fef3dc" }}>
                    {p.imageUrls[0] ? (
                      <img src={p.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MonogramMark className="w-10 h-10 opacity-40" color={PLUM} title="" />
                    )}
                  </Link>
                  <Link href={`/accessories/${p.id}`} className="text-xs font-bold line-clamp-2 leading-snug min-h-[2.2em]" style={{ ...H, color: INK }}>{p.name}</Link>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-[13px] font-bold" style={{ ...H, color: INK }}>{rupees(p.price)}</span>
                    {needsChoice ? (
                      <Link href={`/accessories/${p.id}`} className="tap-scale inline-flex items-center gap-0.5 px-2.5 h-8 rounded-full text-[11px] font-bold" style={{ background: "#fef3dc", color: PLUM }}>
                        Choose <ChevronRight size={12} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId !== null || added}
                        onClick={() => quickAdd(p)}
                        aria-label={added ? `${p.name} added` : `Add ${p.name}`}
                        className="motion-select tap-scale inline-flex items-center gap-1 px-2.5 h-8 rounded-full text-[11px] font-bold"
                        style={{ background: added ? YELLOW : PLUM, color: added ? INK : "white" }}
                      >
                        {busyId === p.id ? <Loader2 size={12} className="animate-spin" /> : added ? <><Check size={12} className="enter-pop" /> Added</> : <><Plus size={12} /> Add</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        {pawPointsBalance > 0 && (
          <div className="rounded-[1.5rem] p-4 flex items-center gap-3" style={CARD}>
            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: YELLOW }}>
              <PawPrint size={17} color={PLUM} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm" style={{ ...H, color: INK }}>Use PawPoints</p>
              <p className="text-xs" style={{ color: MUTED }}>
                {redeemPoints && totals.actualPointsSpent > 0
                  ? `${totals.actualPointsSpent.toLocaleString("en-IN")} points · ${rupees(totals.pointsDiscountPaise)} off`
                  : `${pawPointsBalance.toLocaleString("en-IN")} points available`}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={redeemPoints}
              aria-label="Use PawPoints"
              onClick={() => setRedeemPoints(!redeemPoints)}
              className="w-12 h-7 rounded-full relative shrink-0"
              style={{ background: redeemPoints ? PLUM : "rgba(61,20,38,0.15)", transition: "background-color 200ms ease" }}
            >
              <span
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white"
                style={{ transform: `translateX(${redeemPoints ? 20 : 0}px)`, transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
              />
            </button>
          </div>
        )}

        {hasProducts && (
          <div className="rounded-[1.5rem] p-4" style={CARD}>
            <p className="flex items-center gap-1.5 font-bold text-sm mb-2.5" style={{ ...H, color: INK }}>
              <Tag size={14} color={PLUM} /> Coupon
            </p>
            {appliedCoupon ? (
              <div className="enter-pop flex items-center justify-between px-3.5 h-11 rounded-2xl" style={{ background: "#e6edf8" }}>
                <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: INK }}>
                  <CheckCircle2 size={15} color={PLUM} /> {appliedCoupon} · {rupees(totals.couponDiscountPaise)} off
                </span>
                <button type="button" onClick={() => setAppliedCoupon(null)} className="text-xs font-bold underline underline-offset-2" style={{ color: PLUM }}>Remove</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    placeholder="Enter coupon code"
                    aria-label="Coupon code"
                    autoCapitalize="characters"
                    className="flex-1 min-w-0 h-11 px-4 rounded-2xl text-sm outline-none uppercase placeholder:normal-case"
                    style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.12)", color: INK }}
                  />
                  <button type="button" onClick={applyCoupon} disabled={!couponInput.trim()} className="tap-scale px-5 h-11 rounded-full text-sm font-bold" style={{ ...H, background: PLUM, color: "white", opacity: couponInput.trim() ? 1 : 0.5 }}>
                    Apply
                  </button>
                </div>
                {couponError && <p className="enter-fade text-xs font-semibold mt-2" style={{ color: "#9a3412" }}>{couponError}</p>}
                <p className="text-[11px] mt-2" style={{ color: MUTED }}>Coupons apply to shop items.</p>
              </>
            )}
          </div>
        )}

        <div className="rounded-[1.5rem] p-4" style={CARD}>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 font-bold text-sm" style={{ ...H, color: INK }}>
              <MessageSquare size={14} color={PLUM} /> {notesTitle}
            </p>
            {!editingNotes && (
              <button type="button" onClick={() => setEditingNotes(true)} className="text-xs font-bold inline-flex items-center gap-1" style={{ color: PLUM }}>
                {notes || gateCode ? <><Pencil size={11} /> Edit</> : <><Plus size={12} /> Add</>}
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="enter-fade mt-3 space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={hasServices ? "e.g. She pulls near other dogs, treats are by the door" : "e.g. Leave with the guard if I'm out"}
                rows={2}
                aria-label={notesTitle}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.12)", color: INK }}
              />
              <input
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
                placeholder="Gate or building code (optional)"
                aria-label="Gate or building code"
                className="w-full h-11 px-4 rounded-2xl text-sm outline-none"
                style={{ background: "#fffaf0", border: "1px solid rgba(61,20,38,0.12)", color: INK }}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => setEditingNotes(false)} className="tap-scale px-5 h-9 rounded-full text-xs font-bold" style={{ background: PLUM, color: "white" }}>Done</button>
              </div>
            </div>
          ) : notes || gateCode ? (
            <p className="text-xs mt-2 whitespace-pre-line" style={{ color: MUTED }}>
              {notes}
              {notes && gateCode && "\n"}
              {gateCode && <>Gate code: <b style={{ color: INK }}>{gateCode}</b></>}
            </p>
          ) : (
            <p className="text-xs mt-1" style={{ color: MUTED }}>Anything that helps on the day. Optional.</p>
          )}
        </div>
      </section>

      <section id="bill">
        <SectionTitle>Bill</SectionTitle>
        <div className="rounded-[1.5rem] p-4 text-sm" style={CARD}>
          <dl className="space-y-2.5">
            {hasServices && (
              <div className="flex justify-between">
                <dt style={{ color: MUTED }}>{serviceItems.length === 1 ? "Booking" : `Bookings (${serviceItems.length})`}</dt>
                <dd className="font-semibold" style={{ color: INK }}>{rupees(serviceSellingPaise)}</dd>
              </div>
            )}
            {maintenanceFeePaise > 0 && (
              <div className="flex justify-between">
                <dt style={{ color: MUTED }}>Maintenance fee</dt>
                <dd className="font-semibold" style={{ color: INK }}>{rupees(maintenanceFeePaise)}</dd>
              </div>
            )}
            {hasProducts && (
              <div className="flex justify-between">
                <dt style={{ color: MUTED }}>Shop items ({productItems.reduce((n, i) => n + i.quantity, 0)})</dt>
                <dd className="font-semibold" style={{ color: INK }}>{rupees(productSubtotalPaise)}</dd>
              </div>
            )}
            {hasProducts && (
              <div className="flex justify-between">
                <dt style={{ color: MUTED }}>Delivery</dt>
                <dd className="font-semibold" style={{ color: totals.deliveryFeePaise > 0 ? INK : PLUM }}>{totals.deliveryFeePaise > 0 ? rupees(totals.deliveryFeePaise) : "Free"}</dd>
              </div>
            )}
            {totals.couponDiscountPaise > 0 && (
              <div className="flex justify-between" style={{ color: PLUM }}>
                <dt>Coupon {appliedCoupon}</dt>
                <dd className="font-semibold">−{rupees(totals.couponDiscountPaise)}</dd>
              </div>
            )}
            {totals.pointsDiscountPaise > 0 && (
              <div className="flex justify-between" style={{ color: PLUM }}>
                <dt>PawPoints</dt>
                <dd className="font-semibold">−{rupees(totals.pointsDiscountPaise)}</dd>
              </div>
            )}
          </dl>
          <div className="flex items-end justify-between pt-3 mt-3" style={{ borderTop: "1px dashed rgba(61,20,38,0.18)" }}>
            <div>
              <p className="font-bold text-[16px]" style={{ ...H, color: INK }}>To pay</p>
              <p className="text-[11px]" style={{ color: MUTED }}>Includes {rupees(totals.gstPaise)} GST</p>
            </div>
            <p className="font-bold text-[20px] num-roll" key={totals.grandTotalPaise} style={{ ...H, color: PLUM }}>{rupees(totals.grandTotalPaise)}</p>
          </div>
          {(totals.totalSavingsPaise > 0 || totals.estimatedPointsEarned > 0) && (
            <p className="mt-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5" style={{ background: "#fef3dc", color: PLUM }}>
              <Sparkles size={13} />
              {totals.totalSavingsPaise > 0 && `You save ${rupees(totals.totalSavingsPaise)}`}
              {totals.totalSavingsPaise > 0 && totals.estimatedPointsEarned > 0 && " · "}
              {totals.estimatedPointsEarned > 0 && `You'll earn ${totals.estimatedPointsEarned} PawPoints`}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-[11px]" style={{ color: MUTED }}>
          {hasServices && <span className="flex items-center gap-1"><ShieldCheck size={12} /> ID-verified pros</span>}
          <span className="flex items-center gap-1"><Lock size={12} /> Secure payment by Razorpay</span>
        </div>
      </section>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
        style={{ background: "rgba(251,240,217,0.92)", backdropFilter: "blur(16px) saturate(160%)", WebkitBackdropFilter: "blur(16px) saturate(160%)", borderTop: "1px solid rgba(61,20,38,0.08)" }}
      >
        <div className="max-w-lg mx-auto">
          {blocker && <p className="enter-fade text-[11px] font-semibold text-center mb-2" style={{ color: "#9a3412" }}>{blocker.note}</p>}
          <div className="flex items-center gap-3">
            <a href="#bill" className="shrink-0 pl-1">
              <p className="font-bold text-[19px] leading-none num-roll" key={totals.grandTotalPaise} style={{ ...H, color: INK }}>{rupees(totals.grandTotalPaise)}</p>
              <p className="text-[11px] font-bold mt-1 underline underline-offset-2" style={{ color: PLUM }}>View bill</p>
            </a>
            <div className="flex-1">
              {blocker ? (
                <button
                  type="button"
                  onClick={() => {
                    if (staleIds.size > 0) document.querySelector("[data-stale]")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    else setDetailsOpen(true);
                  }}
                  className="tap-scale w-full h-[52px] rounded-full text-[15px] font-bold"
                  style={{ ...H, background: PLUM, color: "white", opacity: 0.92 }}
                >
                  {blocker.label}
                </button>
              ) : (
                <RazorpayCheckoutButton
                  amountLabel={rupees(totals.grandTotalPaise)}
                  label={`Pay ${rupees(totals.grandTotalPaise)}`}
                  className="tap-scale w-full h-[52px] rounded-full text-[15px] font-bold flex items-center justify-center gap-2"
                  style={{ ...H, background: PLUM, color: YELLOW, boxShadow: "0 10px 24px -8px rgba(110,30,59,0.55)" }}
                  checkoutExtras={{
                    couponCode: appliedCoupon ?? undefined,
                    redeemPoints: totals.actualPointsSpent || undefined,
                    deliveryInstructions: notes.trim() || undefined,
                    gateCode: gateCode.trim() || undefined,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {details && (
        <EditDetailsSheet open={detailsOpen} onClose={() => setDetailsOpen(false)} initial={details} />
      )}
    </div>
  );
}
