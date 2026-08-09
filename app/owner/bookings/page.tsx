import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default async function OwnerBookings() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const bookings = await prisma.booking.findMany({
    where: { ownerId: user.id },
    include: { provider: { include: { user: true } }, pet: true },
    orderBy: { startTime: "desc" },
  });

  return (
    <main className="pb-24 px-5 pt-8">
      <h1 className="text-2xl font-extrabold mb-6">Your bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card">
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold">{b.pet.name} · {b.type}</p>
                <span className="chip" style={{ background: "#fff0e6", color: "var(--accent-orange-dark)" }}>
                  {b.status}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                with {b.provider.user.name} · {new Date(b.startTime).toLocaleString()}
              </p>
              <p className="text-sm font-medium mt-1">₹{(b.priceAmount / 100).toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}
      <BottomNav />
    </main>
  );
}
