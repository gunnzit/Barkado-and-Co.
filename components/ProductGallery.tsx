"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";

export default function ProductGallery({
  imageUrls,
  fallbackIcon,
  shareTitle,
}: {
  imageUrls: string[];
  fallbackIcon?: React.ReactNode;
  shareTitle: string;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);

  const handleTouchEnd = (endX: number) => {
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) < 40 || imageUrls.length <= 1) return;
    if (delta < 0 && index < imageUrls.length - 1) setIndex(index + 1);
    if (delta > 0 && index > 0) setIndex(index - 1);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
      } catch {
        // user cancelled — no-op
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      className="w-full relative"
      style={{ height: 340, background: "var(--cream)" }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientX)}
    >
      {imageUrls.length > 0 ? (
        <img src={imageUrls[index]} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">{fallbackIcon}</div>
      )}

      <Link
        href="/accessories"
        className="tap-scale absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.4)" }}
        aria-label="Back"
      >
        <ArrowLeft size={18} color="white" />
      </Link>

      <button
        onClick={share}
        className="tap-scale absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.4)" }}
        aria-label="Share"
      >
        <Share2 size={16} color="white" />
      </button>

      {imageUrls.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1.5">
          {imageUrls.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="tap-scale rounded-full"
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                background: i === index ? "white" : "rgba(255,255,255,0.5)",
                transition: "width 200ms ease",
              }}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}