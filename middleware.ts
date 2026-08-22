import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/owner(.*)",
  "/provider(.*)",
  "/admin(.*)",
  "/book(.*)",
  "/cart(.*)",
  "/api/pets(.*)",
  "/api/bookings(.*)",
  "/api/vaccinations(.*)",
  "/api/providers/me(.*)",
  // "/api/cart(.*)" removed — the cart routes already check auth themselves
  // and return a proper JSON 401. Leaving it here made Clerk's middleware
  // intercept the request first and return a bare 404 instead, which broke
  // the "open sign-in modal" flow on the client (it only recognized 401).
  "/api/orders(.*)",
  "/api/admin(.*)",
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