"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Flame, PawPrint } from "lucide-react";
import WalkTransition from "@/components/WalkTransition";
import HeroPetPhotoManager from "@/components/HeroPetPhotoManager";

// Fallback stock photos, always shown. The signed-in user's own uploaded
// photos (if any) are prepended to this list, for that user only.
const STOCK_PHOTOS = [
  "/images/banner-instant-walk.jpg",
  "/images/hero-dog-black-lab.jpg",
  "/images/hero-dog-german-shepherd.jpg",
  "/images/hero-dog-beagle.jpg",
];
const INTERVAL_MS = 4000;

export default function WalkHero({
  firstName,
  petName,
  petPhoto,
  walksThisWeek,
}: {
  firstName: string;
  petName: string | null;
  petPhoto: string | null;
  walksThisWeek: number;
}) {
  const [showWalkAnim, setShowWalkAnim] = useState(false);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const photos = userPhotos.length > 0 ? [...userPhotos, ...STOCK_PHOTOS] : STOCK_PHOTOS;
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setIndex(0);
  }, [photos.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [photos.length]);

  if (showWalkAnim) {
    return <WalkTransition onDone={() => router.push("/book?service=WALKING")} />;
  }

  return (
    <div className="relative w-full animate-fade-up overflow-hidden" style={{ height: 280 }}>
      {photos.map((src, i) => {
        const diff = (i - index + photos.length) % photos.length;
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
          <div key={src} className="absolute inset-0" style={{ transform, opacity, zIndex, transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.45s ease" }}>
            <Image src={src} alt="" fill sizes="700px" className="object-cover" priority={i === 0} />
          </div>
        );
      })}

      <div className="absolute inset-0" style={{ zIndex: 3, background: "linear-gradient(180deg, rgba(43,29,20,0.15) 0%, rgba(43,29,20,0.6) 100%)" }} />

      <Link
        href="/owner/profile"
        className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-2 rounded-full tap-scale"
        style={{ background: "rgba(0,0,0,0.35)", zIndex: 4 }}
        aria-label="Edit profile"
      >
        <Pencil size={13} color="white" />
        <span className="text-white text-xs font-semibold">Edit profile</span>
      </Link>

      {walksThisWeek > 0 && (
        <div
          className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ background: "rgba(232,169,74,0.9)", zIndex: 4 }}
        >
          <Flame size={13} color="#16281f" />
          <span className="text-xs font-bold" style={{ color: "#16281f" }}>
            {walksThisWeek} walk{walksThisWeek > 1 ? "s" : ""} this week
          </span>
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-8" style={{ zIndex: 4 }}>
        <div className="flex items-center gap-3 mb-2">
          {petPhoto && (
            <div
              className="w-11 h-11 rounded-full overflow-hidden shrink-0"
              style={{ border: "2px solid white" }}
            >
              <img src={petPhoto} alt={petName ?? "Pet"} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            {petName ? (
              <>
                <p className="text-white/80 text-sm font-medium">Hi {firstName || "there"},</p>
                <h1 className="text-white text-3xl font-bold leading-tight">Is {petName} ready to walk?</h1>
              </>
            ) : (
              <>
                <p className="text-white/80 text-sm font-medium">Good to see you,</p>
                <h1 className="text-white text-3xl font-bold leading-tight">{firstName || "pet parent"}</h1>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <button
            onClick={() => setShowWalkAnim(true)}
            className="tap-scale walkhero-pulse flex items-center gap-2 px-4 py-2.5 rounded-full w-fit"
            style={{ background: "var(--terracotta, #c97a56)", color: "white" }}
          >
            <PawPrint size={14} />
            <span className="text-sm font-bold">Book {petName ?? "a"} walk</span>
          </button>
          <HeroPetPhotoManager onPhotosChange={setUserPhotos} variant="inline" />
        </div>
      </div>

      {/* Story-style progress dots — vertical, on the side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5" style={{ zIndex: 5 }}>
        {photos.map((_, i) => (
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

      <style jsx>{`
        @keyframes walkheroPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201, 122, 86, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(201, 122, 86, 0); }
        }
        .walkhero-pulse {
          animation: walkheroPulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}