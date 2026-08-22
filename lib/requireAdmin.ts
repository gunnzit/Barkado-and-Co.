import { redirect } from "next/navigation";
import { getOrCreateUser } from "./auth";

// One-way only: not signed in -> /sign-in, signed in but not admin -> /.
// Neither of those routes redirects back into /admin based on role, so this
// can't form the kind of ping-pong the /provider <-> /provider/join loop did.
export async function requireAdmin() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}