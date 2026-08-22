import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import SplashScreen from "@/components/SplashScreen";
import { CartProvider } from "@/components/CartProvider";
import CartPill from "@/components/CartPill";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
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
  // that handshake and cause a redirect loop. CartProvider intentionally
  // starts empty and fetches the real cart itself, client-side, after mount.
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <ClerkProvider>
          <SplashScreen />
          <CartProvider initialItems={[]}>
            {children}
            <CartPill />
          </CartProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}