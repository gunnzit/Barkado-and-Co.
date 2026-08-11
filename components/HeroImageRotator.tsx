"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Add more image paths here as you get more photos.
// Drop the actual files into /public/images/ with matching filenames.
const HERO_IMAGES = [
  "/images/banner-instant-walk.jpg",
  "/images/hero-dog-black-lab.jpg",
  "/images/hero-dog-german-shepherd.jpg",
  "/images/hero-dog-beagle.jpg",
];

const INTERVAL_MS = 4000; // how long each photo stays up

export default function HeroImageRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="img-frame relative shadow-sm animate-fade-up overflow-hidden" style={{ minHeight: 340 }}>
      {HERO_IMAGES.map((src, i) => {
        // Position each photo relative to the active one: current photo sits in
        // place, the one about to appear waits just below, everything already
        // shown is parked just above (out of view) so it "pops" in from the
        // bottom like an Apple Photos / Stories transition, not a cross-fade.
        const diff = (i - index + HERO_IMAGES.length) % HERO_IMAGES.length;
        let transform = "translateY(0) scale(1)";
        let opacity = 0;
        let zIndex = 0;

        if (diff === 0) {
          transform = "translateY(0) scale(1)";
          opacity = 1;
          zIndex = 2;
        } else if (diff === 1) {
          transform = "translateY(100%) scale(0.96)";
          opacity = 0;
          zIndex = 1;
        } else {
          transform = "translateY(-100%) scale(0.96)";
          opacity = 0;
          zIndex = 0;
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
            style={{
              position: "absolute",
              inset: 0,
              transform,
              opacity,
              zIndex,
              transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.45s ease",
            }}
          />
        );
      })}

      {/* Story-style progress dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {HERO_IMAGES.map((_, i) => (
          <div
            key={i}
            className="rounded-full bg-white/40 overflow-hidden"
            style={{
              height: 6,
              width: i === index ? 28 : 6,
              transition: "width 0.4s ease",
            }}
          >
            {i === index && (
              <div
                key={`${i}-${index}`}
                className="h-full w-full bg-white rounded-full"
                style={{
                  transformOrigin: "left",
                  animation: `heroDotFill ${INTERVAL_MS}ms linear forwards`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}