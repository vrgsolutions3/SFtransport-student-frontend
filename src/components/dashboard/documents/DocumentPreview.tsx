"use client";

import { X } from "lucide-react";

interface DocumentPreviewProps {
  preview: { src: string; title: string } | null;
  onClose: () => void;
}

export function DocumentPreview({ preview, onClose }: DocumentPreviewProps) {
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/70 transition-colors"
        aria-label="Fechar visualização"
      >
        <X size={20} className="text-white" />
      </button>
      <img
        src={preview.src}
        alt={preview.title}
        className="max-w-full max-h-[90vh] object-contain"
      />
    </div>
  );
}
