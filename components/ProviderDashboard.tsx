"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu, PawPrint, Scissors, GraduationCap, Home as HomeIcon, Clock, MapPin, Phone, Check, X,
  Navigation, IndianRupee, ChevronRight, Inbox, Calendar, History as HistoryIcon, Wallet, Settings, ShieldCheck, Star,
} from "lucide-react";
import ProviderAvailabilityEditor from "@/components/ProviderAvailabilityEditor";
import ProviderServicesEditor from "@/components/ProviderServicesEditor";
import ProviderEarningsPanel from "@/components/ProviderEarningsPanel";
import ProviderVerificationUpload from "@/components/ProviderVerificationUpload";
import NavDrawer from "@/components/NavDrawer";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};

const SERVICE_ICON: Record<string, any> = {
  WALKING: PawPrint,
  SITTING: HomeIcon,
  GROOMING: Scissors,
  TRAINING: GraduationCap,
};

export type ProviderBooking = {
  id: string;
  type: "WALKING" | "SITTING" | "GROOMING" | "TRAINING";
  status: string;
  startTime: string;
  endTime: string;
  priceAmount: number;
  address: string | null;
  phone: string | null;
  pet: { name: string };
  owner: { name: string; ratingAvg?: number; ratingCount?: number };
  ownerReview?: { rating: number } | null;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function BookingCard({ booking, children }: { booking: ProviderBooking; children?: React.ReactNode }) {
  const Icon = SERVICE_ICON[booking.type];
  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
          <Icon size={18} color="var(--terracotta)" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{SERVICE_LABEL[booking.type]}</p>
          <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            For {booking.pet.name} · owner {booking.owner.name}
            {booking.owner.ratingCount != null && booking.owner.ratingCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Star size={10} fill="var(--gold)" color="var(--gold)" /> {booking.owner.ratingAvg?.toFixed(1)}
              </span>
            )}
          </p>
        </div>
        <span className="font-bold text-sm shrink-0">₹{(booking.priceAmount / 100).toFixed(0)}</span>
      </div>
      <div className="space-y-1 mb-3">
        <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
          <Clock size={12} /> {formatWhen(booking.startTime)}
        </p>
        {booking.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1.5 tap-scale"
            style={{ color: "var(--terracotta)" }}
          >
            <Navigation size={12} /> {booking.address}
          </a>
        )}
        {booking.phone && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Phone size={12} /> {booking.phone}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function WalkReportForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [distanceKm, setDistanceKm] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    await fetch(`/api/bookings/${bookingId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
        notes: notes || undefined,
      }),
    });
    setSubmitting(false);
    onDone();
  };

  return (
    <div className="space-y-2 pt-3 mt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Distance (km)"
          className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs"
          style={{ borderColor: "var(--border)" }}
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
        />
        <input
          type="number"
          placeholder="Duration (min)"
          className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs"
          style={{ borderColor: "var(--border)" }}
          value={durationMin}
          onChange={(e) => setDurationMin(e.target.value)}
        />
      </div>
      <textarea
        placeholder="Notes for the owner (optional)"
        className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
        style={{ borderColor: "var(--border)" }}
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button onClick={submit} disabled={submitting} className="btn-primary w-full text-sm tap-scale" style={{ opacity: submitting ? 0.6 : 1 }}>
        {submitting ? "Submitting…" : "Submit report & complete"}
      </button>
    </div>
  );
}

function RateOwnerForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    await fetch(`/api/bookings/${bookingId}/owner-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || undefined }),
    });
    setSubmitting(false);
    onDone();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs tap-scale mt-2">
        Rate this owner
      </button>
    );
  }

  return (
    <div className="space-y-2 pt-3 mt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className="tap-scale" aria-label={`${n} stars`}>
            <Star size={20} fill={n <= rating ? "var(--gold)" : "none"} color="var(--gold)" />
          </button>
        ))}
      </div>
      <textarea
        placeholder="Optional comment"
        className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
        style={{ borderColor: "var(--border)" }}
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button onClick={submit} disabled={submitting || rating === 0} className="btn-primary w-full text-sm tap-scale" style={{ opacity: rating === 0 ? 0.5 : 1 }}>
        {submitting ? "Submitting…" : "Submit rating"}
      </button>
    </div>
  );
}

type Tab = "home" | "requests" | "schedule" | "history" | "earnings" | "services" | "hours" | "verification";

