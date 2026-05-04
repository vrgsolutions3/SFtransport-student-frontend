"use client";

import { X } from "lucide-react";

interface CardLightboxProps {
  open: boolean;
  cardSides: { front: string; back: string } | null;
  activeSlide: number;
  onClose: () => void;
}

export function CardLightbox({
  open,
  cardSides,
  activeSlide,
  onClose,
}: CardLightboxProps) {
  if (!open || !cardSides || activeSlide === 2) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/95 p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 rounded-full bg-surface-container-high/70 hover:bg-surface-container-high transition-colors"
        onClick={onClose}
        aria-label="Fechar"
      >
        <X className="text-on-surface" size={22} />
      </button>
      <img
        src={activeSlide === 0 ? cardSides.front : cardSides.back}
        alt="Carteirinha ampliada"
        className="w-full max-w-sm h-auto"
        draggable={false}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
