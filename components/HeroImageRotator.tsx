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

export default function HeroImageRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000); // change photo every 4 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="img-frame relative shadow-sm animate-fade-up" style={{ minHeight: 340 }}>
      {HERO_IMAGES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt="Dog"
          fill
          sizes="500px"
          className="object-cover"
          priority={i === 0}
          style={{
            opacity: i === index ? 1 : 0,
            transition: "opacity 1s ease-in-out",
            position: "absolute",
            inset: 0,
          }}
        />
      ))}
    </div>
  );
}