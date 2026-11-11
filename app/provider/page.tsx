import Link from "next/link";
import { ArrowLeft, PawPrint, ShieldCheck, Wallet, Clock, Mail, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import ProviderDashboard from "@/components/ProviderDashboard";
import ProviderJoinForm from "@/components/ProviderJoinForm";
import ProviderJoinHero, { ProviderHowItWorks } from "@/components/ProviderJoinHero";
import ProviderOnlineToggle from "@/components/ProviderOnlineToggle";
import { expireStaleBookings } from "@/lib/expireStaleBookings";
import { isApplicationSubmitted } from "@/lib/providerApplication";

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
        <main className="pb-28 max-w-lg mx-auto">
          <ProviderJoinHero />

          <div className="px-4 space-y-5">
            <Link href="/sign-in?redirect_url=/provider" className="w-full tap-scale flex items-center justify-center h-12 rounded-full font-bold text-sm shadow-md" style={{ background: "#f9dd8a", color: "#3d1426", fontFamily: "var(--font-heading)" }}>
              Apply now
            </Link>

            <section>
              <h2 className="text-lg font-bold mb-3">Why join Barkado &amp; Co.?</h2>
              <div className="space-y-2.5">
                {BENEFITS.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div key={b.title} className="card !p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef3dc" }}>
                        <Icon size={18} color="var(--terracotta)" />
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: "var(--terracotta)" }}>{b.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <ProviderHowItWorks />

            <div>
              <Link href="/sign-in?redirect_url=/provider" className="btn-primary w-full tap-scale text-center block">
                Sign in to start your application
              </Link>
              <p className="text-xs text-center mt-3" style={{ color: "var(--muted)" }}>
                Takes about 5 minutes. Keep your phone number, a clear photo and your ID handy.
              </p>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-[11px] pt-2" style={{ color: "var(--muted)" }}>
              <PawPrint size={12} color="var(--terracotta)" /> Barkado &amp; Co. · A Hug in every Paw
            </p>
          </div>
        </main>
      </div>
    );
  }

  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    include: { _count: { select: { bookings: { where: { status: "COMPLETED" } } } } },
  });

  // A Provider row exists from the moment services are chosen (step 1), so
  // "row exists" does not mean "application sent". Someone who closed the app
  // mid-way must land back in the form, not on the "being reviewed" screen.
  if (!provider || (!provider.verified && !isApplicationSubmitted(provider))) {
    return (
      <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
        <main className="pb-16 max-w-lg mx-auto">
          <ProviderJoinHero compact />
          <ProviderJoinForm
            userEmail={user.email}
            userPhone={user.phone}
            initial={
              provider
                ? {
                    services: provider.servicesOffered,
                    photoUrl: provider.photoUrl,
                    hasDocument: provider.verificationDocs.length > 0,
                    bio: provider.bio ?? "",
                    serviceCity: provider.serviceCity ?? "",
                  }
                : null
            }
          />
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
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fdf1d6" }}>
              <Clock size={28} color="#8a2a4d" />
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
      pet: { select: { name: true, photoUrl: true, breed: true } },
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
      {/* max-w-lg on mobile (unchanged), uncapped on desktop so
          ProviderDashboard's own lg:flex sidebar+content split (and its
          lg:max-w-6xl mx-auto) actually has room to take effect — this
          outer wrapper was clamping width regardless of screen size before. */}
      <main className="pb-16 max-w-lg lg:max-w-none mx-auto">
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <PawPrint size={20} color="var(--forest, #3d1426)" />
            <span className="font-bold text-lg">Barkado Pro</span>
          </div>
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

        <ProviderDashboard
          requests={requests as any}
          schedule={schedule as any}
          history={history as any}
          servicesOffered={provider.servicesOffered as any}
          providerId={provider.id}
          providerName={user.name}
          photoUrl={provider.photoUrl}
          ratingAvg={provider.ratingAvg}
          completedCount={provider._count.bookings}
          sponsoredUntil={{
            WALKING: provider.sponsoredWalkingUntil ? provider.sponsoredWalkingUntil.toISOString() : null,
            SITTING: provider.sponsoredSittingUntil ? provider.sponsoredSittingUntil.toISOString() : null,
            GROOMING: provider.sponsoredGroomingUntil ? provider.sponsoredGroomingUntil.toISOString() : null,
            TRAINING: provider.sponsoredTrainingUntil ? provider.sponsoredTrainingUntil.toISOString() : null,
            HOMEPAGE: provider.sponsoredHomepageUntil ? provider.sponsoredHomepageUntil.toISOString() : null,
          }}
        />

      </main>
    </div>
  );
}