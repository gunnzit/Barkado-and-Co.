import Link from "next/link";
import { ArrowLeft, Sparkles, Plus, Minus, RotateCcw } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPawPointsBalance, redemptionValuePaise } from "@/lib/pawPoints";

const TYPE_META: Record<string, { label: string; icon: any; sign: "+" | "-"; color: string }> = {
  EARNED: { label: "Earned", icon: Plus, sign: "+", color: "var(--forest, #16281f)" },
  REDEEMED: { label: "Redeemed", icon: Minus, sign: "-", color: "var(--terracotta)" },
  EARNED_REVERSED: { label: "Refund adjustment", icon: RotateCcw, sign: "-", color: "var(--heritage-red, #c0392b)" },
  REDEEMED_REVERSED: { label: "Refund adjustment", icon: RotateCcw, sign: "+", color: "var(--forest, #16281f)" },
};

export default async function WalletPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const [balance, transactions] = await Promise.all([
    getPawPointsBalance(user.id),
    prisma.pawPointsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

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
          <div className="rounded-2xl p-6 relative overflow-hidden mb-6" style={{ background: "var(--panel-dark)", color: "white" }}>
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                <Sparkles size={13} color="var(--gold)" /> Your Balance
              </p>
              <h2 className="text-4xl font-bold mb-1">{balance.toLocaleString("en-IN")} pts</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                Worth ₹{(redemptionValuePaise(balance) / 100).toFixed(2)} toward any service or product
              </p>
            </div>
          </div>

          <div className="card mb-6">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>How it works</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Earn 1 point for every ₹10 you spend on services and products. Every point is worth ₹0.25 — redeem them toward any future purchase.
            </p>
          </div>

          <p className="font-bold text-sm mb-3">Recent Activity</p>
          {transactions.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-sm" style={{ color: "var(--muted)" }}>No PawPoints activity yet — points are earned automatically on your next purchase.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {transactions.map((t) => {
                  const meta = TYPE_META[t.type] ?? TYPE_META.EARNED;
                  const Icon = meta.icon;
                  return (
                    <div key={t.id} className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                        <Icon size={14} color={meta.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{meta.label}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {t.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <p className="font-bold text-sm shrink-0" style={{ color: meta.color }}>
                        {meta.sign}{t.points} pts
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}