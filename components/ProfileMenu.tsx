"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { User, PawPrint, LogOut } from "lucide-react";

export default function ProfileMenu() {
  const { isSignedIn, user } = useUser();
  const { signOut, openSignIn } = useClerk();
  const [open, setOpen] = useState(false);

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
        className="w-9 h-9 rounded-full overflow-hidden tap-scale shrink-0"
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
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 tap-scale text-sm font-medium text-left"
              style={{ color: "var(--terracotta)" }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}