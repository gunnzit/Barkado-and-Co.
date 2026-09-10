import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationsClient from "@/components/NotificationsClient";

export default async function NotificationsPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  return (
    <NotificationsClient
      initial={{
        notifyBookingUpdates: user.notifyBookingUpdates,
        notifyVaccineReminders: user.notifyVaccineReminders,
        notifyPromotions: user.notifyPromotions,
      }}
    />
  );
}