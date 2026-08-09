"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Flame, PawPrint } from "lucide-react";
import WalkTransition from "@/components/WalkTransition";

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
  const router = useRouter();

  if (showWalkAnim) {
    return <WalkTransition onDone={() => router.push("/book?service=WALKING")} />;
  }

  return (
    <div className="relative w-full animate-fade-up overflow-hidden" style={{ height: 280 }}>
      <div className="absolute inset-0 walkhero-zoom">
        <Image src="/images/banner-instant-walk.jpg" alt="" fill sizes="700px" className="object-cover" priority />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(43,29,20,0.15) 0%, rgba(43,29,20,0.6) 100%)" }} />

      <Link
        href="/owner/profile"
        className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-2 rounded-full tap-scale"
        style={{ background: "rgba(0,0,0,0.35)" }}
        aria-label="Edit profile"
      >
        <Pencil size={13} color="white" />
        <span className="text-white text-xs font-semibold">Edit profile</span>
      </Link>

      {walksThisWeek > 0 && (
        <div
          className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ background: "rgba(232,169,74,0.9)" }}
        >
          <Flame size={13} color="#16281f" />
          <span className="text-xs font-bold" style={{ color: "#16281f" }}>
            {walksThisWeek} walk{walksThisWeek > 1 ? "s" : ""} this week
          </span>
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-8">
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

        <button
          onClick={() => setShowWalkAnim(true)}
          className="tap-scale walkhero-pulse flex items-center gap-2 px-4 py-2.5 rounded-full w-fit mt-2"
          style={{ background: "var(--terracotta, #c97a56)", color: "white" }}
        >
          <PawPrint size={14} />
          <span className="text-sm font-bold">Book {petName ?? "a"} walk</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes walkheroZoom {
          from { transform: scale(1); }
          to { transform: scale(1.12); }
        }
        .walkhero-zoom {
          animation: walkheroZoom 14s ease-out forwards;
        }
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
