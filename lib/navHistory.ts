"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/*
 * Counts client-side page changes since the app loaded. document.referrer
 * never changes on in-app navigation, so back buttons use this to know
 * whether there is a page of ours to go back to.
 */
let inAppNavigations = 0;

export function hasInAppHistory() {
  return inAppNavigations > 0;
}

export function NavTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    inAppNavigations += 1;
  }, [pathname]);
  return null;
}
