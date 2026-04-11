"use client";

import { CheckSquare, Square } from "lucide-react";
import { LICENSE_DOCUMENTS } from "@/constants/license-documents";
import type { PhotoType } from "@/lib/updateDocumentUtils";

interface UpdateDocumentsStep1Props {
  selected: Record<PhotoType, boolean>;
  onToggle: (type: PhotoType) => void;
}

export function UpdateDocumentsStep1({
  selected,
  onToggle,
}: UpdateDocumentsStep1Props) {
  return (
    <section className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        Selecione quais documentos você deseja atualizar.
      </p>
      <div className="space-y-3">
        {LICENSE_DOCUMENTS.map((doc) => {
          const type = doc.photoType as PhotoType;
          const checked = selected[type];
          return (
            <button
              key={doc.photoType}
              type="button"
              onClick={() => onToggle(type)}
              className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 text-left transition-all active:scale-[0.99] ${
                checked
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant/40 bg-surface-container-low"
              }`}
            >
              {checked ? (
                <CheckSquare className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-on-surface-variant shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface">
                  {doc.label}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {doc.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
