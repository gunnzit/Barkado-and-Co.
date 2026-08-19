"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

let scriptLoadingPromise: Promise<void> | null = null;
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    (window as any).__googleMapsReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=__googleMapsReady`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Address",
}: {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false;

    loadGoogleMapsScript(apiKey).then(async () => {
      if (cancelled || !containerRef.current) return;
      const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
      const el = new PlaceAutocompleteElement();
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(el);

      el.addEventListener("gmp-select", async ({ placePrediction }: any) => {
        const place = placePrediction.toPlace();
        await place.fetchFields({ fields: ["formattedAddress"] });
        onChange(place.formattedAddress ?? "");
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // No API key configured yet — fall back to a plain text field instead of breaking the form.
  if (!apiKey) {
    return (
      <input
        type="text"
        placeholder={placeholder}
        className="w-full border rounded-xl px-3 py-2 text-sm"
        style={{ borderColor: "var(--border)" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return <div ref={containerRef} className="w-full" style={{ minHeight: 40 }} />;
}