import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import SplashScreen from "@/components/SplashScreen";
import { CartProvider } from "@/components/CartProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import CartPill from "@/components/CartPill";
import BottomNav from "@/components/BottomNav";
import ActivityTracker from "@/components/ActivityTracker";
import PawPointsBadge from "@/components/PawPointsBadge";
import OwnerSideMenu from "@/components/OwnerSideMenu";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Barkado & Co. — Walkers & Sitters You Can Trust",
  description: "Book verified pet walkers and sitters near you, and stay on top of vaccinations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // IMPORTANT: this layout wraps every route in the app, including whatever
  // pages Clerk's middleware redirects to during its own sign-in handshake.
  // Calling auth()/getOrCreateUser() here (even indirectly) can fight with
  // that handshake and cause a redirect loop. CartProvider and
  // FavoritesProvider both intentionally start empty and fetch their real
  // data client-side, after mount, for the same reason — PawPointsBadge
  // follows the same pattern (renders nothing until its own client-side
  // fetch resolves).
  //
  // BottomNav is mounted here, as a sibling to {children}, rather than
  // inside each individual page — that's what keeps it visible during route
  // transitions (loading.tsx replaces {children}'s content, not this layout
  // itself, so BottomNav never unmounts). It self-hides via pathname check
  // on routes that have their own navigation (provider, admin, cart, etc).
  //
  // PawPointsBadge is mounted globally the same way, rather than edited
  // into every individual page's own header markup — a fixed floating
  // badge, consistent with how CartPill already works.
  //
  // OwnerSideMenu follows the same pattern, opposite corner (top-left) —
  // only Home relies on BottomNav alone now; every other owner page uses
  // this drawer trigger instead, self-hiding on Home/provider/admin/auth
  // pages via its own pathname check.
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body>
        <ClerkProvider>
          <SplashScreen />
          <ActivityTracker />
          <CartProvider initialItems={[]}>
            <FavoritesProvider>
              {children}
              <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 12px)", left: 12, zIndex: 60 }}>
                <OwnerSideMenu />
              </div>
              <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 12px)", right: 12, zIndex: 60 }}>
                <PawPointsBadge />
              </div>
              <CartPill />
              <BottomNav />
            </FavoritesProvider>
          </CartProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}