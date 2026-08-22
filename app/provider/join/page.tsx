import { redirect } from "next/navigation";

// /provider now renders the join form inline when needed, so this route is
// kept only so old links/bookmarks still land somewhere sensible. It always
// redirects one-way to /provider — never the reverse — so it can't form a
// ping-pong with that page.
export default function ProviderJoinRedirectPage() {
  redirect("/provider");
}