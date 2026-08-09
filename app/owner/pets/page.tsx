import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PetsClient from "@/components/PetsClient";

export default async function PetsPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  return <PetsClient />;
}
