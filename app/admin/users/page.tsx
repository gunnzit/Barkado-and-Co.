import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminTabs from "@/components/AdminTabs";
import { PawPrint } from "lucide-react";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    where: { role: "OWNER" },
    include: { _count: { select: { pets: true, bookings: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto">
        <div className="px-6 pt-4 pb-5">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
          <h1 className="text-xl font-bold">Users</h1>
        </div>

        <AdminTabs />

        <div className="px-6 space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No users yet.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{u.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                </div>
                <div className="text-right text-xs" style={{ color: "var(--muted)" }}>
                  <p className="flex items-center gap-1 justify-end"><PawPrint size={11} /> {u._count.pets} pet{u._count.pets === 1 ? "" : "s"}</p>
                  <p>{u._count.bookings} booking{u._count.bookings === 1 ? "" : "s"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}