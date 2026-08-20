"use client";

import { useEffect, useState } from "react";
import { useUser, useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import { ShieldCheck, Loader2 } from "lucide-react";

function describeClerkError(e: any): string {
  const first = e?.errors?.[0];
  if (first) {
    const parts = [first.code, first.message, first.longMessage].filter(Boolean);
    return parts.join(" — ");
  }
  if (e?.message) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
}

export default function PhoneVerification({ onVerified }: { onVerified: (phone: string) => void }) {
  const { user } = useUser();
  const existingVerified = user?.phoneNumbers?.find((p) => p.verification?.status === "verified");

  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"idle" | "code" | "verified">("idle");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pendingResource, setPendingResource] = useState<any>(null);

  const createPhoneNumber = useReverification((phoneNumber: string) => user!.createPhoneNumber({ phoneNumber }));

  useEffect(() => {
    if (existingVerified) {
      setPhone(existingVerified.phoneNumber);
      setStep("verified");
      onVerified(existingVerified.phoneNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingVerified?.id]);

  const sendCode = async () => {
    if (!user || !phone.trim()) return;
    setSending(true);
    setError("");
    try {
      const resource = await createPhoneNumber(phone);
      await resource.prepareVerification();
      setPendingResource(resource);
      setStep("code");
    } catch (e: any) {
      if (isReverificationCancelledError(e)) {
        setError("Verification cancelled.");
      } else {
        setError(describeClerkError(e));
      }
    }
    setSending(false);
  };

  const verifyCode = async () => {
    if (!pendingResource || !code.trim()) return;
    setSending(true);
    setError("");
    try {
      const result = await pendingResource.attemptVerification({ code });
      if (result.verification?.status === "verified") {
        setStep("verified");
        onVerified(phone);
      } else {
        setError("That code didn't match — try again.");
      }
    } catch (e: any) {
      setError(describeClerkError(e));
    }
    setSending(false);
  };

  if (step === "verified") {
    return (
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} color="var(--terracotta)" />
          <span className="text-sm">{phone}</span>
        </div>
        <button
          onClick={() => { setStep("idle"); setPhone(""); }}
          className="text-xs font-semibold tap-scale"
          style={{ color: "var(--muted)" }}
        >
          Use different number
        </button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="space-y-2">
        <p className="text-xs" style={{ color: "var(--muted)" }}>Enter the code sent to {phone}</p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="123456"
            className="flex-1 border rounded-xl px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={verifyCode} disabled={sending} className="btn-primary text-sm tap-scale px-4">
            {sending ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
          </button>
        </div>
        {error && <p className="text-xs break-words" style={{ color: "var(--terracotta)" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="tel"
          placeholder="+91 98765 43210"
          className="flex-1 border rounded-xl px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button onClick={sendCode} disabled={sending || !phone.trim()} className="btn-primary text-sm tap-scale px-4 whitespace-nowrap">
          {sending ? <Loader2 size={14} className="animate-spin" /> : "Send code"}
        </button>
      </div>
      {error && <p className="text-xs break-words" style={{ color: "var(--terracotta)" }}>{error}</p>}
    </div>
  );
}