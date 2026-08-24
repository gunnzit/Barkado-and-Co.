"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2 } from "lucide-react";

const CATEGORY_OPTIONS = ["Leashes & Collars", "Bowls & Feeding", "Toys", "Beds & Comfort", "Carriers", "Grooming"];
const ICON_OPTIONS = [
  { key: "leash", label: "Leash" },
  { key: "collar", label: "Collar" },
  { key: "bowl", label: "Bowl" },
  { key: "toy", label: "Toy" },
  { key: "bed", label: "Bed" },
  { key: "carrier", label: "Carrier" },
];

type ProductData = {
  id?: string;
  name: string;
  description: string | null;
  category: string;
  price: number; // paise
  compareAtPrice: number | null; // paise
  imageUrls: string[];
  icon: string | null;
  active: boolean;
};

export default function AdminProductForm({ initial }: { initial?: ProductData }) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORY_OPTIONS[0]);
  const [price, setPrice] = useState(initial ? String(initial.price / 100) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(initial?.compareAtPrice ? String(initial.compareAtPrice / 100) : "");
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? []);
  const [icon, setIcon] = useState(initial?.icon ?? ICON_OPTIONS[0].key);
  const [active, setActive] = useState(initial?.active ?? true);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<number | null>(null);

  const openPicker = (slot: number) => {
    pendingSlot.current = slot;
    fileInputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    const slot = pendingSlot.current;
    if (slot === null) return;
    setUploadingSlot(slot);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/products/photo", { method: "POST", body: formData });
    setUploadingSlot(null);
    if (res.ok) {
      const data = await res.json();
      setImageUrls((prev) => {
        const next = [...prev];
        next[slot] = data.url;
        return next.slice(0, 3);
      });
    } else {
      setError("Photo upload failed — please try again.");
    }
  };

  const removePhoto = (slot: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== slot));
  };

  const submit = async () => {
    if (!name.trim() || !category.trim() || !price) {
      setError("Name, category, and price are required.");
      return;
    }
    setError("");
    setSubmitting(true);

    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim(),
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      imageUrls,
      icon,
      active,
    };

    const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.join(", ") || "Couldn't save — please check the fields and try again.");
    }
  };

  return (
    <div className="px-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="card mb-3">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Photos (up to 3)</p>
        <div className="flex gap-2">
          {[0, 1, 2].map((slot) => (
            <button
              key={slot}
              onClick={() => openPicker(slot)}
              disabled={uploadingSlot === slot}
              className="tap-scale relative flex-1 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ height: 80, background: "var(--cream)", border: "1px solid var(--border)" }}
            >
              {uploadingSlot === slot ? (
                <Loader2 size={18} className="animate-spin" color="var(--muted)" />
              ) : imageUrls[slot] ? (
                <>
                  <img src={imageUrls[slot]} alt="" className="w-full h-full object-cover" />
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(slot);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                  >
                    <X size={11} color="white" />
                  </span>
                </>
              ) : (
                <Upload size={16} color="var(--muted)" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-3">
        <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      <div className="card mb-3">
        <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      <div className="card mb-3 flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            style={{ borderColor: "var(--border)" }}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Price (₹)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>

      <div className="card mb-3">
        <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Compare-at price (₹) — optional</label>
        <p className="text-[11px] mt-0.5 mb-1.5" style={{ color: "var(--muted)" }}>
          A higher "original" price shown crossed out, with a real % off badge. Leave blank for no discount shown.
        </p>
        <input
          type="number"
          value={compareAtPrice}
          onChange={(e) => setCompareAtPrice(e.target.value)}
          placeholder="e.g. 129"
          className="w-full border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      <div className="card mb-3">
        <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Fallback icon (shown if no photos)</label>
        <select
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
          style={{ borderColor: "var(--border)" }}
        >
          {ICON_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="card mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold">Active in shop</span>
        <button
          onClick={() => setActive((v) => !v)}
          className="tap-scale w-11 h-6 rounded-full relative"
          style={{ background: active ? "var(--terracotta)" : "var(--border)" }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
            style={{ left: active ? 22 : 2, transition: "left 180ms ease" }}
          />
        </button>
      </div>

      {error && <p className="text-xs mb-3" style={{ color: "var(--terracotta)" }}>{error}</p>}

      <button onClick={submit} disabled={submitting} className="btn-primary w-full tap-scale" style={{ opacity: submitting ? 0.6 : 1 }}>
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Add product"}
      </button>
    </div>
  );
}