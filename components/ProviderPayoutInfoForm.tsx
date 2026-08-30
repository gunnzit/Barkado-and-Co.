"use client";

import { useState } from "react";

export default function ProviderPayoutInfoForm({ onSaved }: { onSaved: () => void }) {
  const [method, setMethod] = useState<"BANK" | "UPI">("BANK");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [vpa, setVpa] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSave =
    method === "BANK"
      ? accountNumber.trim().length >= 4 && ifsc.trim().length >= 4 && holderName.trim().length > 0
      : vpa.trim().length >= 3;

  const save = async () => {
    setSaving(true);
    setError("");
    const body =
      method === "BANK"
        ? { payoutMethod: "BANK", bankAccountNumber: accountNumber.trim(), bankIFSC: ifsc.trim().toUpperCase(), bankAccountHolderName: holderName.trim() }
        : { payoutMethod: "UPI", upiVpa: vpa.trim() };

    const res = await fetch("/api/provider/payout-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      setError("Couldn't save — please check your details and try again.");
    }
  };

  return (
    <div className="space-y-3 pt-3 mt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex gap-2">
        {(["BANK", "UPI"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className="tap-scale flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: method === m ? "var(--panel-dark)" : "var(--cream)",
              color: method === m ? "white" : "inherit",
            }}
          >
            {m === "BANK" ? "Bank Account" : "UPI"}
          </button>
        ))}
      </div>

      {method === "BANK" ? (
        <>
          <input
            type="text"
            placeholder="Account holder name"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
          <input
            type="text"
            placeholder="Account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
          <input
            type="text"
            placeholder="IFSC code"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm uppercase"
            style={{ borderColor: "var(--border)" }}
          />
        </>
      ) : (
        <input
          type="text"
          placeholder="yourname@bank"
          value={vpa}
          onChange={(e) => setVpa(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      )}

      {error && <p className="text-xs" style={{ color: "var(--terracotta)" }}>{error}</p>}

      <button onClick={save} disabled={!canSave || saving} className="btn-primary w-full text-sm tap-scale" style={{ opacity: !canSave || saving ? 0.5 : 1 }}>
        {saving ? "Saving…" : "Save payout details"}
      </button>
    </div>
  );
}