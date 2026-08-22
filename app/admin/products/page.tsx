import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminTabs from "@/components/AdminTabs";
import AdminProductToggleButton from "@/components/AdminProductToggleButton";

export default async function AdminProductsPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-2xl mx-auto">
        <div className="px-6 pt-4 pb-5">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
          <h1 className="text-xl font-bold">Products</h1>
        </div>

        <AdminTabs />

        <p className="px-6 text-xs mb-4" style={{ color: "var(--muted)" }}>
          Activate/deactivate accessories here. Adding new products or editing details isn't built yet — that still needs the seed script.
        </p>

        <div className="px-6 space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No products yet.</p>
          ) : (
            products.map((p) => (
              <div key={p.id} className="card flex items-center justify-between" style={{ opacity: p.active ? 1 : 0.55 }}>
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{p.category} · ₹{(p.price / 100).toFixed(0)}</p>
                </div>
                <AdminProductToggleButton productId={p.id} active={p.active} />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}