"use client";

import Link from "next/link";
import { Minus, Plus, X, PawPrint, Scissors, GraduationCap, Home as HomeIcon } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";

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

function formatWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function CartItemsList() {
  const { items, setQuantity, removeItem, loading } = useCart();

  const serviceItems = items.filter((i) => i.kind === "SERVICE");
  const productItems = items.filter((i) => i.kind === "PRODUCT" && i.product);

  const itemsTotal = items.reduce((sum, i) => {
    if (i.kind === "PRODUCT" && i.product) return sum + i.product.price * i.quantity;
    if (i.kind === "SERVICE") return sum + (i.priceAmount ?? 0);
    return sum;
  }, 0);

  if (!loading && items.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Your cart is empty.</p>
        <Link href="/" className="btn-primary inline-block">Browse services</Link>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 pb-4 space-y-3">
        {serviceItems.map((item) => {
          const Icon = SERVICE_ICON[item.serviceType ?? "WALKING"];
          return (
            <div key={item.id} className="card flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                  <Icon size={18} color="var(--terracotta)" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{SERVICE_LABEL[item.serviceType ?? "WALKING"]}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {item.pet?.name ? `For ${item.pet.name} · ` : ""}with {item.provider?.user.name ?? "a provider"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{formatWhen(item.startTime)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button onClick={() => removeItem(item.id)} className="tap-scale" aria-label="Remove">
                  <X size={16} color="var(--muted)" />
                </button>
                <span className="text-sm font-bold">₹{((item.priceAmount ?? 0) / 100).toFixed(0)}</span>
              </div>
            </div>
          );
        })}

        {productItems.map((item) => (
          <div key={item.id} className="card flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">{item.product!.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>₹{(item.product!.price / 100).toFixed(0)} each</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setQuantity(item.productId!, item.quantity - 1)}
                className="tap-scale w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
                aria-label="Decrease quantity"
              >
                <Minus size={12} />
              </button>
              <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => setQuantity(item.productId!, item.quantity + 1)}
                className="tap-scale w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--panel-dark)" }}
                aria-label="Increase quantity"
              >
                <Plus size={12} color="white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <>
          <div className="px-6 mb-28">
            <div className="card">
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Bill details</p>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "var(--muted)" }}>Items total</span>
                <span className="font-semibold">₹{(itemsTotal / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <span>Grand total</span>
                <span>₹{(itemsTotal / 100).toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "var(--card)", borderTop: "1px solid var(--border)", zIndex: 50 }}>
            <div className="max-w-lg mx-auto flex items-center gap-4">
              <div className="shrink-0">
                <p className="text-xs" style={{ color: "var(--muted)" }}>Total</p>
                <p className="font-bold text-lg">₹{(itemsTotal / 100).toFixed(0)}</p>
              </div>
              <div className="flex-1">
                <RazorpayCheckoutButton amountLabel={`₹${(itemsTotal / 100).toFixed(0)}`} disabled={items.length === 0} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}