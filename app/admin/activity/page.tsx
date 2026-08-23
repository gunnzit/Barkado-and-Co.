import Link from "next/link";
import { Eye, MousePointerClick } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminTabs from "@/components/AdminTabs";

function formatWhen(d: Date) {
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export default async function AdminActivityPage() {
  await requireAdmin();

  const events = await prisma.activityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { id: true, name: true } } },
  });

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto">
        <div className="px-6 pt-4 pb-5">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
          <h1 className="text-xl font-bold">Activity</h1>
        </div>

        <AdminTabs />

        <div className="px-6 space-y-1.5">
          {events.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No activity recorded yet.</p>
          ) : (
            events.map((ev) => {
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
            })
          )}
        </div>
      </main>
    </div>
  );
}