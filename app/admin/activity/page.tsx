import Link from "next/link";
import { Eye, MousePointerClick, Users, Activity as ActivityIcon, User, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminTabs from "@/components/AdminTabs";
import { DailyTrendChart, TopBarChart } from "@/components/AdminActivityCharts";

const PAGE_SIZE = 30;

function formatWhen(d: Date) {
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date(startOfToday);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [
    totalPageViews,
    totalClicks,
    eventsToday,
    identifiedVisitorRows,
    recentForTrend,
    topPagesRaw,
    byUserRaw,
    recentClicksForAgg,
    totalEventCount,
    pageOfEvents,
  ] = await Promise.all([
    prisma.activityEvent.count({ where: { type: "PAGE_VIEW" } }),
    prisma.activityEvent.count({ where: { type: "CLICK" } }),
    prisma.activityEvent.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.activityEvent.findMany({ where: { userId: { not: null } }, distinct: ["userId"], select: { userId: true } }),
    prisma.activityEvent.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { type: true, createdAt: true },
    }),
    prisma.activityEvent.groupBy({
      by: ["path"],
      where: { type: "PAGE_VIEW", path: { not: null } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    }),
    prisma.activityEvent.groupBy({
      by: ["userId"],
      where: { userId: { not: null } },
      _count: true,
      orderBy: { _count: { userId: "desc" } },
      take: 20,
    }),
    // metadata is JSON, which Prisma can't groupBy directly — aggregated in
    // JS below from the most recent 1000 clicks. Fine at current volume;
    // worth revisiting with raw SQL if this table gets much larger.
    prisma.activityEvent.findMany({
      where: { type: "CLICK" },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: { metadata: true },
    }),
    prisma.activityEvent.count(),
    prisma.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  // Daily trend — bucket the last 14 days
  const buckets: Record<string, { pageViews: number; clicks: number }> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    buckets[d.toISOString().slice(0, 10)] = { pageViews: 0, clicks: 0 };
  }
  recentForTrend.forEach((e) => {
    const key = e.createdAt.toISOString().slice(0, 10);
    if (!buckets[key]) return;
    if (e.type === "PAGE_VIEW") buckets[key].pageViews++;
    else buckets[key].clicks++;
  });
  const dailyTrend = Object.entries(buckets).map(([date, v]) => ({ date, ...v }));

  const topPages = topPagesRaw.map((p) => ({ label: p.path ?? "unknown", count: p._count.path }));

  const byUserIds = byUserRaw.map((r) => r.userId!).filter(Boolean);
  const byUserProfiles = await prisma.user.findMany({
    where: { id: { in: byUserIds } },
    select: { id: true, name: true, email: true },
  });
  const byUser = byUserRaw
    .map((r) => {
      const profile = byUserProfiles.find((u) => u.id === r.userId);
      if (!profile) return null;
      return { id: profile.id, name: profile.name, email: profile.email, count: r._count };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const clickCounts: Record<string, number> = {};
  recentClicksForAgg.forEach((e) => {
    const meta = e.metadata as { text?: string; tag?: string } | null;
    const label = meta?.text || meta?.tag || "unknown";
    clickCounts[label] = (clickCounts[label] ?? 0) + 1;
  });
  const topClicks = Object.entries(clickCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  const totalPages = Math.max(1, Math.ceil(totalEventCount / PAGE_SIZE));

  const stats = [
    { label: "Page views", value: totalPageViews, icon: Eye },
    { label: "Clicks", value: totalClicks, icon: MousePointerClick },
    { label: "Identified visitors", value: identifiedVisitorRows.length, icon: Users },
    { label: "Events today", value: eventsToday, icon: ActivityIcon },
  ];

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto">
        <div className="px-6 pt-4 pb-5">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
          <h1 className="text-xl font-bold">Activity</h1>
        </div>

        <AdminTabs />

        <div className="px-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: "var(--cream)" }}>
                    <Icon size={15} color="var(--terracotta)" />
                  </div>
                  <p className="text-2xl font-bold">{s.value.toLocaleString("en-IN")}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="card">
            <p className="text-sm font-bold mb-3">Last 14 days</p>
            <DailyTrendChart data={dailyTrend} />
          </div>

          {topPages.length > 0 && (
            <div className="card">
              <p className="text-sm font-bold mb-3">Most visited pages</p>
              <TopBarChart data={topPages} color="#c97a56" />
            </div>
          )}

          {topClicks.length > 0 && (
            <div className="card">
              <p className="text-sm font-bold mb-3">Most clicked</p>
              <TopBarChart data={topClicks} color="#16281f" />
            </div>
          )}

          {byUser.length > 0 && (
            <div className="card">
              <p className="text-sm font-bold mb-3">By user</p>
              <div className="space-y-1">
                {byUser.map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/users/${u.id}`}
                    className="flex items-center gap-3 py-2 tap-scale"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                      <User size={14} color="var(--terracotta)" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{u.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{u.email}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>
                      {u.count}
                    </span>
                    <ChevronRight size={14} color="var(--muted)" className="shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-bold mb-3">Recent log</p>
            <div className="space-y-1.5">
              {pageOfEvents.map((ev) => {
                const meta = ev.metadata as { text?: string; tag?: string } | null;
                return (
                  <div key={ev.id} className="card flex items-start gap-2.5 py-2.5">
                    {ev.type === "PAGE_VIEW" ? (
                      <Eye size={14} color="var(--terracotta)" className="mt-0.5 shrink-0" />
                    ) : (
                      <MousePointerClick size={14} color="var(--muted)" className="mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">
                        {ev.user ? (
                          <Link href={`/admin/users/${ev.user.id}`} className="underline">{ev.user.name}</Link>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>Anonymous</span>
                        )}{" "}
                        {ev.type === "PAGE_VIEW" ? `visited ${ev.path}` : `clicked "${meta?.text || meta?.tag || "element"}"`}
                      </p>
                      {ev.type === "CLICK" && ev.path && (
                        <p className="text-[11px]" style={{ color: "var(--muted)" }}>on {ev.path}</p>
                      )}
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: "var(--muted)" }}>{formatWhen(ev.createdAt)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4">
              <Link
                href={`/admin/activity?page=${Math.max(1, page - 1)}`}
                className="text-xs font-semibold tap-scale"
                style={{ color: page <= 1 ? "var(--border)" : "var(--terracotta)", pointerEvents: page <= 1 ? "none" : "auto" }}
              >
                ← Newer
              </Link>
              <span className="text-xs" style={{ color: "var(--muted)" }}>Page {page} of {totalPages}</span>
              <Link
                href={`/admin/activity?page=${Math.min(totalPages, page + 1)}`}
                className="text-xs font-semibold tap-scale"
                style={{ color: page >= totalPages ? "var(--border)" : "var(--terracotta)", pointerEvents: page >= totalPages ? "none" : "auto" }}
              >
                Older →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}