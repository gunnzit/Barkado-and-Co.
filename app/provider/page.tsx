import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import ProviderDashboard from "@/components/ProviderDashboard";
import ProviderJoinForm from "@/components/ProviderJoinForm";

export default async function ProviderPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });

  // No redirect to a separate /provider/join route on purpose — a redirect
  // that depends on database state, paired with another redirect going the
  // other way on that route, can ping-pong if the resolved user/session is
  // ever inconsistent between requests. Rendering both states on this one
  // route removes that possibility entirely.
  if (!provider) {
    return (
      <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
        <main className="pb-16 max-w-lg mx-auto">
          <div className="flex items-center gap-3 px-6 pt-4 pb-5">
            <Link href="/" className="tap-scale">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold">Become a provider</h1>
          </div>
          <p className="px-6 text-sm mb-6" style={{ color: "var(--muted)" }}>
            Set up your provider profile to start receiving booking requests.
          </p>
          <ProviderJoinForm />
        </main>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { providerId: provider.id },
    include: { pet: { select: { name: true } }, owner: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });

  const serialize = (b: (typeof bookings)[number]) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
  });

  const requests = bookings.filter((b) => b.status === "REQUESTED").map(serialize);
  const schedule = bookings
    .filter((b) => b.status === "ACCEPTED" || b.status === "IN_PROGRESS")
    .map(serialize);
  const history = bookings
    .filter((b) => ["COMPLETED", "CANCELLED", "DECLINED"].includes(b.status))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 20)
    .map(serialize);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-lg mx-auto">
        <div className="flex items-center justify-between px-6 pt-4 pb-5">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Provider dashboard</p>
            <h1 className="text-xl font-bold">{user.name}</h1>
          </div>
          <Link href="/" className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
            Switch to owner view
          </Link>
        </div>

        <ProviderDashboard requests={requests as any} schedule={schedule as any} history={history as any} />
      </main>
    </div>
  );
}