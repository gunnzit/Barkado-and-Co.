"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { User, PawPrint, LogOut, ShieldCheck } from "lucide-react";

export default function ProfileMenu() {
  const { isSignedIn, user } = useUser();
  const { signOut, openSignIn } = useClerk();
  const [open, setOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Purely additive check — only shows the provider entry for accounts that
  // actually have a Provider record. A 403/404 here just means "not a
  // provider," which is the normal case for almost everyone.
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/provider/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setIsProvider(true);
          setPendingCount(data.pendingRequestsCount ?? 0);
        }
      })
      .catch(() => {});
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <button onClick={() => openSignIn()} className="btn-primary text-xs sm:text-sm tap-scale">
        Sign in
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full overflow-hidden tap-scale shrink-0"
        style={{ border: "1px solid var(--border)" }}
        aria-label="Account menu"
      >
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName ?? "Profile"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--cream)" }}>
            <User size={16} color="var(--terracotta)" />
          </div>
        )}
        {isProvider && pendingCount > 0 && (
          <span
            className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full"
            style={{ background: "var(--terracotta)", border: "1.5px solid var(--card)" }}
          />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: 190 }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold truncate">{user?.fullName ?? "Your account"}</p>
              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <Link
              href="/owner/profile"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 tap-scale text-sm font-medium"
            >
              <User size={15} color="var(--muted)" /> Profile
            </Link>
            <Link
              href="/owner/pets"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 tap-scale text-sm font-medium"
            >
              <PawPrint size={15} color="var(--muted)" /> Your pets
            </Link>
            {isProvider && (
              <Link
                href="/provider"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 tap-scale text-sm font-medium"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <ShieldCheck size={15} color="var(--muted)" />
                <span className="flex-1">Provider dashboard</span>
                {pendingCount > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--terracotta)", color: "white" }}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 tap-scale text-sm font-medium text-left"
              style={{ color: "var(--terracotta)", borderTop: "1px solid var(--border)" }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}