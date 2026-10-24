import { redirect } from "next/navigation";

// The old single-page onboarding form posted straight to the public providers
// API and skipped verification. All onboarding now happens at /provider.
export default function ProviderOnboardingRedirectPage() {
  redirect("/provider");
}