"use client";

import { useEffect, useState } from "react";
import { PawPrint, GraduationCap, Scissors, Home as HomeIcon, Info, Pencil, Plus, X, Check } from "lucide-react";

type PetSize = "SMALL" | "MEDIUM" | "LARGE";
type Cadence = "WEEKLY" | "MONTHLY";
type ServiceType = "WALKING" | "SITTING" | "GROOMING" | "TRAINING";

type TrainingPackage = { id: string; name: string; cadence: Cadence; pricePaise: number };
type GroomingPackage = { id: string; name: string; pricesBySize: Partial<Record<PetSize, number>> };

type ProviderState = {
  servicesOffered: ServiceType[];
  pricePerSitDay: number | null;
  trainingCadences: Cadence[];
  groomingSizes: PetSize[];
  trainingPackages: TrainingPackage[];
  groomingPackages: GroomingPackage[];
};

const SIZE_LABEL: Record<PetSize, string> = { SMALL: "Small", MEDIUM: "Medium", LARGE: "Large" };

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="tap-scale w-11 h-6 rounded-full relative shrink-0"
      style={{ background: on ? "var(--panel-dark)" : "var(--border)" }}
      aria-label="Toggle"
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ left: on ? 22 : 2, background: "white", transition: "left 150ms ease" }}
      >
        {on && <Check size={11} color="var(--panel-dark)" />}
      </span>
    </button>
  );
}

