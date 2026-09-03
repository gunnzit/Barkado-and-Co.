import Link from "next/link";
import { ArrowLeft, Sparkles, PawPrint, ShoppingBag, AlertCircle, Users, Star } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getPawPointsBalance, getRollingTierPoints, tierForPoints, getExpiringPoints,
  redemptionValuePaise, GOLD_TIER_THRESHOLD, PLATINUM_TIER_THRESHOLD, POINTS_EXPIRY_DAYS,
} from "@/lib/pawPoints";
import PawPointsRewardsSection from "@/components/PawPointsRewardsSection";
import PawPointsLedger from "@/components/PawPointsLedger";

export default async function WalletPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const [balance, rollingTierPoints, expiringSoon, transactions, rewards] = await Promise.all([
    getPawPointsBalance(user.id),
    getRollingTierPoints(user.id),
    getExpiringPoints(user.id, 7),
    prisma.pawPointsTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.pawPointsReward.findMany({ where: { active: true }, include: { product: true } }),
  ]);

  const tier = tierForPoints(rollingTierPoints);
  const nextThreshold = tier === "Explorer" ? GOLD_TIER_THRESHOLD : tier === "Gold Explorer" ? PLATINUM_TIER_THRESHOLD : null;
  const nextTierName = tier === "Explorer" ? "Gold Explorer" : tier === "Gold Explorer" ? "Platinum" : null;
  const progressPct = nextThreshold ? Math.min(100, (rollingTierPoints / nextThreshold) * 100) : 100;

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-6 pt-4 pb-5">
          <Link href="/owner/profile" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">PawPoints Wallet</h1>
        </div>

        <div className="px-6">
          {/* ===== Hero balance + tier ===== */}
          <div className="rounded-2xl p-6 relative overflow-hidden mb-4" style={{ background: "var(--panel-dark)", color: "white" }}>
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <Sparkles size={13} color="var(--gold)" /> Available Points
                </p>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <Star size={12} color="var(--gold)" fill="var(--gold)" /> {tier}
                </span>
              </div>
              <h2 className="text-4xl font-bold mb-1">{balance.toLocaleString("en-IN")} pts</h2>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                Worth ₹{(redemptionValuePaise(balance) / 100).toFixed(2)} toward any service or product
              </p>

              {nextThreshold && (
                <div className="rounded-lg p-3.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium">{Math.max(0, nextThreshold - rollingTierPoints)} pts until {nextTierName}</span>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{rollingTierPoints} / {nextThreshold} pts</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "var(--gold)" }} />
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Based on points earned in the last {POINTS_EXPIRY_DAYS} days — real tier perks (priority booking, bonus earning rate) aren't finalized yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {expiringSoon > 0 && (
            <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2.5" style={{ background: "#fdece5", color: "#a5652a" }}>
              <AlertCircle size={16} />
              <p className="text-xs font-semibold">{expiringSoon} pts expire within 7 days — redeem them before they're gone.</p>
            </div>
          )}

          {/* ===== Real earning info — flat rate, no fake category multipliers ===== */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Earn on Every Purchase</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="card">
                <ShoppingBag size={18} color="var(--terracotta)" className="mb-2" />
                <p className="font-semibold text-sm">Products</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>1 pt per ₹10 spent</p>
              </div>
              <div className="card">
                <PawPrint size={18} color="var(--terracotta)" className="mb-2" />
                <p className="font-semibold text-sm">Services</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>1 pt per ₹10 spent</p>
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              Points expire {POINTS_EXPIRY_DAYS} days after being earned if unused.
            </p>
          </div>
        </div>

        <PawPointsRewardsSection
          rewards={rewards.map((r) => ({
            id: r.id, name: r.name, description: r.description, costPoints: r.costPoints,
            rewardType: r.rewardType, discountValuePaise: r.discountValuePaise,
            applicableServiceType: r.applicableServiceType, productName: r.product?.name ?? null,
          }))}
          balance={balance}
        />

        {/* ===== Missions/Referrals — explicitly inert placeholder. Not a
            real feature yet: the founders still need to decide the actual
            missions, referral reward amounts, and gamification rules
            before this becomes real. ===== */}
        <section className="px-6 mt-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold">Ways to Collect More Points</h2>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>
              Coming soon
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Missions, referrals, and reviews-for-points are planned but not decided yet — final rules still need sign-off.
          </p>
          <div className="card flex items-center gap-3 opacity-60">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
              <Users size={17} color="var(--muted)" />
            </div>
            <div>
              <p className="font-semibold text-sm">Referrals &amp; Missions</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Details to be finalized</p>
            </div>
          </div>
        </section>

        <PawPointsLedger transactions={transactions.map((t) => ({ id: t.id, type: t.type, points: t.points, createdAt: t.createdAt.toISOString() }))} />
      </main>
    </div>
  );
}