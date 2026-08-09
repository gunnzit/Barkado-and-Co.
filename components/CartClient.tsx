"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import BottomNav from "@/components/BottomNav";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number; // paise
    icon: string | null;
  };
};

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const load = async () => {
    const res = await fetch("/api/cart");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateQuantity = async (productId: string, quantity: number) => {
    await fetch(`/api/cart/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    load();
  };

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const checkout = async () => {
    setCheckingOut(true);
    const res = await fetch("/api/orders/checkout", { method: "POST" });
    if (!res.ok) {
      setCheckingOut(false);
      alert("Checkout failed — please try again.");
      return;
    }
    const data = await res.json();

    const rzp = new (window as any).Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: "INR",
      name: "PawConnect",
      description: "Accessories order",
      order_id: data.orderId,
      handler: function () {
        window.location.href = "/cart?success=1";
      },
      theme: { color: "#c17f45" },
    });
    rzp.on("payment.failed", function () {
      alert("Payment failed — please try again.");
    });
    rzp.open();
    setCheckingOut(false);
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="pb-28 max-w-2xl mx-auto" style={{ background: "var(--cream)", minHeight: "100vh" }}>
        <div className="flex items-center gap-3 px-6 py-5">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag size={20} color="var(--tan)" /> Your cart
          </h1>
        </div>

        {loading ? (
          <p className="px-6 text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className="px-6">
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Your cart is empty.</p>
            <Link href="/accessories" className="btn-primary inline-block">Browse accessories</Link>
          </div>
        ) : (
          <>
            <div className="px-6 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{item.product.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      ₹{(item.product.price / 100).toFixed(0)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="tap-scale w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "var(--cream)" }}
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button
                      className="tap-scale w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "var(--cream)" }}
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">₹{(total / 100).toFixed(0)}</span>
              </div>
              <button onClick={checkout} disabled={checkingOut} className="btn-primary w-full tap-scale">
                {checkingOut ? "Preparing checkout…" : "Checkout"}
              </button>
            </div>
          </>
        )}
      </main>
      {!loading && <BottomNav />}
    </>
  );
}
