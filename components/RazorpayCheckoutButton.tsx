"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutButton({
  amountLabel,
  disabled,
}: {
  amountLabel: string;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const router = useRouter();
  const { user } = useUser();

  const payNow = async () => {
    setStatus("loading");

    const scriptOk = await loadRazorpayScript();
    if (!scriptOk) {
      setStatus("error");
      return;
    }

    const orderRes = await fetch("/api/checkout/create-order", { method: "POST" });
    if (!orderRes.ok) {
      setStatus("error");
      return;
    }
    const order = await orderRes.json();

    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Barkado & Co.",
      description: "Pet services & accessories",
      order_id: order.razorpayOrderId,
      prefill: {
        name: user?.fullName ?? undefined,
        email: user?.primaryEmailAddress?.emailAddress ?? undefined,
      },
      theme: { color: "#c97a56" },
      handler: async (response: any) => {
        const verifyRes = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localOrderId: order.localOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        if (verifyRes.ok) {
          router.push("/cart/success");
        } else {
          setStatus("error");
        }
      },
      modal: {
        ondismiss: () => setStatus("idle"),
      },
    });

    razorpay.on("payment.failed", () => setStatus("error"));
    razorpay.open();
  };

  return (
    <div>
      <button
        onClick={payNow}
        disabled={disabled || status === "loading"}
        className="btn-primary w-full tap-scale flex items-center justify-center gap-2"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Opening payment…
          </>
        ) : (
          `Place Order · ${amountLabel}`
        )}
      </button>
      {status === "error" && (
        <p className="text-xs text-center mt-2" style={{ color: "var(--terracotta)" }}>
          Payment didn't go through. Please try again.
        </p>
      )}
    </div>
  );
}