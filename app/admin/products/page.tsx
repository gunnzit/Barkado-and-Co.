import Link from "next/link";
import { Plus } from "lucide-react";
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
        <div className="flex items-center justify-between px-6 pt-4 pb-5">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Admin</p>
            <h1 className="text-xl font-bold">Products</h1>
          </div>
          <Link href="/admin/products/new" className="btn-primary text-sm tap-scale flex items-center gap-1.5">
            <Plus size={15} /> Add
          </Link>
        </div>

        <AdminTabs />

        <div className="px-6 space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--muted)" }}>No products yet.</p>
          ) : (
            products.map((p) => (
              <div key={p.id} className="card flex items-center gap-3" style={{ opacity: p.active ? 1 : 0.55 }}>
                <div
                  className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "var(--cream)" }}
                >
                  {p.imageUrls[0] ? (
                    <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>No photo</span>
                  )}
                </div>
                <Link href={`/admin/products/${p.id}/edit`} className="flex-1 min-w-0 tap-scale">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{p.category} · ₹{(p.price / 100).toFixed(0)}</p>
                </Link>
                <AdminProductToggleButton productId={p.id} active={p.active} />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}