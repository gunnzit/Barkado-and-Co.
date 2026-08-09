import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/owner(.*)",
  "/provider(.*)",
  "/book(.*)",
  "/cart(.*)",
  "/api/pets(.*)",
  "/api/bookings(.*)",
  "/api/vaccinations(.*)",
  "/api/providers/me(.*)",
  "/api/cart(.*)",
  "/api/orders(.*)",
]);

export default clerkMiddleware(async (authFn, req) => {
  if (isProtectedRoute(req)) await authFn.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
};
