import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CartClient from "@/components/CartClient";

export default async function CartPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  return <CartClient />;
}
