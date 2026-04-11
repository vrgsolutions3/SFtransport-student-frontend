"use client";

import { Download, FileText, ImageIcon } from "lucide-react";
import {
  type StudentImage,
  resolveDocumentData,
  downloadDataUrl,
  fileNameForType,
  PHOTO_LABELS,
} from "@/lib/documentUtils";

interface DocumentCardProps {
  image: StudentImage;
  onPreview: (src: string, isPdf: boolean, title: string) => void;
}

export function DocumentCard({ image, onPreview }: DocumentCardProps) {
  const { src, isPdf } = resolveDocumentData(image);
  const title = PHOTO_LABELS[image.photoType];

  return (
    <article className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-on-surface mb-3">{title}</h2>

      <div className="bg-surface rounded-xl border border-outline-variant/30 mb-3 overflow-hidden">
        {!src ? (
          <div className="h-40 flex flex-col items-center justify-center text-on-surface-variant gap-2">
            <ImageIcon size={22} />
            <span className="text-xs">Arquivo não disponível</span>
          </div>
        ) : isPdf ? (
          <div className="h-48 px-4 py-3 flex items-center justify-between gap-4 bg-surface-container-low">
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText size={22} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {title}
                </p>
                <p className="text-xs text-on-surface-variant">
                  Documento em PDF
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onPreview(src, true, title)}
              className="h-10 px-4 rounded-lg border border-outline-variant/40 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              Visualizar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPreview(src, false, title)}
            className="w-full h-48 bg-white"
            aria-label={`Visualizar ${title}`}
          >
            <img
              src={src}
              alt={title}
              className="w-full h-full object-contain"
            />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          src && downloadDataUrl(src, fileNameForType(image.photoType, isPdf))
        }
        disabled={!src}
        className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={16} />
        Baixar documento
      </button>
    </article>
  );
}
