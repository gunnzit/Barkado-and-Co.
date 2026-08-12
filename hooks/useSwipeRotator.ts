"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSwipeRotator(itemCount: number, intervalMs: number) {
  const [index, setIndexRaw] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (itemCount <= 1) return;
    timerRef.current = setInterval(() => {
      setIndexRaw((prev) => (prev + 1) % itemCount);
    }, intervalMs);
  }, [itemCount, intervalMs]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  useEffect(() => {
    setIndexRaw(0);
  }, [itemCount]);

  const goTo = (i: number) => {
    if (itemCount === 0) return;
    setIndexRaw(((i % itemCount) + itemCount) % itemCount);
    resetTimer();
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const SWIPE_THRESHOLD = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD) prev();
    else if (delta < -SWIPE_THRESHOLD) next();
    touchStartX.current = null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current === null) return;
    const delta = e.clientX - mouseStartX.current;
    if (delta > SWIPE_THRESHOLD) prev();
    else if (delta < -SWIPE_THRESHOLD) next();
    mouseStartX.current = null;
  };

  return {
    index,
    handlers: { onTouchStart, onTouchEnd, onMouseDown, onMouseUp },
  };
}