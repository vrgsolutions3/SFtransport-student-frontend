"use client";

import { X } from "lucide-react";

interface DocumentPreviewProps {
  preview: { src: string; isPdf: boolean; title: string } | null;
  onClose: () => void;
}

export function DocumentPreview({ preview, onClose }: DocumentPreviewProps) {
  if (!preview) return null;

  if (preview.isPdf) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl rounded-2xl bg-surface border border-outline-variant/30 overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/70 transition-colors"
            aria-label="Fechar visualização"
          >
            <X size={18} className="text-white" />
          </button>
          <iframe
            title={preview.title}
            src={preview.src}
            className="w-full h-[80vh] bg-white"
          />
        </div>
      </div>
    );
  }

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
