"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import HeroPetPhotoManager from "@/components/HeroPetPhotoManager";
import { useSwipeRotator } from "@/hooks/useSwipeRotator";
import { getMascotPath } from "@/lib/mascotImage";

// Fallback stock photos, always shown. A signed-in user's own uploaded
// photos (if any) are prepended to this list, for that user only.
const STOCK_IMAGES = [
  "/images/banner-instant-walk.jpg",
  "/images/hero-dog-black-lab.jpg",
  "/images/hero-dog-german-shepherd.jpg",
  "/images/hero-dog-beagle.jpg",
];

const INTERVAL_MS = 4000;

export default function HeroImageRotator({ activeBreed }: { activeBreed?: string | null } = {}) {
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const mascot = getMascotPath(activeBreed, "active");
  const images = userPhotos.length > 0 ? [...userPhotos, mascot, ...STOCK_IMAGES] : [mascot, ...STOCK_IMAGES];
  const { index, handlers } = useSwipeRotator(images.length, INTERVAL_MS);

  return (
    <div className="img-frame relative shadow-sm animate-fade-up overflow-hidden" style={{ minHeight: 340, touchAction: "pan-y", cursor: "grab" }} {...handlers}>
      {images.map((src, i) => {
        const diff = (i - index + images.length) % images.length;
        let transform = "translateX(0) scale(1)";
        let opacity = 0;
        let zIndex = 0;

        if (diff === 0) {
          transform = "translateX(0) scale(1)";
          opacity = 1;
          zIndex = 2;
        } else if (diff === 1) {
          transform = "translateX(100%) scale(0.96)";
          opacity = 0;
          zIndex = 1;
        } else {
          transform = "translateX(-100%) scale(0.96)";
          opacity = 0;
          zIndex = 0;
        }

        const commonStyle: React.CSSProperties = {
          position: "absolute",
          inset: 0,
          transform,
          opacity,
          zIndex,
          transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.45s ease",
        };

        if (src.endsWith(".svg")) {
          return (
            <div key={src} style={{ ...commonStyle, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={src} alt="Your dog" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
            </div>
          );
        }

        return (
          <Image
            key={src}
            src={src}
            alt="Dog"
            fill
            sizes="500px"
            className="object-cover"
            priority={i === 0}
            style={commonStyle}
          />
        );
      })}

      {/* Story-style progress dots — vertical, on the side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5" style={{ zIndex: 5 }}>
        {images.map((_, i) => (
          <div
            key={i}
            className="rounded-full bg-white/40 overflow-hidden"
            style={{
              width: 6,
              height: i === index ? 28 : 6,
              transition: "height 0.4s ease",
            }}
          >
            {i === index && (
              <div
                key={`${i}-${index}`}
                className="h-full w-full bg-white rounded-full"
                style={{
                  transformOrigin: "top",
                  animation: `heroDotFill ${INTERVAL_MS}ms linear forwards`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <HeroPetPhotoManager onPhotosChange={setUserPhotos} variant="overlay" />
    </div>
  );
}