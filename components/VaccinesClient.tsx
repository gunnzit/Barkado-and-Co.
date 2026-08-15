"use client";

import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Syringe, Pill, Plus, X, MapPin, Phone, Newspaper, ExternalLink } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";

type Pet = { id: string; name: string };
type Entry = {
  id: string;
  petId: string;
  vaccineName: string;
  type: string;
  dateGiven: string;
  nextDueDate: string | null;
  pet: { id: string; name: string };
};

// Sample placeholder vets — swap for real data (e.g. a Places API) later.
const SAMPLE_VETS = [
  { name: "Green Cross Veterinary Clinic", address: "Sector 40-C, Chandigarh", phone: "+91 98765 43210" },
  { name: "Happy Paws Animal Hospital", address: "Model Town, Ludhiana", phone: "+91 98123 45678" },
  { name: "CarePet Veterinary Centre", address: "Sarabha Nagar, Ludhiana", phone: "+91 99888 11223" },
];

// Real external sources for pet medical/health news — no fabricated content, just links out.
const NEWS_LINKS = [
  { title: "PetMD — Pet Health News", url: "https://www.petmd.com/news" },
  { title: "AVMA News", url: "https://www.avma.org/news" },
  { title: "WSAVA — World Small Animal Veterinary Association", url: "https://wsava.org/news/" },
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function startWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function fmtDateKey(d: Date) {
  // Use local date parts, not toISOString() (which converts to UTC and can
  // shift the date by a day for timezones ahead of UTC, e.g. India).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function VaccinesClient({
  initialThemeClass = "",
  pets,
  initialEntries,
}: {
  initialThemeClass?: string;
  pets: Pet[];
  initialEntries: Entry[];
}) {
  const themeClass = initialThemeClass;
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);

  const [form, setForm] = useState({
    petId: pets[0]?.id ?? "",
    type: "VACCINE",
    vaccineName: "",
    dateGiven: "",
    nextDueDate: "",
  });
  const [saving, setSaving] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = startWeekday(year, month);

  const entriesByDate: Record<string, Entry[]> = {};
  for (const e of entries) {
    const key = e.dateGiven.slice(0, 10);
    if (!entriesByDate[key]) entriesByDate[key] = [];
    entriesByDate[key].push(e);
  }

  const openLogForm = (dateKey: string) => {
    setSelectedDate(dateKey);
    setForm((f) => ({ ...f, dateGiven: dateKey }));
    setShowLogForm(true);
  };

  const saveEntry = async () => {
    if (!form.petId || !form.vaccineName || !form.dateGiven) return;
    setSaving(true);
    const res = await fetch("/api/vaccinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petId: form.petId,
        vaccineName: form.vaccineName,
        type: form.type,
        dateGiven: form.dateGiven,
        nextDueDate: form.nextDueDate || undefined,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      const pet = pets.find((p) => p.id === created.petId);
      setEntries((prev) => [{ ...created, pet: { id: pet?.id ?? "", name: pet?.name ?? "" } }, ...prev]);
      setShowLogForm(false);
      setForm((f) => ({ ...f, vaccineName: "", nextDueDate: "" }));
    }
    setSaving(false);
  };

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedEntries = selectedDate ? entriesByDate[selectedDate] ?? [] : [];
  const todayKey = fmtDateKey(new Date());

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
    <main className="pb-28 max-w-2xl mx-auto">
      <div className="px-6 pt-4 flex items-center justify-between">
        <PetSwitcher />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 py-5">
        <Link href="/owner/dashboard" className="tap-scale">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Syringe size={20} color="var(--tan)" /> Vaccines &amp; medicine
        </h1>
      </div>

      {pets.length === 0 && (
        <div className="mx-6 mb-6 card">
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>Add a pet first to start logging.</p>
          <Link href="/owner/pets" className="btn-primary inline-block">Add a pet</Link>
        </div>
      )}

      {/* ===== Calendar ===== */}
      <div className="px-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="tap-scale" style={{ transition: "opacity 0.2s ease" }}>
              <ChevronLeft size={18} />
            </button>
            <p className="font-bold text-sm animate-fade-up" key={`label-${monthLabel}`}>{monthLabel}</p>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="tap-scale" style={{ transition: "opacity 0.2s ease" }}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <p key={i} className="text-center text-[10px] font-semibold" style={{ color: "var(--muted)" }}>{d}</p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 animate-fade-up" key={monthLabel}>
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(year, month, day);
              const dateKey = fmtDateKey(dateObj);
              const hasEntries = !!entriesByDate[dateKey]?.length;
              const isSelected = selectedDate === dateKey;
              const isToday = dateKey === todayKey;
              return (
                <button
                  key={day}
                  onClick={() => (hasEntries ? setSelectedDate(dateKey) : openLogForm(dateKey))}
                  className="tap-scale rounded-lg flex flex-col items-center justify-center py-1.5 relative"
                  style={{
                    background: isSelected ? "var(--terracotta)" : "transparent",
                    color: isSelected ? "white" : "inherit",
                    boxShadow: isToday && !isSelected ? "inset 0 0 0 1.5px var(--terracotta)" : "none",
                    transition: "background 0.25s ease, box-shadow 0.25s ease, color 0.25s ease",
                  }}
                >
                  <span className="text-xs font-medium">{day}</span>
                  {hasEntries && (
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ background: isSelected ? "white" : "var(--gold)", transition: "background 0.25s ease" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Selected day entries ===== */}
      {selectedDate && (
        <div className="px-6 mb-8 animate-fade-up" key={selectedDate}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-sm">
              {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <button onClick={() => openLogForm(selectedDate)} className="flex items-center gap-1 text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
              <Plus size={13} /> Log entry
            </button>
          </div>
          {selectedEntries.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Nothing logged for this day yet.</p>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              {selectedEntries.map((e, i) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3" style={i !== selectedEntries.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}>
                  {e.type === "MEDICINE" ? <Pill size={16} color="var(--terracotta)" /> : <Syringe size={16} color="var(--terracotta)" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.vaccineName}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{e.pet.name}{e.nextDueDate ? ` · next due ${new Date(e.nextDueDate).toLocaleDateString()}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Vets nearby ===== */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin size={18} color="var(--tan)" /> Vets nearby
        </h2>
        <div className="space-y-2">
          {SAMPLE_VETS.map((v) => (
            <div key={v.name} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{v.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{v.address}</p>
              </div>
              <a href={`tel:${v.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
                <Phone size={13} /> Call
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Pet health news — links out to real sources, not written by us ===== */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Newspaper size={18} color="var(--tan)" /> Pet health &amp; medical news
        </h2>
        <div className="space-y-2">
          {NEWS_LINKS.map((n) => (
            <a
              key={n.url}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center justify-between tap-scale"
            >
              <p className="text-sm font-medium">{n.title}</p>
              <ExternalLink size={14} color="var(--muted)" />
            </a>
          ))}
        </div>
      </div>

      {/* ===== Log entry modal ===== */}
      {showLogForm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6 vaccine-modal-backdrop"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 100 }}
          onClick={() => setShowLogForm(false)}
        >
          <div className="card w-full max-w-sm vaccine-modal-pop" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Log an entry</h3>
              <button onClick={() => setShowLogForm(false)} className="tap-scale"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)" }}
                value={form.petId}
                onChange={(e) => setForm({ ...form, petId: e.target.value })}
              >
                {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, type: "VACCINE" })}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold tap-scale"
                  style={{ background: form.type === "VACCINE" ? "var(--terracotta)" : "var(--cream)", color: form.type === "VACCINE" ? "white" : "inherit", border: "1px solid var(--border)" }}
                >
                  Vaccine
                </button>
                <button
                  onClick={() => setForm({ ...form, type: "MEDICINE" })}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold tap-scale"
                  style={{ background: form.type === "MEDICINE" ? "var(--terracotta)" : "var(--cream)", color: form.type === "MEDICINE" ? "white" : "inherit", border: "1px solid var(--border)" }}
                >
                  Medicine
                </button>
              </div>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)" }}
                placeholder={form.type === "MEDICINE" ? "Medicine name" : "Vaccine name"}
                value={form.vaccineName}
                onChange={(e) => setForm({ ...form, vaccineName: e.target.value })}
              />
              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>Date given</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  style={{ borderColor: "var(--border)" }}
                  value={form.dateGiven}
                  onChange={(e) => setForm({ ...form, dateGiven: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs" style={{ color: "var(--muted)" }}>Next due (optional)</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  style={{ borderColor: "var(--border)" }}
                  value={form.nextDueDate}
                  onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                />
              </div>
              <button onClick={saveEntry} disabled={saving} className="btn-primary w-full">
                {saving ? "Saving…" : "Save entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
    </div>
  );
}