export default function ProviderDashboard({
  requests,
  schedule,
  history,
}: {
  requests: ProviderBooking[];
  schedule: ProviderBooking[];
  history: ProviderBooking[];
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportOpenFor, setReportOpenFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    router.refresh();
  };

  const tabs: { key: Tab; label: string; count: number; icon: any }[] = [
    { key: "home", label: "Home", count: 0, icon: HomeIcon },
    { key: "requests", label: "Requests", count: requests.length, icon: Inbox },
    { key: "schedule", label: "Schedule", count: schedule.length, icon: Calendar },
    { key: "history", label: "History", count: history.length, icon: HistoryIcon },
    { key: "earnings", label: "Earnings", count: 0, icon: Wallet },
    { key: "services", label: "Services", count: 0, icon: Settings },
    { key: "hours", label: "Hours", count: 0, icon: Clock },
    { key: "verification", label: "Verification", count: 0, icon: ShieldCheck },
  ];

  const goTo = (key: Tab) => {
    setTab(key);
    setDrawerOpen(false);
  };

  return (
    <div>
      <div className="px-6 mb-5">
        <button
          onClick={() => setDrawerOpen(true)}
          className="tap-scale flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Menu size={15} />
          {tabs.find((t) => t.key === tab)?.label}
        </button>
      </div>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Provider menu">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => goTo(t.key)}
              className="w-full flex items-center gap-3 px-4 py-3 tap-scale text-left"
              style={{ background: active ? "var(--cream)" : "transparent" }}
            >
              <Icon size={16} color={active ? "var(--terracotta)" : "var(--muted)"} />
              <span className="text-sm font-medium flex-1" style={{ color: active ? "var(--terracotta)" : "inherit" }}>{t.label}</span>
              {t.count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--terracotta)", color: "white" }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </NavDrawer>

      <div className="px-6 space-y-3">
        {tab === "home" && (() => {
          const todayStr = new Date().toDateString();
          const todaysCompleted = history.filter((b) => b.status === "COMPLETED" && new Date(b.startTime).toDateString() === todayStr);
          const todaysEarningsPaise = todaysCompleted.reduce((sum, b) => sum + b.priceAmount, 0);
          const todaysSchedule = schedule.filter((b) => new Date(b.startTime).toDateString() === todayStr);
          const offeredServices = Array.from(new Set([...requests, ...schedule, ...history].map((b) => b.type)));

          return (
            <div className="space-y-3 animate-fade-up">
              {requests.length > 0 && (
                <button onClick={() => setTab("requests")} className="card w-full tap-scale flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fdece0" }}>
                      <Clock size={16} color="#a5652a" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{requests.length} new request{requests.length === 1 ? "" : "s"}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>Waiting for your response</p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--muted)" />
                </button>
              )}

              <button onClick={() => setTab("earnings")} className="card w-full tap-scale flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                    <IndianRupee size={16} color="var(--terracotta)" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">₹{(todaysEarningsPaise / 100).toFixed(0)} earned today</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{todaysCompleted.length} completed · view full earnings</p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--muted)" />
              </button>

              <button onClick={() => setTab("schedule")} className="card w-full tap-scale flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                    <Clock size={16} color="var(--terracotta)" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {todaysSchedule.length > 0 ? `${todaysSchedule.length} booking${todaysSchedule.length === 1 ? "" : "s"} today` : "Nothing scheduled today"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {todaysSchedule.length > 0 ? `Next: ${formatWhen(todaysSchedule[0].startTime)}` : "View your full schedule"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--muted)" />
              </button>

              {offeredServices.length > 0 && (
                <div className="card">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>You offer</p>
                  <div className="flex flex-wrap gap-2">
                    {offeredServices.map((s) => (
                      <span key={s} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                        {SERVICE_LABEL[s]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "requests" && (
          requests.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No new requests right now.</p>
          ) : (
            requests.map((b) => (
              <BookingCard key={b.id} booking={b}>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus(b.id, "ACCEPTED")}
                    disabled={busyId === b.id}
                    className="btn-primary flex-1 text-sm tap-scale flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => setStatus(b.id, "DECLINED")}
                    disabled={busyId === b.id}
                    className="btn-secondary flex-1 text-sm tap-scale flex items-center justify-center gap-1.5"
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              </BookingCard>
            ))
          )
        )}

        {tab === "schedule" && (
          schedule.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>Nothing on your schedule yet.</p>
          ) : (
            schedule.map((b) => (
              <BookingCard key={b.id} booking={b}>
                {b.status === "ACCEPTED" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(b.id, "IN_PROGRESS")}
                      disabled={busyId === b.id}
                      className="btn-primary flex-1 text-sm tap-scale"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Cancel this booking? This will count against your reliability score and can't be undone.")) {
                          setStatus(b.id, "CANCELLED");
                        }
                      }}
                      disabled={busyId === b.id}
                      className="btn-secondary text-sm tap-scale px-4"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {b.status === "IN_PROGRESS" && reportOpenFor !== b.id && (
                  <button
                    onClick={() => (b.type === "WALKING" ? setReportOpenFor(b.id) : setStatus(b.id, "COMPLETED"))}
                    disabled={busyId === b.id}
                    className="btn-primary w-full text-sm tap-scale"
                  >
                    Complete
                  </button>
                )}
                {reportOpenFor === b.id && (
                  <WalkReportForm bookingId={b.id} onDone={() => { setReportOpenFor(null); router.refresh(); }} />
                )}
              </BookingCard>
            ))
          )
        )}

        {tab === "history" && (
          history.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No past bookings yet.</p>
          ) : (
            history.map((b) => (
              <BookingCard key={b.id} booking={b}>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                  style={{ background: "var(--cream)", color: "var(--chestnut, var(--terracotta))" }}
                >
                  {b.status}
                </span>
                {b.status === "COMPLETED" && (
                  b.ownerReview ? (
                    <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--muted)" }}>
                      <Star size={11} fill="var(--gold)" color="var(--gold)" /> You rated the owner {b.ownerReview.rating}/5
                    </p>
                  ) : (
                    <RateOwnerForm bookingId={b.id} onDone={() => router.refresh()} />
                  )
                )}
              </BookingCard>
            ))
          )
        )}

        {tab === "earnings" && <ProviderEarningsPanel />}

        {tab === "services" && <ProviderServicesEditor />}

        {tab === "hours" && <ProviderAvailabilityEditor />}

        {tab === "verification" && <ProviderVerificationUpload />}
      </div>
    </div>
  );
}