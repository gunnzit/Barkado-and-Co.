import Link from "next/link";
import { Users, ShieldCheck, ClipboardList, ShoppingBag, IndianRupee, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOwners,
    totalProviders,
    pendingProviders,
    totalBookings,
    completedBookings,
    bookingRevenueAgg,
    orderRevenueAgg,
    activeProducts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.provider.count(),
    prisma.provider.count({ where: { verified: false } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.aggregate({
      where: { status: "COMPLETED", startTime: { gte: startOfMonth } },
      _sum: { priceAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.product.count({ where: { active: true } }),
  ]);

  const monthRevenuePaise = (bookingRevenueAgg._sum.priceAmount ?? 0) + (orderRevenueAgg._sum.totalAmount ?? 0);

  const stats = [
    { label: "Pet owners", value: totalOwners, icon: Users },
    { label: "Providers", value: totalProviders, icon: ShieldCheck },
    { label: "Total bookings", value: totalBookings, icon: ClipboardList },
    { label: "Completed", value: completedBookings, icon: ClipboardList },
    { label: "Active products", value: activeProducts, icon: ShoppingBag },
  ];

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto">
        <div className="px-6 pt-4 pb-5">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
          <h1 className="text-xl font-bold">Overview</h1>
        </div>

        <AdminTabs />

        <div className="px-6 space-y-3">
          <div className="card animate-fade-up" style={{ background: "var(--panel-dark)", color: "white", border: "none" }}>
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee size={15} color="var(--gold)" />
              <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Revenue this month</p>
            </div>
            <p className="text-3xl font-bold">₹{(monthRevenuePaise / 100).toLocaleString("en-IN")}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>Services + accessories, paid orders only</p>
          </div>

          {pendingProviders > 0 && (
            <Link
              href="/admin/providers"
              className="card tap-scale animate-fade-up flex items-center justify-between"
              style={{ background: "#fdece0", border: "1px solid #e8a94a" }}
            >
              <div className="flex items-center gap-3">
                <Clock size={18} color="#a5652a" />
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#a5652a" }}>
                    {pendingProviders} provider{pendingProviders === 1 ? "" : "s"} awaiting approval
                  </p>
                  <p className="text-xs" style={{ color: "#a5652a" }}>Review and verify →</p>
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card animate-fade-up">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2" style={{ background: "var(--cream)" }}>
                    <Icon size={16} color="var(--terracotta)" />
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}