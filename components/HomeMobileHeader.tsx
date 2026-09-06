import Link from "next/link";
import LocationHeader from "@/components/LocationHeader";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileMenu from "@/components/ProfileMenu";
import CuratedSearchBar from "@/components/CuratedSearchBar";
import CategoryTabs from "@/components/CategoryTabs";

// Shared header chrome for BOTH signed-in mobile homepage variants
// (new-user and returning-user) — brand/address, Book Now + profile
// access, real search, and the category icon row. This was previously
// only inline in the single marketing page; when that got split into two
// separate components, this header was accidentally dropped from both
// rather than carried over. Centralizing it here means it can't silently
// go missing from one variant again the way it did the first time.
export default function HomeMobileHeader({
  userAddress,
  userPhone,
}: {
  userAddress: string | null;
  userPhone: string | null;
}) {
  return (
    <>
      <nav className="flex justify-between items-center px-4 pt-3 pb-2">
        <LocationHeader
          currentAddressSnippet={userAddress ? userAddress.split(",")[0] : null}
          userPhone={userPhone}
        />
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <Link href="/owner/dashboard" className="btn-primary text-xs whitespace-nowrap">Book now</Link>
          <ProfileMenu />
        </div>
      </nav>

      <div className="px-4 mb-3">
        <CuratedSearchBar />
      </div>

      <CategoryTabs />
    </>
  );
}