import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminPawPointsRewardsClient from "@/components/AdminPawPointsRewardsClient";

export default async function AdminPawPointsRewardsPage() {
  const user = await getOrCreateUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const [rewards, products] = await Promise.all([
    prisma.pawPointsReward.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">PawPoints Rewards</h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
        Manage the redeemable reward catalog — real ₹ discounts or a specific free product for a fixed point cost.
      </p>
      <AdminPawPointsRewardsClient
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        initialRewards={rewards.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          costPoints: r.costPoints,
          rewardType: r.rewardType,
          discountValuePaise: r.discountValuePaise,
          applicableServiceType: r.applicableServiceType,
          productName: r.product?.name ?? null,
          active: r.active,
        }))}
      />
    </div>
  );
}