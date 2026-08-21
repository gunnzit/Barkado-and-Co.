import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import ProviderJoinForm from "@/components/ProviderJoinForm";

export default async function ProviderJoinPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (existing) redirect("/provider");

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-16 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-6 pt-4 pb-5">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">Become a provider</h1>
        </div>
        <p className="px-6 text-sm mb-6" style={{ color: "var(--muted)" }}>
          Set up your provider profile to start receiving booking requests.
        </p>
        <ProviderJoinForm />
      </main>
    </div>
  );
}