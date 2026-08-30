import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Briefcase, Award, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProviderPlansTabs from "@/components/ProviderPlansTabs";
import ProviderGroomingPackages from "@/components/ProviderGroomingPackages";
import { SAMPLE_ROLE_TITLES, SAMPLE_SPECIALTIES, SAMPLE_CERTIFICATIONS, sampleIndexFor } from "@/lib/trainerSampleData";

function timeAgo(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

export default async function TrainerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ petId?: string; start?: string; service?: string }>;
}) {
  const { petId, start, service } = await searchParams;
  const { id } = await params;

  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  // Carried over from the Schedule & Pet screen, via URL params, so this
  // context is ready to attach to a real booking. Grooming's Add to Cart
  // uses petId/start/address/phone for real; Training's plan buttons are
  // still disabled, so this context is display-only there for now.
  const contextPet = petId ? await prisma.pet.findUnique({ where: { id: petId }, select: { name: true, size: true } }) : null;
  const contextDateLabel = start
    ? new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      groomingPackages: { orderBy: { createdAt: "asc" } },
      bookings: {
        select: {
          status: true,
          cancelledBy: true,
          review: { select: { rating: true, comment: true, createdAt: true } },
          owner: { select: { name: true } },
        },
      },
    },
  });

  // Training or Grooming providers get a real profile page. Walking/
  // Sitting provider cards stay non-clickable until this is extended to
  // them, per product decision.
  if (!provider || !provider.verified || !(provider.servicesOffered.includes("TRAINING") || provider.servicesOffered.includes("GROOMING"))) {
    notFound();
  }

  const completedCount = provider.bookings.filter((b) => b.status === "COMPLETED").length;
  const badCount = provider.bookings.filter(
    (b) => b.status === "DECLINED" || b.status === "EXPIRED" || (b.status === "CANCELLED" && b.cancelledBy === "PROVIDER")
  ).length;
  const totalCount = provider.bookings.length;
  const reliabilityScore = totalCount === 0 ? 100 : Math.round((1 - badCount / totalCount) * 100);

  // Real reviews — pulled from actual completed bookings' Review records,
  // newest first. If none exist yet, the page shows an honest "No reviews
  // yet" state rather than fabricated testimonials.
  const reviews = provider.bookings
    .filter((b) => b.review)
    .map((b) => ({ rating: b.review!.rating, comment: b.review!.comment, createdAt: b.review!.createdAt, reviewerName: b.owner.name }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const roleTitle = SAMPLE_ROLE_TITLES[sampleIndexFor(provider.id, SAMPLE_ROLE_TITLES.length)];
  const experience = ["3 years", "5+ years", "8+ years", "2 years"][sampleIndexFor(provider.id, 4)];
  const specialties = SAMPLE_SPECIALTIES[sampleIndexFor(provider.id, SAMPLE_SPECIALTIES.length)];
  const certifications = SAMPLE_CERTIFICATIONS[sampleIndexFor(provider.id, SAMPLE_CERTIFICATIONS.length)];

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3" style={{ background: "var(--cream)" }}>
        <Link href="/training" className="tap-scale p-2 rounded-full">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-base">
          {service === "GROOMING" ? "Groomer Profile" : service === "TRAINING" ? "Trainer Profile" : "Provider Profile"}
        </h1>
        <div style={{ width: 36 }} />
      </header>

      {contextPet && contextDateLabel && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 mb-4">
          <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
            Booking for <strong>{contextPet.name}</strong>, starting <strong>{contextDateLabel}</strong>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 md:px-8 pb-16 md:grid md:grid-cols-12 md:gap-8">
        {/* ===== Left column: hero, about, specialties, certifications ===== */}
        <div className="md:col-span-4 space-y-4 mb-6 md:mb-0">
          <section className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", boxShadow: "0 4px 20px -2px rgba(22,40,31,0.06)" }}>
            <div className="relative" style={{ height: 160, background: "var(--cream)" }}>
              {/* Same real photo used for both the banner and the avatar
                  below — there's only one real photo field on Provider,
                  no separate "action shot" image to draw from. */}
              {provider.photoUrl && (
                <img src={provider.photoUrl} alt="" className="w-full h-full object-cover" />
              )}
              <div
                className="absolute -bottom-12 left-6 w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                style={{ border: "4px solid var(--card)", background: "var(--cream)", boxShadow: "0 8px 20px -4px rgba(22,40,31,0.12)" }}
              >
                {provider.photoUrl ? (
                  <img src={provider.photoUrl} alt={provider.user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={32} color="var(--muted)" />
                )}
              </div>
            </div>
            <div className="pt-16 px-6 pb-6">
              <h2 className="text-xl font-bold mb-0.5">{provider.user.name}</h2>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{roleTitle}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--cream)" }}>
                  <Star size={14} fill="var(--gold)" color="var(--gold)" /> {provider.ratingAvg.toFixed(1)} ({completedCount})
                </span>
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--cream)" }}>
                  <Briefcase size={14} color="var(--terracotta)" /> {experience}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "0 4px 20px -2px rgba(22,40,31,0.06)" }}>
            <h3 className="font-bold text-lg mb-3">About {provider.user.name.split(" ")[0]}</h3>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              {provider.bio || "This trainer hasn't added a bio yet."}
            </p>

            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Specialties</p>
              <div className="flex flex-wrap gap-2">
                {specialties.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--cream)", color: "var(--forest, #16281f)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Certifications</p>
              <div className="space-y-2.5">
                {certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                      <Award size={14} color="var(--forest, #16281f)" />
                    </div>
                    <span className="text-sm">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ===== Right column: plans/packages, reviews. When we know
            which service the visitor was actually browsing (via the
            `service` param, set when linking here from ServiceBookingFlow),
            show that section only — a provider offering both Training and
            Grooming shouldn't show the wrong one first, or both stacked,
            confusing someone who came here for one specific service. If
            no context is known (e.g. a bookmarked/shared link), fall back
            to showing whichever sections genuinely apply. ===== */}
        <div className="md:col-span-8 space-y-4">
          {(service ? service === "TRAINING" : provider.servicesOffered.includes("TRAINING")) && (
            <section className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "0 4px 20px -2px rgba(22,40,31,0.06)" }}>
              <ProviderPlansTabs basePricePaise={provider.pricePerTrain ?? 50000} />
            </section>
          )}

          {(service ? service === "GROOMING" : provider.servicesOffered.includes("GROOMING")) && (
            <section className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "0 4px 20px -2px rgba(22,40,31,0.06)" }}>
              <ProviderGroomingPackages
                providerId={provider.id}
                packages={provider.groomingPackages.map((p) => ({ id: p.id, name: p.name, pricesBySize: p.pricesBySize as any }))}
                availableSizes={provider.groomingSizes}
                petId={petId ?? null}
                petSize={contextPet?.size ?? null}
                start={start ?? null}
                address={user.address ?? null}
                phone={user.phone ?? null}
              />
            </section>
          )}

          <section className="rounded-2xl p-6" style={{ background: "var(--card)", boxShadow: "0 4px 20px -2px rgba(22,40,31,0.06)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Recent Reviews</h3>
              {reviews.length > 0 && (
                <span className="text-sm font-semibold" style={{ color: "var(--terracotta)" }}>
                  {reviews.length} review{reviews.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-10">
                <Star size={28} color="var(--muted)" className="mx-auto mb-3" />
                <p className="font-semibold text-sm mb-1">No reviews yet</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  This trainer hasn't been reviewed yet — you could be the first.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {reviews.slice(0, 10).map((r, i) => (
                  <div key={i} className="pb-5" style={{ borderBottom: i < reviews.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                        <User size={16} color="var(--muted)" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{r.reviewerName}</p>
                        <div className="flex" style={{ color: "var(--gold)" }}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} size={13} fill={j < r.rating ? "var(--gold)" : "none"} color="var(--gold)" />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>{timeAgo(r.createdAt)}</span>
                    </div>
                    {r.comment && <p className="text-sm" style={{ color: "var(--muted)" }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}