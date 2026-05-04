"use client";

import { useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { swipeDisabledRef } from "@/components/dashboard/SwipeNavigator";

interface CardViewerProps {
  cardSides: { front: string; back: string } | null;
  qrCodeUrl?: string | null;
  lightboxOpen: boolean;
  onOpenLightbox: () => void;
  onSlideChange: (index: number) => void;
}

export function CardViewer({
  cardSides,
  qrCodeUrl,
  lightboxOpen,
  onOpenLightbox,
  onSlideChange,
}: CardViewerProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchReleaseTimeoutRef = useRef<number | null>(null);

  const hasQr = !!qrCodeUrl;
  const maxSlide = hasQr ? 2 : 1;
  const slides = hasQr ? ["Frente", "Verso", "QR Code"] : ["Frente", "Verso"];

  const handleSlideChange = (index: number) => {
    setActiveSlide(index);
    onSlideChange(index);
  };

  return (
    <>
      <div
        className="mx-auto w-4/5 mb-4"
        style={{ cursor: activeSlide < 2 ? "zoom-in" : "default" }}
        onClick={() => { if (activeSlide < 2) onOpenLightbox(); }}
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
                  ? Math.min(activeSlide + 1, maxSlide)
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
          <div className="relative w-full">
            {/* Imagem sempre renderizada para definir a altura real — invisível no slide QR */}
            <img
              src={activeSlide === 0 ? cardSides.front : cardSides.back}
              alt={activeSlide === 0 ? "Frente da carteirinha" : "Verso da carteirinha"}
              className={`w-full h-auto block ${activeSlide === 2 ? "invisible" : ""}`}
              draggable={false}
            />
            {activeSlide === 2 && qrCodeUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-container-low rounded-2xl">
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <QRCode value={qrCodeUrl} size={180} level="M" />
                </div>
                <p className="text-xs text-on-surface-variant text-center px-4">
                  Apresente este QR code para verificar a autenticidade da sua carteirinha
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center py-20">
            <LoaderCircle className="text-primary animate-spin" size={32} />
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 mb-5">
        {slides.map((label, i) => (
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
