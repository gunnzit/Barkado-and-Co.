import Link from "next/link";
import { ArrowLeft, PawPrint, Scissors, GraduationCap, Home as HomeIcon, ShoppingBag, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { CancelBookingButton, RateBookingForm, RescheduleForm } from "@/components/BookingActions";
import { expireStaleBookings } from "@/lib/expireStaleBookings";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};

const SERVICE_ICON: Record<string, any> = {
  WALKING: PawPrint,
  SITTING: HomeIcon,
  GROOMING: Scissors,
  TRAINING: GraduationCap,
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  REQUESTED: { bg: "#fdece0", text: "#a5652a" },
  ACCEPTED: { bg: "#e3f0e6", text: "#2f7a44" },
  IN_PROGRESS: { bg: "#e3f0e6", text: "#2f7a44" },
  COMPLETED: { bg: "var(--cream)", text: "var(--terracotta)" },
  CANCELLED: { bg: "#f3e8e8", text: "#a53a3a" },
  DECLINED: { bg: "#f3e8e8", text: "#a53a3a" },
  EXPIRED: { bg: "#f3e8e8", text: "#a53a3a" },
};

function formatWhen(d: Date) {
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default async function OwnerBookingsPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  await expireStaleBookings();

  const [bookings, orders] = await Promise.all([
    prisma.booking.findMany({
      where: { ownerId: user.id },
      include: {
        pet: { select: { name: true } },
        provider: { include: { user: { select: { name: true } } } },
        review: true,
      },
      orderBy: { startTime: "desc" },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-28 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-6 pt-4 pb-5">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Your bookings</h1>
        </div>

        <section className="px-6 mb-8">
          <h2 className="text-sm font-bold mb-3">Services</h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>No service bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const Icon = SERVICE_ICON[b.type];
                const statusStyle = STATUS_COLOR[b.status] ?? { bg: "var(--cream)", text: "var(--muted)" };
                const canCancel = b.status === "REQUESTED" || b.status === "ACCEPTED";
                const canRate = b.status === "COMPLETED" && !b.review;
                return (
                  <div key={b.id} className="card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                          <Icon size={18} color="var(--terracotta)" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{SERVICE_LABEL[b.type]}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            For {b.pet.name} · with {b.provider.user.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--muted)" }}>{formatWhen(b.startTime)}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-sm">₹{(b.priceAmount / 100).toFixed(0)}</span>
                      {canCancel && <CancelBookingButton bookingId={b.id} />}
                    </div>
                    {canCancel && (
                      <div className="mt-2">
                        <RescheduleForm bookingId={b.id} currentStart={b.startTime.toISOString()} />
                      </div>
                    )}
                    {b.review && (
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--muted)" }}>
                        <Star size={11} fill="var(--gold)" color="var(--gold)" /> You rated {b.review.rating}/5
                      </p>
                    )}
                    {canRate && <RateBookingForm bookingId={b.id} />}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="px-6">
          <h2 className="text-sm font-bold mb-3">Accessory orders</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                        <ShoppingBag size={18} color="var(--terracotta)" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {o.items.map((i) => i.product.name).join(", ") || "Order"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {o.items.reduce((sum, i) => sum + i.quantity, 0)} item{o.items.length === 1 ? "" : "s"} · {formatWhen(o.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                      style={o.status === "PAID" ? { background: "#e3f0e6", color: "#2f7a44" } : { background: "var(--cream)", color: "var(--muted)" }}
                    >
                      {o.status}
                    </span>
                  </div>
                  <span className="font-bold text-sm">₹{(o.totalAmount / 100).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}