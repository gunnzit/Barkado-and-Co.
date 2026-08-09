"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase, Check, Plus } from "lucide-react";

export type Accessory = {
  id: string;
  name: string;
  category: string;
  price: number; // rupees, already converted from paise for display
  description: string;
  icon: "leash" | "collar" | "bowl" | "toy" | "bed" | "carrier";
};

const ICONS = {
  leash: Dog,
  collar: CircleDot,
  bowl: UtensilsCrossed,
  toy: Bone,
  bed: BedDouble,
  carrier: Briefcase,
};

export function AccessoryCard({ item }: { item: Accessory }) {
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");
  const router = useRouter();
  const Icon = ICONS[item.icon];

  const addToCart = async () => {
    setStatus("adding");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.id, quantity: 1 }),
    });
    if (res.status === 401) {
      router.push("/sign-in");
      return;
    }
    if (res.ok) {
      setStatus("added");
      setTimeout(() => setStatus("idle"), 1500);
    } else {
      setStatus("idle");
    }
  };

  return (
    <div className="card flex flex-col gap-3">
      <div
        className="w-full flex items-center justify-center rounded-xl"
        style={{ height: 90, background: "var(--cream)" }}
      >
        <Icon size={32} color="var(--tan)" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-semibold text-sm">{item.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.description}</p>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="font-bold text-sm">₹{item.price}</span>
        <button
          onClick={addToCart}
          disabled={status === "adding"}
          className="tap-scale w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: status === "added" ? "var(--chestnut)" : "var(--espresso)" }}
          aria-label={status === "added" ? "Added" : "Add to cart"}
        >
          {status === "added" ? <Check size={14} color="white" /> : <Plus size={14} color="white" />}
        </button>
      </div>
    </div>
  );
}
