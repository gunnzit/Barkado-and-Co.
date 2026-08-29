"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load payment widget"));
    document.body.appendChild(script);
  });
}

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [busy, setBusy] = useState(false);
  const [feeInfo, setFeeInfo] = useState<{ amount: number } | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const attemptFreeCancel = async () => {
    if (!confirm("Cancel this booking? This can't be undone.")) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setBusy(false);

    if (res.ok) {
      router.refresh();
      return;
    }

    if (res.status === 402) {
      const data = await res.json();
      setFeeInfo({ amount: data.feeAmount });
      return;
    }

    setError("Couldn't cancel — please try again.");
  };

  const payFeeAndCancel = async () => {
    setBusy(true);
    setError("");
    try {
      await loadRazorpayScript();
      const orderRes = await fetch(`/api/bookings/${bookingId}/cancel-fee/create-order`, { method: "POST" });
      if (!orderRes.ok) throw new Error("order_failed");
      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        order_id: order.razorpayOrderId,
        name: "Barkado & Co.",
        description: "Cancellation fee",
        handler: async (response: any) => {
          const verifyRes = await fetch(`/api/bookings/${bookingId}/cancel-fee/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          setBusy(false);
          if (verifyRes.ok) {
            router.refresh();
          } else {
            setError("Payment succeeded but cancellation failed — contact support.");
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch {
      setBusy(false);
      setError("Couldn't start payment — please try again.");
    }
  };

  if (feeInfo) {
    return (
      <div className="text-right">
        <p className="text-[11px] mb-1" style={{ color: "var(--terracotta)" }}>
          You've used your free cancellations this month — this one costs ₹{(feeInfo.amount / 100).toFixed(0)}.
        </p>
        <button onClick={payFeeAndCancel} disabled={busy} className="btn-secondary text-xs tap-scale">
          {busy ? "…" : `Pay ₹${(feeInfo.amount / 100).toFixed(0)} to cancel`}
        </button>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button onClick={attemptFreeCancel} disabled={busy} className="btn-secondary text-xs tap-scale" style={{ opacity: busy ? 0.6 : 1 }}>
        {busy ? "…" : "Cancel booking"}
      </button>
      {error && <p className="text-[11px] mt-1" style={{ color: "var(--terracotta)" }}>{error}</p>}
    </div>
  );
}

export function RescheduleForm({ bookingId, currentStart }: { bookingId: string; currentStart: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentStart.slice(0, 16)); // datetime-local format
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async () => {
    if (!value) return;
    setSubmitting(true);
    setError("");
    const newStart = new Date(value);
    const newEnd = new Date(newStart.getTime() + 30 * 60000); // matches the 30-min default used at booking time
    const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: newStart.toISOString(), endTime: newEnd.toISOString() }),
    });
    setSubmitting(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't reschedule — please try again.");
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs tap-scale">
        Reschedule
      </button>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
        style={{ borderColor: "var(--border)" }}
      />
      {error && <p className="text-xs" style={{ color: "var(--terracotta)" }}>{error}</p>}
      <p className="text-[11px]" style={{ color: "var(--muted)" }}>
        The provider will need to re-confirm this new time.
      </p>
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="btn-secondary text-xs flex-1 tap-scale">Cancel</button>
        <button onClick={submit} disabled={submitting} className="btn-primary text-xs flex-1 tap-scale" style={{ opacity: submitting ? 0.6 : 1 }}>
          {submitting ? "Saving…" : "Confirm new time"}
        </button>
      </div>
    </div>
  );
}

export function RateBookingForm({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    const res = await fetch(`/api/bookings/${bookingId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || undefined }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  };

  if (done) return <p className="text-xs font-semibold" style={{ color: "#2f7a44" }}>Thanks for rating!</p>;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs tap-scale">
        Rate this booking
      </button>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className="tap-scale" aria-label={`${n} stars`}>
            <Star size={20} fill={n <= rating ? "var(--gold)" : "none"} color="var(--gold)" />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment"
        rows={2}
        className="w-full border rounded-lg px-2.5 py-1.5 text-xs"
        style={{ borderColor: "var(--border)" }}
      />
      <button onClick={submit} disabled={submitting || rating === 0} className="btn-primary text-xs w-full tap-scale" style={{ opacity: rating === 0 ? 0.5 : 1 }}>
        {submitting ? "Submitting…" : "Submit rating"}
      </button>
    </div>
  );
}