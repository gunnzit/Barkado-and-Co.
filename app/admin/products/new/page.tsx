import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/requireAdmin";
import AdminProductForm from "@/components/AdminProductForm";

export default async function AdminNewProductPage() {
  await requireAdmin();

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-6 pt-4 pb-5">
          <Link href="/admin/products" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Add product</h1>
        </div>
        <AdminProductForm />
      </main>
    </div>
  );
}