"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProviderOnboarding() {
  const router = useRouter();
  const [form, setForm] = useState({
    bio: "",
    services: { WALKING: false, SITTING: false },
    serviceAreaPin: "",
    pricePerWalk: "",
    pricePerSitDay: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const servicesOffered = Object.entries(form.services)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: form.bio,
        servicesOffered,
        serviceAreaPin: form.serviceAreaPin,
        pricePerWalk: form.pricePerWalk ? Number(form.pricePerWalk) * 100 : undefined,
        pricePerSitDay: form.pricePerSitDay ? Number(form.pricePerSitDay) * 100 : undefined,
      }),
    });
    if (res.ok) router.push("/provider/dashboard");
  };

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-extrabold mb-2">Become a provider</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Your profile will be reviewed before you go live.
      </p>
      <form onSubmit={submit} className="card space-y-3">
        <textarea
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Tell owners about yourself"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.services.WALKING}
              onChange={(e) => setForm({ ...form, services: { ...form.services, WALKING: e.target.checked } })}
            />
            Walking
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.services.SITTING}
              onChange={(e) => setForm({ ...form, services: { ...form.services, SITTING: e.target.checked } })}
            />
            Sitting
          </label>
        </div>
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Service area PIN code"
          value={form.serviceAreaPin}
          onChange={(e) => setForm({ ...form, serviceAreaPin: e.target.value })}
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Price per walk (₹)"
          type="number"
          value={form.pricePerWalk}
          onChange={(e) => setForm({ ...form, pricePerWalk: e.target.value })}
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Price per sitting day (₹)"
          type="number"
          value={form.pricePerSitDay}
          onChange={(e) => setForm({ ...form, pricePerSitDay: e.target.value })}
        />
        <button type="submit" className="btn-primary">Submit for review</button>
      </form>
    </main>
  );
}
