import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import WishlistList from "@/components/WishlistList";

export default async function WishlistPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="pb-24 px-5 pt-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/profile" className="tap-scale">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Wishlist</h1>
      </div>

      <WishlistList />

      <BottomNav />
    </main>
  );
}