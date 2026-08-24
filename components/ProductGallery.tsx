"use client";

import { useRef, useState } from "react";

export default function ProductGallery({
  imageUrls,
  fallbackIcon,
}: {
  imageUrls: string[];
  fallbackIcon?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);

  if (imageUrls.length === 0) {
    return (
      <div className="w-full rounded-2xl flex items-center justify-center" style={{ height: 280, background: "var(--cream)" }}>
        {fallbackIcon}
      </div>
    );
  }

  const handleTouchEnd = (endX: number) => {
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) < 40) return; // ignore small taps/jitter
    if (delta < 0 && index < imageUrls.length - 1) setIndex(index + 1);
    if (delta > 0 && index > 0) setIndex(index - 1);
  };

  return (
    <div>
      <div
        className="w-full rounded-2xl overflow-hidden relative"
        style={{ height: 280, background: "var(--cream)" }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientX)}
      >
        <img src={imageUrls[index]} alt="" className="w-full h-full object-cover" />
      </div>

      {imageUrls.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-3">
          {imageUrls.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="tap-scale rounded-full"
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                background: i === index ? "var(--terracotta)" : "var(--border)",
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