"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Product = { id: string; name: string };
type Reward = {
  id: string;
  name: string;
  description: string | null;
  costPoints: number;
  rewardType: "FLAT_DISCOUNT" | "FREE_PRODUCT";
  discountValuePaise: number | null;
  applicableServiceType: string | null;
  productName: string | null;
  active: boolean;
};

export default function AdminPawPointsRewardsClient({ products, initialRewards }: { products: Product[]; initialRewards: Reward[] }) {
  const [rewards, setRewards] = useState(initialRewards);
  const [rewardType, setRewardType] = useState<"FLAT_DISCOUNT" | "FREE_PRODUCT">("FLAT_DISCOUNT");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [costPoints, setCostPoints] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [serviceType, setServiceType] = useState<string>("");
  const [productId, setProductId] = useState("");
  const [error, setError] = useState("");

  const create = async () => {
    setError("");
    const body: any = {
      rewardType,
      name: name.trim(),
      description: description.trim() || undefined,
      costPoints: Number(costPoints),
    };
    if (rewardType === "FLAT_DISCOUNT") {
      body.discountValuePaise = Math.round(Number(discountValue) * 100);
      if (serviceType) body.applicableServiceType = serviceType;
    } else {
      body.productId = productId;
    }

    const res = await fetch("/api/admin/pawpoints-rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      const product = products.find((p) => p.id === productId);
      setRewards((r) => [
        {
          id: created.id, name: created.name, description: created.description ?? null,
          costPoints: created.costPoints, rewardType: created.rewardType,
          discountValuePaise: created.discountValuePaise, applicableServiceType: created.applicableServiceType,
          productName: rewardType === "FREE_PRODUCT" ? product?.name ?? null : null, active: created.active,
        },
        ...r,
      ]);
      setName(""); setDescription(""); setCostPoints(""); setDiscountValue(""); setServiceType(""); setProductId("");
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error ? JSON.stringify(b.error) : "Couldn't create reward.");
    }
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/admin/pawpoints-rewards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setRewards((r) => r.map((x) => (x.id === id ? { ...x, active } : x)));
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/pawpoints-rewards/${id}`, { method: "DELETE" });
    setRewards((r) => r.filter((x) => x.id !== id));
  };

  const canCreate = name.trim() && costPoints && (rewardType === "FLAT_DISCOUNT" ? discountValue : productId);

  return (
    <div className="space-y-8">
      <div className="card space-y-3">
        <div className="flex gap-2">
          {(["FLAT_DISCOUNT", "FREE_PRODUCT"] as const).map((t) => (
            <button key={t} onClick={() => setRewardType(t)} className="tap-scale flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: rewardType === t ? "var(--panel-dark)" : "var(--cream)", color: rewardType === t ? "white" : "inherit" }}>
              {t === "FLAT_DISCOUNT" ? "Flat ₹ Discount" : "Free Product"}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Reward name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />
        <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />
        <input type="number" placeholder="Cost in points" value={costPoints} onChange={(e) => setCostPoints(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />

        {rewardType === "FLAT_DISCOUNT" ? (
          <>
            <input type="number" placeholder="Discount value (₹)" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              <option value="">Valid on anything</option>
              <option value="WALKING">Walking only</option>
              <option value="SITTING">Sitting only</option>
              <option value="GROOMING">Grooming only</option>
              <option value="TRAINING">Training only</option>
            </select>
          </>
        ) : (
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
            <option value="">Select product…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        {error && <p className="text-xs" style={{ color: "var(--terracotta)" }}>{error}</p>}
        <button onClick={create} disabled={!canCreate} className="btn-primary text-sm tap-scale" style={{ opacity: !canCreate ? 0.5 : 1 }}>
          Create reward
        </button>
      </div>

      <div className="space-y-2">
        {rewards.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "var(--cream)", opacity: r.active ? 1 : 0.5 }}>
            <div>
              <p className="text-sm font-semibold">{r.name} — {r.costPoints} pts</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {r.rewardType === "FLAT_DISCOUNT"
                  ? `₹${(r.discountValuePaise! / 100).toFixed(0)} off${r.applicableServiceType ? ` (${r.applicableServiceType})` : " anything"}`
                  : `Free: ${r.productName}`}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => toggle(r.id, !r.active)} className="tap-scale text-xs font-semibold" style={{ color: "var(--terracotta)" }}>
                {r.active ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => remove(r.id)} className="tap-scale" aria-label="Remove"><X size={16} color="var(--muted)" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}