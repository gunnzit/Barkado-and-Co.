import Link from "next/link";
import { ArrowLeft, PawPrint, ShieldCheck, Wallet, Clock, Mail, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import ProviderDashboard from "@/components/ProviderDashboard";
import ProviderJoinForm from "@/components/ProviderJoinForm";
import ProviderOnlineToggle from "@/components/ProviderOnlineToggle";
import { expireStaleBookings } from "@/lib/expireStaleBookings";

const BENEFITS = [
  { icon: Wallet, title: "Set your own prices", desc: "You decide what you charge for each service you offer." },
  { icon: Clock, title: "Work your own hours", desc: "Set your weekly availability — only get requests when you're actually free." },
  { icon: ShieldCheck, title: "Verified, trusted platform", desc: "Owners book you knowing you're a real, verified provider." },
];

export default async function ProviderPage() {
  const user = await getOrCreateUser();

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
              Takes about a minute — pick your services, verify your details, done.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });

  if (!provider) {
    return (
      <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
        <main className="pb-16 max-w-lg mx-auto">
          <div className="flex items-center gap-3 px-6 pt-4 pb-5">
            <Link href="/" className="tap-scale">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold">Become a provider</h1>
          </div>
          <ProviderJoinForm userEmail={user.email} userPhone={user.phone} />
        </main>
      </div>
    );
  }

  if (!provider.verified) {
    return (
      <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
        <main className="pb-16 max-w-lg mx-auto">
          <div className="flex items-center gap-3 px-6 pt-4 pb-5">
            <Link href="/" className="tap-scale">
              <ArrowLeft size={20} />
            </Link>
          </div>
          <div className="px-6 text-center py-14">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fdece0" }}>
              <Clock size={28} color="#a5652a" />
            </div>
            <h1 className="text-xl font-bold mb-2">Your request is being reviewed</h1>
            <p className="text-sm mb-2 max-w-xs mx-auto" style={{ color: "var(--muted)" }}>
              We're checking your details. This usually doesn't take long.
            </p>
            <p className="text-xs flex items-center justify-center gap-1.5 mb-8" style={{ color: "var(--muted)" }}>
              <Mail size={12} /> We'll email {user.email} once you're approved.
            </p>
            <Link href="/" className="btn-secondary tap-scale inline-block">Back to home</Link>
          </div>
        </main>
      </div>
    );
  }

  await expireStaleBookings();

  const bookings = await prisma.booking.findMany({
    where: { providerId: provider.id },
    include: {
      pet: { select: { name: true } },
      owner: { select: { name: true, ratingAvg: true, ratingCount: true } },
      ownerReview: { select: { rating: true } },
    },
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
    .filter((b) => ["COMPLETED", "CANCELLED", "DECLINED", "EXPIRED"].includes(b.status))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 20)
    .map(serialize);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-lg mx-auto">
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <ProviderOnlineToggle />
            <Link href="/" className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
              Switch to owner view
            </Link>
          </div>
        </div>

        {/* ===== Instagram-style profile header ===== */}
        <div className="px-6 pb-5 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
          >
            {provider.photoUrl ? (
              <img src={provider.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User size={26} color="var(--muted)" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{user.name}</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {provider.bio || "No bio yet — add one in Services"}
            </p>
          </div>
        </div>

        <ProviderDashboard requests={requests as any} schedule={schedule as any} history={history as any} />
      </main>
    </div>
  );
}