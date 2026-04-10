"use client";

import DocumentUpload from "@/components/dashboard/license-request/DocumentUpload";
import type { DocumentConfig } from "@/constants/license-documents";

interface UpdateDocumentsStep2Props {
  selectedDocs: DocumentConfig[];
  entries: unknown[];
  isProcessing: boolean;
  submitting: boolean;
  onFileSelect: (index: number, file: File, validateRatio?: boolean) => void;
  onRemove: (index: number) => void;
}

export function UpdateDocumentsStep2({
  selectedDocs,
  entries,
  isProcessing,
  submitting,
  onFileSelect,
  onRemove,
}: UpdateDocumentsStep2Props) {
  return (
    <section className="space-y-4 pb-4">
      <p className="text-sm text-on-surface-variant">
        Envie os arquivos dos documentos selecionados.
      </p>
      {selectedDocs.map((doc, index) => (
        <DocumentUpload
          key={doc.photoType}
          config={doc}
          entry={
            (entries[index] ?? null) as Parameters<
              typeof DocumentUpload
            >[0]["entry"]
          }
          onFileSelect={(file) => onFileSelect(index, file, doc.validateRatio)}
          onRemove={() => onRemove(index)}
          disabled={isProcessing || submitting}
        />
      ))}
    </section>
  );
}
