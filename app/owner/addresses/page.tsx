import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import TaskHeader from "@/components/TaskHeader";
import AddressesClient from "@/components/AddressesClient";

export default async function AddressesPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, label: true, fullAddress: true, receiverName: true, receiverPhone: true, isDefault: true },
  });

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto pb-12">
        <TaskHeader title="Saved addresses" fallbackHref="/owner/profile" showCart={false} />
        <div className="px-4 pt-2">
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            The address marked <b>In use</b> is where walkers, groomers and trainers come, and where we deliver.
          </p>
          <AddressesClient initial={addresses} currentAddress={user.address} defaultName={user.name} defaultPhone={user.phone} />
        </div>
      </main>
    </div>
  );
}
