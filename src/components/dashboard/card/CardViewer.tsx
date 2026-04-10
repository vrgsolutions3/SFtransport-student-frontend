"use client";

import { useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { swipeDisabledRef } from "@/components/dashboard/SwipeNavigator";

interface CardViewerProps {
  cardSides: { front: string; back: string } | null;
  lightboxOpen: boolean;
  onOpenLightbox: () => void;
  onSlideChange: (index: number) => void;
}

export function CardViewer({
  cardSides,
  lightboxOpen,
  onOpenLightbox,
  onSlideChange,
}: CardViewerProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchReleaseTimeoutRef = useRef<number | null>(null);

  const handleSlideChange = (index: number) => {
    setActiveSlide(index);
    onSlideChange(index);
  };

  return (
    <>
      <div
        className="mx-auto w-4/5 mb-4 cursor-zoom-in"
        onClick={onOpenLightbox}
        onTouchStart={(e) => {
          if (touchReleaseTimeoutRef.current !== null) {
            window.clearTimeout(touchReleaseTimeoutRef.current);
            touchReleaseTimeoutRef.current = null;
          }
          swipeDisabledRef.current = true;
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const startX = touchStartX.current;
          const endX = e.changedTouches[0]?.clientX ?? null;
          if (startX !== null && endX !== null) {
            const dx = endX - startX;
            if (Math.abs(dx) >= 40) {
              handleSlideChange(
                dx < 0
                  ? Math.min(activeSlide + 1, 1)
                  : Math.max(activeSlide - 1, 0),
              );
            }
          }
          touchStartX.current = null;
          touchReleaseTimeoutRef.current = window.setTimeout(() => {
            if (!lightboxOpen) swipeDisabledRef.current = false;
            touchReleaseTimeoutRef.current = null;
          }, 50);
        }}
      >
        {cardSides ? (
          <img
            src={activeSlide === 0 ? cardSides.front : cardSides.back}
            alt={
              activeSlide === 0
                ? "Frente da carteirinha"
                : "Verso da carteirinha"
            }
            className="w-full h-auto block"
            draggable={false}
          />
        ) : (
          <div className="w-full flex items-center justify-center py-20">
            <LoaderCircle className="text-primary animate-spin" size={32} />
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 mb-5">
        {["Frente", "Verso"].map((label, i) => (
          <button
            key={label}
            onClick={() => handleSlideChange(i)}
            className={`transition-all duration-300 rounded-full ${
              activeSlide === i
                ? "bg-primary w-6 h-2"
                : "bg-outline-variant w-2 h-2"
            }`}
            aria-label={label}
          >
            <span className="sr-only">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
