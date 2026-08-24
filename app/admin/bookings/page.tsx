import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminTabs from "@/components/AdminTabs";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk", SITTING: "Home Staycation", GROOMING: "Luxury Spa Session", TRAINING: "Good Manners Programme",
};

const STATUS_FILTERS = ["ALL", "REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DECLINED", "EXPIRED"];

function formatWhen(d: Date) {
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const activeStatus = status && STATUS_FILTERS.includes(status) ? status : "ALL";

  const bookings = await prisma.booking.findMany({
    where: activeStatus === "ALL" ? {} : { status: activeStatus as any },
    include: {
      pet: { select: { name: true } },
      owner: { select: { name: true } },
      provider: { include: { user: { select: { name: true } } } },
    },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto">
        <div className="px-6 pt-4 pb-5">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
          <h1 className="text-xl font-bold">Bookings</h1>
        </div>

        <AdminTabs />

        <div className="flex gap-2 px-6 mb-4 overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={s === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${s}`}
              className="tap-scale px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0"
              style={{
                background: activeStatus === s ? "var(--terracotta)" : "var(--card)",
                color: activeStatus === s ? "white" : "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              {s}
            </Link>
          ))}
        </div>

        <div className="px-6 space-y-3">
          {bookings.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No bookings found.</p>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-semibold text-sm">{SERVICE_LABEL[b.type]}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                    {b.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {b.pet.name} · owner {b.owner.name} · provider {b.provider.user.name}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {formatWhen(b.startTime)} · ₹{(b.priceAmount / 100).toFixed(0)}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}