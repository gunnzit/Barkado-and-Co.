import Link from "next/link";
import { ArrowLeft, PawPrint, MousePointerClick, Eye, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

function formatWhen(d: Date) {
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      pets: true,
      addresses: true,
      bookings: { orderBy: { startTime: "desc" }, take: 10, include: { pet: true } },
      orders: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!user) notFound();

  const activity = await prisma.activityEvent.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 px-6 pt-4 pb-5">
          <Link href="/admin/users" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
            <h1 className="text-xl font-bold">{user.name}</h1>
          </div>
        </div>

        <div className="px-6 space-y-3 mb-6">
          <div className="card">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Profile</p>
            <p className="text-sm">{user.email}</p>
            {user.phone && <p className="text-sm mt-1">{user.phone}</p>}
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Joined {formatWhen(user.createdAt)}</p>
          </div>

          {(user.address || user.addresses.length > 0) && (
            <div className="card">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                <MapPin size={12} /> Address
              </p>
              {user.address && <p className="text-sm mb-2">{user.address}</p>}
              {user.addresses.map((a) => (
                <div key={a.id} className="text-sm mb-1">
                  <span className="font-semibold">{a.label}: </span>
                  {a.fullAddress} · {a.receiverPhone}
                </div>
              ))}
            </div>
          )}

          {user.pets.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                <PawPrint size={12} /> Pets
              </p>
              <div className="flex flex-wrap gap-2">
                {user.pets.map((p) => (
                  <span key={p.id} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                    {p.name}{p.breed ? ` · ${p.breed}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.bookings.length > 0 && (
            <div className="card">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Recent bookings</p>
              {user.bookings.map((b) => (
                <div key={b.id} className="text-xs py-1.5" style={{ borderTop: "1px solid var(--border)" }}>
                  {b.type} for {b.pet.name} · {b.status} · ₹{(b.priceAmount / 100).toFixed(0)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6">
          <p className="text-sm font-bold mb-3">Activity ({activity.length} recent events)</p>
          <div className="space-y-1.5">
            {activity.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No activity recorded yet.</p>
            ) : (
              activity.map((ev) => {
                const meta = ev.metadata as { text?: string; href?: string; tag?: string } | null;
                return (
                  <div key={ev.id} className="card flex items-start gap-2.5 py-2.5">
                    {ev.type === "PAGE_VIEW" ? (
                      <Eye size={14} color="var(--terracotta)" className="mt-0.5 shrink-0" />
                    ) : (
                      <MousePointerClick size={14} color="var(--muted)" className="mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">
                        {ev.type === "PAGE_VIEW" ? `Visited ${ev.path}` : `Clicked "${meta?.text || meta?.tag || "element"}"`}
                      </p>
                      {ev.type === "CLICK" && ev.path && (
                        <p className="text-[11px]" style={{ color: "var(--muted)" }}>on {ev.path}</p>
                      )}
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: "var(--muted)" }}>{formatWhen(ev.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}