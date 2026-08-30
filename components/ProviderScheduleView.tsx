"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, MoreVertical, PawPrint, Home as HomeIcon, Scissors, GraduationCap, PlusCircle } from "lucide-react";
import type { ProviderBooking } from "@/components/ProviderDashboard";

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

const CATEGORY_COLOR: Record<string, string> = {
  WALKING: "var(--forest, #16281f)",
  SITTING: "var(--terracotta)",
  GROOMING: "var(--gold)",
  TRAINING: "var(--heritage-red, #c0392b)",
};

function durationMinutes(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

// Real address, shortened to its first segment (e.g. "42 Maple St, Sector
// 40, City" -> "42 Maple St") rather than inventing a short place-name
// label — the reference design shows compact labels like "Maple Park," but
// bookings only ever store a full street address, not a place name.
function shortLocation(address: string | null) {
  if (!address) return "Location TBD";
  return address.split(",")[0].trim();
}

function isSameDay(iso: string, date: Date) {
  const d = new Date(iso);
  return d.toDateString() === date.toDateString();
}

// Monday-start week containing `anchor`.
function weekDaysFor(anchor: Date) {
  const day = anchor.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
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

export default function ProviderScheduleView({
  schedule,
  setStatus,
  busyId,
  reportOpenFor,
  setReportOpenFor,
  onGoHours,
  onRefresh,
}: {
  schedule: ProviderBooking[];
  setStatus: (id: string, status: string) => Promise<void>;
  busyId: string | null;
  reportOpenFor: string | null;
  setReportOpenFor: (id: string | null) => void;
  onGoHours: () => void;
  onRefresh: () => void;
}) {
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  const weekDays = weekDaysFor(weekAnchor);
  const monthLabel = weekAnchor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const dayHasBookings = (d: Date) => schedule.some((b) => isSameDay(b.startTime, d));

  const dayBookings = schedule
    .filter((b) => isSameDay(b.startTime, selectedDate))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const shiftWeek = (dir: 1 | -1) => {
    const next = new Date(weekAnchor);
    next.setDate(weekAnchor.getDate() + dir * 7);
    setWeekAnchor(next);
  };

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-xl font-bold">Schedule</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Manage your upcoming appointments.</p>
      </div>

      <button
        onClick={onGoHours}
        className="btn-primary w-full tap-scale flex items-center justify-center gap-2 mb-5"
      >
        <PlusCircle size={18} /> Set Availability
      </button>

      {/* ===== Week strip ===== */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm">{monthLabel}</p>
          <div className="flex gap-1">
            <button onClick={() => shiftWeek(-1)} className="tap-scale p-1.5 rounded-full" style={{ color: "var(--muted)" }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => shiftWeek(1)} className="tap-scale p-1.5 rounded-full" style={{ color: "var(--muted)" }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="flex justify-between gap-1 overflow-x-auto no-scrollbar">
          {weekDays.map((d) => {
            const selected = d.toDateString() === selectedDate.toDateString();
            const hasBookings = dayHasBookings(d);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(d)}
                className="tap-scale shrink-0 flex flex-col items-center justify-center rounded-xl"
                style={{
                  width: 44,
                  height: 60,
                  background: selected ? "var(--panel-dark)" : "transparent",
                }}
              >
                <span className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: selected ? "rgba(255,255,255,0.75)" : "var(--muted)" }}>
                  {d.toLocaleDateString("en-IN", { weekday: "short" })}
                </span>
                <span className="text-base font-bold" style={{ color: selected ? "white" : undefined }}>{d.getDate()}</span>
                {hasBookings && !selected && (
                  <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: "var(--terracotta)" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Timeline for selected day ===== */}
      {dayBookings.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nothing scheduled on this day.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dayBookings.map((b) => {
            const Icon = SERVICE_ICON[b.type];
            const color = CATEGORY_COLOR[b.type];
            const time = new Date(b.startTime);
            const mins = durationMinutes(b.startTime, b.endTime);
            const menuOpen = openMenuFor === b.id;

            return (
              <div key={b.id}>
                <p className="text-sm font-bold mb-2">
                  {time.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                </p>
                <div className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={b.pet.photoUrl || `https://i.pravatar.cc/150?u=pet-${b.id}`}
                          alt={b.pet.name}
                          className="w-14 h-14 rounded-full object-cover"
                          style={{ border: "1px solid var(--border)" }}
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: color, border: "2px solid var(--card)" }}
                        >
                          <Icon size={12} color="white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm">{b.pet.name}</p>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ background: `${color}1A`, color }}
                          >
                            {SERVICE_LABEL[b.type]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                          <span className="flex items-center gap-1"><Clock size={13} /> {mins} min</span>
                          <span className="flex items-center gap-1 truncate"><MapPin size={13} /> {shortLocation(b.address)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenMenuFor(menuOpen ? null : b.id)}
                      className="tap-scale p-1.5 rounded-full shrink-0"
                      style={{ color: "var(--muted)" }}
                      aria-label="Booking actions"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {menuOpen && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
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
                        <WalkReportForm bookingId={b.id} onDone={() => { setReportOpenFor(null); onRefresh(); }} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}