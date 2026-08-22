import Link from "next/link";
import { ArrowLeft, PawPrint, ShieldCheck, Wallet, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import ProviderDashboard from "@/components/ProviderDashboard";
import ProviderJoinForm from "@/components/ProviderJoinForm";

const BENEFITS = [
  { icon: Wallet, title: "Set your own prices", desc: "You decide what you charge for each service you offer." },
  { icon: Clock, title: "Work your own hours", desc: "Set your weekly availability — only get requests when you're actually free." },
  { icon: ShieldCheck, title: "Verified, trusted platform", desc: "Owners book you knowing you're a real, verified provider." },
];

export default async function ProviderPage() {
  const user = await getOrCreateUser();

  // Signed-out visitors get a real explanation of what this is, not an
  // immediate bounce to sign-in with zero context.
  if (!user) {
    return (
      <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
        <main className="pb-16 max-w-lg mx-auto">
          <div className="flex items-center gap-3 px-6 pt-4 pb-5">
            <Link href="/" className="tap-scale">
              <ArrowLeft size={20} />
            </Link>
          </div>

          <div className="px-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
              <PawPrint size={26} color="var(--terracotta)" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Become a Barkado provider</h1>
            <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
              Walk, groom, train, or sit for pets near you — on your own schedule, at your own price.
            </p>

            <div className="space-y-3 mb-8">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="card flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                      <Icon size={16} color="var(--terracotta)" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{b.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href="/sign-in?redirect_url=/provider" className="btn-primary w-full tap-scale text-center block">
              Sign in to get started
            </Link>
            <p className="text-xs text-center mt-3" style={{ color: "var(--muted)" }}>
              Takes about a minute — pick your services, set your prices, done.
            </p>
          </div>
        </main>
      </div>
    );
  }

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