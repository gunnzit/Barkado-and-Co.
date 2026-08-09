"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  priceAmount: number;
  pet: { name: string };
  owner: { name: string };
};

export default function ProviderDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = async () => {
    const res = await fetch("/api/bookings");
    if (res.ok) setBookings(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-extrabold mb-6">Booking requests</h1>
      <div className="space-y-3">
        {bookings.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No bookings yet.</p>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="card flex justify-between items-center">
            <div>
              <p className="font-semibold">
                {b.type} · {b.pet.name} for {b.owner.name}
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()}
              </p>
              <p className="text-sm">₹{(b.priceAmount / 100).toFixed(0)} · {b.status}</p>
            </div>
            {b.status === "REQUESTED" && (
              <div className="flex gap-2">
                <button className="btn-primary text-sm" onClick={() => updateStatus(b.id, "ACCEPTED")}>
                  Accept
                </button>
                <button
                  className="text-sm px-3 py-2 rounded-lg border"
                  onClick={() => updateStatus(b.id, "DECLINED")}
                >
                  Decline
                </button>
              </div>
            )}
            {b.status === "ACCEPTED" && (
              <button className="btn-primary text-sm" onClick={() => updateStatus(b.id, "IN_PROGRESS")}>
                Start
              </button>
            )}
            {b.status === "IN_PROGRESS" && (
              <button className="btn-primary text-sm" onClick={() => updateStatus(b.id, "COMPLETED")}>
                Complete
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
