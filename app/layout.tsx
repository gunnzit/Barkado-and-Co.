import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import SplashScreen from "@/components/SplashScreen";
import { CartProvider } from "@/components/CartProvider";
import CartPill from "@/components/CartPill";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getOrCreateUser().catch(() => null);

  const cartItemsRaw = user
    ? await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: {
          product: true,
          provider: { include: { user: { select: { name: true } } } },
          pet: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Dates need to cross the server → client boundary as strings.
  const initialItems = cartItemsRaw.map((item) => ({
    ...item,
    startTime: item.startTime ? item.startTime.toISOString() : null,
    endTime: item.endTime ? item.endTime.toISOString() : null,
  }));

  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <ClerkProvider>
          <SplashScreen />
          <CartProvider initialItems={initialItems as any}>
            {children}
            <CartPill />
          </CartProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}