export default function ProviderServicesEditor() {
  const [state, setState] = useState<ProviderState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/provider/services")
      .then((r) => (r.ok ? r.json() : null))
      .then(setState);
  };
  useEffect(() => { load(); }, []);

  const patch = async (data: Partial<Record<string, any>>) => {
    setSaving(true);
    await fetch("/api/provider/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    load();
  };

  if (!state) return <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>;

  const has = (s: ServiceType) => state.servicesOffered.includes(s);
  const toggleService = (s: ServiceType) => {
    const next = has(s) ? state.servicesOffered.filter((x) => x !== s) : [...state.servicesOffered, s];
    patch({ servicesOffered: next });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-1">My Services</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Manage your offerings, pricing, and availability. Keep your profile updated to attract the right clients.
        </p>
      </div>

      {/* ===== Adventure Walking — locked platform rate ===== */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="h-1.5" style={{ background: "var(--forest, #16281f)" }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                <PawPrint size={20} color="var(--forest, #16281f)" />
              </div>
              <div>
                <p className="font-bold text-base">Adventure Walking</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: "var(--cream)", color: "var(--muted)" }}>
                  Base Offering
                </span>
              </div>
            </div>
            <Toggle on={has("WALKING")} onChange={() => toggleService("WALKING")} />
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--cream)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Platform Standard Rate</p>
              <Info size={13} color="var(--muted)" />
            </div>
            <p className="text-2xl font-bold">₹300 <span className="text-sm font-normal" style={{ color: "var(--muted)" }}>/ walk</span></p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Rate locked. Duration and price are set platform-wide for Walking.</p>
          </div>
        </div>
      </div>

      {/* ===== Professional Training ===== */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="h-1.5" style={{ background: "var(--heritage-red, #c0392b)" }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fdecea" }}>
                <GraduationCap size={20} color="var(--heritage-red, #c0392b)" />
              </div>
              <div>
                <p className="font-bold text-base">Professional Training</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: "#fdecea", color: "var(--heritage-red, #c0392b)" }}>
                  Custom Pricing
                </span>
              </div>
            </div>
            <Toggle on={has("TRAINING")} onChange={() => toggleService("TRAINING")} />
          </div>

          {has("TRAINING") && (
            <TrainingSection
              cadences={state.trainingCadences}
              packages={state.trainingPackages}
              onToggleCadence={(c) => {
                const next = state.trainingCadences.includes(c)
                  ? state.trainingCadences.filter((x) => x !== c)
                  : [...state.trainingCadences, c];
                patch({ trainingCadences: next });
              }}
              onChanged={load}
            />
          )}
        </div>
      </div>

      {/* ===== Luxury Grooming ===== */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="h-1.5" style={{ background: "var(--gold)" }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fdf3e3" }}>
                <Scissors size={20} color="var(--gold)" />
              </div>
              <div>
                <p className="font-bold text-base">Luxury Grooming</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: "#fdf3e3", color: "var(--gold)" }}>
                  Set Your Rates
                </span>
              </div>
            </div>
            <Toggle on={has("GROOMING")} onChange={() => toggleService("GROOMING")} />
          </div>

          {has("GROOMING") && (
            <GroomingSection
              sizes={state.groomingSizes}
              packages={state.groomingPackages}
              onToggleSize={(s) => {
                const next = state.groomingSizes.includes(s)
                  ? state.groomingSizes.filter((x) => x !== s)
                  : [...state.groomingSizes, s];
                patch({ groomingSizes: next });
              }}
              onChanged={load}
            />
          )}
        </div>
      </div>

      {/* ===== Home Staycation — flat rate, restyled to match, no
          packages/cadence (nothing specified for it beyond "keep it
          simple"). ===== */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="h-1.5" style={{ background: "var(--terracotta)" }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                <HomeIcon size={20} color="var(--terracotta)" />
              </div>
              <div>
                <p className="font-bold text-base">Home Staycation</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                  Set Your Rate
                </span>
              </div>
            </div>
            <Toggle on={has("SITTING")} onChange={() => toggleService("SITTING")} />
          </div>

          {has("SITTING") && (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--muted)" }}>₹</span>
              <input
                type="number"
                min={1}
                defaultValue={state.pricePerSitDay ? state.pricePerSitDay / 100 : ""}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v > 0) patch({ pricePerSitDay: Math.round(v * 100) });
                }}
                placeholder="Rate per night"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)" }}
              />
              <span className="text-sm" style={{ color: "var(--muted)" }}>/ night</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrainingSection({
  cadences,
  packages,
  onToggleCadence,
  onChanged,
}: {
  cadences: Cadence[];
  packages: TrainingPackage[];
  onToggleCadence: (c: Cadence) => void;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState<Cadence | null>(null);

  const removePackage = async (id: string) => {
    await fetch(`/api/provider/training-packages/${id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Offer plans</p>
      <div className="flex gap-2 mb-4">
        {(["WEEKLY", "MONTHLY"] as const).map((c) => (
          <button
            key={c}
            onClick={() => onToggleCadence(c)}
            className="tap-scale flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: cadences.includes(c) ? "var(--panel-dark)" : "var(--cream)",
              color: cadences.includes(c) ? "white" : "inherit",
            }}
          >
            {c === "WEEKLY" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>

      {cadences.map((cadence) => {
        const cadencePackages = packages.filter((p) => p.cadence === cadence);
        return (
          <div key={cadence} className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
              {cadence === "WEEKLY" ? "Weekly Plans" : "Monthly Plans"}
            </p>
            <div className="space-y-2 mb-2">
              {cadencePackages.map((pkg) => (
                <div key={pkg.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: "var(--cream)" }}>
                  <div>
                    <p className="font-semibold text-sm">{pkg.name}</p>
                    <p className="text-sm font-bold">₹{(pkg.pricePaise / 100).toFixed(0)}</p>
                  </div>
                  <button onClick={() => removePackage(pkg.id)} className="tap-scale p-1.5" aria-label="Remove package">
                    <X size={14} color="var(--muted)" />
                  </button>
                </div>
              ))}
            </div>
            {adding === cadence ? (
              <NewTrainingPackageForm
                cadence={cadence}
                onDone={() => { setAdding(null); onChanged(); }}
                onCancel={() => setAdding(null)}
              />
            ) : (
              <button onClick={() => setAdding(cadence)} className="tap-scale flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--terracotta)" }}>
                <Plus size={13} /> Add a {cadence.toLowerCase()} package
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NewTrainingPackageForm({ cadence, onDone, onCancel }: { cadence: Cadence; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/provider/training-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), cadence, pricePaise: Math.round(Number(price) * 100) }),
    });
    setSaving(false);
    if (res.ok) onDone();
    else setError("Couldn't save — check the name and price.");
  };

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ border: "1px dashed var(--border)" }}>
      <input
        type="text"
        placeholder="Package name (e.g. Puppy Basics)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        style={{ borderColor: "var(--border)" }}
      />
      <input
        type="number"
        min={1}
        placeholder={`Price (₹ / ${cadence.toLowerCase()})`}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        style={{ borderColor: "var(--border)" }}
      />
      {error && <p className="text-xs" style={{ color: "var(--terracotta)" }}>{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !name.trim() || !price} className="btn-primary flex-1 text-sm tap-scale" style={{ opacity: saving || !name.trim() || !price ? 0.5 : 1 }}>
          {saving ? "Saving…" : "Save package"}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm tap-scale px-4">Cancel</button>
      </div>
    </div>
  );
}

function GroomingSection({
  sizes,
  packages,
  onToggleSize,
  onChanged,
}: {
  sizes: PetSize[];
  packages: GroomingPackage[];
  onToggleSize: (s: PetSize) => void;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);

  const removePackage = async (id: string) => {
    await fetch(`/api/provider/grooming-packages/${id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Sizes you groom</p>
      <div className="flex gap-2 mb-4">
        {(["SMALL", "MEDIUM", "LARGE"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onToggleSize(s)}
            className="tap-scale flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: sizes.includes(s) ? "var(--panel-dark)" : "var(--cream)",
              color: sizes.includes(s) ? "white" : "inherit",
            }}
          >
            {SIZE_LABEL[s]}
          </button>
        ))}
      </div>

      {sizes.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--muted)" }}>Select at least one size to start adding packages.</p>
      ) : (
        <>
          <div className="space-y-2 mb-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-xl p-3" style={{ background: "var(--cream)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{pkg.name}</p>
                  <button onClick={() => removePackage(pkg.id)} className="tap-scale p-1" aria-label="Remove package">
                    <X size={14} color="var(--muted)" />
                  </button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {sizes.map((s) => (
                    <span key={s} className="text-xs" style={{ color: "var(--muted)" }}>
                      {SIZE_LABEL[s]}: <span className="font-bold" style={{ color: "inherit" }}>₹{pkg.pricesBySize[s] ? (pkg.pricesBySize[s]! / 100).toFixed(0) : "—"}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {adding ? (
            <NewGroomingPackageForm sizes={sizes} onDone={() => { setAdding(false); onChanged(); }} onCancel={() => setAdding(false)} />
          ) : (
            <button onClick={() => setAdding(true)} className="tap-scale flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--terracotta)" }}>
              <Plus size={13} /> Add a grooming package
            </button>
          )}
        </>
      )}
    </div>
  );
}

function NewGroomingPackageForm({ sizes, onDone, onCancel }: { sizes: PetSize[]; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [prices, setPrices] = useState<Partial<Record<PetSize, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSave = name.trim().length > 0 && sizes.some((s) => Number(prices[s]) > 0);

  const save = async () => {
    setSaving(true);
    setError("");
    const pricesBySize: Record<string, number> = {};
    for (const s of sizes) {
      const v = Number(prices[s]);
      if (v > 0) pricesBySize[s] = Math.round(v * 100);
    }
    const res = await fetch("/api/provider/grooming-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), pricesBySize }),
    });
    setSaving(false);
    if (res.ok) onDone();
    else setError("Couldn't save — check the name and prices.");
  };

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ border: "1px dashed var(--border)" }}>
      <input
        type="text"
        placeholder="Package name (e.g. Base Bath & Brush)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        style={{ borderColor: "var(--border)" }}
      />
      {sizes.map((s) => (
        <div key={s} className="flex items-center gap-2">
          <span className="text-xs w-14 shrink-0" style={{ color: "var(--muted)" }}>{SIZE_LABEL[s]}</span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>₹</span>
          <input
            type="number"
            min={1}
            value={prices[s] ?? ""}
            onChange={(e) => setPrices((p) => ({ ...p, [s]: e.target.value }))}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      ))}
      {error && <p className="text-xs" style={{ color: "var(--terracotta)" }}>{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving || !canSave} className="btn-primary flex-1 text-sm tap-scale" style={{ opacity: saving || !canSave ? 0.5 : 1 }}>
          {saving ? "Saving…" : "Save package"}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm tap-scale px-4">Cancel</button>
      </div>
    </div>
  );
}