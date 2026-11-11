import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import SplashScreen from "@/components/SplashScreen";
import { CartProvider } from "@/components/CartProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import CartPill from "@/components/CartPill";
import BottomNav from "@/components/BottomNav";
import ActivityTracker from "@/components/ActivityTracker";
import OwnerSideMenu from "@/components/OwnerSideMenu";
import "./globals.css";

// Stand-ins until the brand fonts (Gulfs Display / Artifakt Element / Sugar Loved)
// are supplied — see BRAND.md. Outfit = rounded display headings, Plus Jakarta
// Sans = UI/body text (the pairing from the Stitch design system).
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  // data client-side, after mount, for the same reason.
  //
  // BottomNav is mounted here, as a sibling to {children}, rather than
  // inside each individual page — that's what keeps it visible during route
  // transitions (loading.tsx replaces {children}'s content, not this layout
  // itself, so BottomNav never unmounts). It self-hides via pathname check
  // on routes that have their own navigation (provider, admin, cart, etc).
  //
  // OwnerSideMenu follows the same pattern, opposite corner (top-left) —
  // only Home relies on BottomNav alone now; every other owner page uses
  // this drawer trigger instead, self-hiding on Home/provider/admin/auth
  // pages via its own pathname check.
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <body>
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#6e1e3b",
              colorBackground: "#fffaf0",
              colorForeground: "#3d1426",
              colorInput: "#ffffff",
              colorInputForeground: "#3d1426",
            },
          }}
        >
          <SplashScreen />
          <ActivityTracker />
          <CartProvider initialItems={[]}>
            <FavoritesProvider>
              {children}
              <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 12px)", left: 12, zIndex: 60 }}>
                <OwnerSideMenu />
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