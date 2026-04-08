"use client";

import { useEffect, useCallback, useRef } from "react";
import { ArrowLeft, FileCheck, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import DocumentUpload from "./DocumentUpload";
import { LICENSE_DOCUMENTS } from "@/constants/license-documents";
import { useNSFW } from "@/hooks/useNSFW";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { cn } from "@/lib/utils";
import type { ImageEntry } from "@/hooks/useImageProcessor";

// ─── Tipos públicos ───────────────────────────────────────────

export type DocumentEntries = Record<string, ImageEntry | null>;

interface Step2DocumentsProps {
  entries: DocumentEntries;
  onChange: (entries: DocumentEntries) => void;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
}

// ─── Banner do modelo NSFW ────────────────────────────────────

function ModelBanner({ status, onRetry }: { status: string; onRetry: () => void }) {
  if (status === "ready") return null;

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-info-container text-on-info text-sm">
        <ShieldCheck className="w-4 h-4 shrink-0 animate-pulse" />
        <span>Carregando verificação de conteúdo...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning-container text-on-warning text-sm">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span className="flex-1">Verificação de conteúdo indisponível.</span>
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1 text-xs font-bold underline hover:no-underline shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return null;
}

// ─── Barra de progresso ───────────────────────────────────────

function ProgressBar({
  okCount,
  total,
  isProcessing,
}: {
  okCount: number;
  total: number;
  isProcessing: boolean;
}) {
  const pct = total === 0 ? 0 : Math.round((okCount / total) * 100);

  return (
    <div className="bg-surface-container-low rounded-xl px-4 py-3 space-y-2 border border-outline-variant/40">
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 shrink-0" />
          {okCount} de {total} documento{total !== 1 ? "s" : ""} verificado{okCount !== 1 ? "s" : ""}
        </span>
        {isProcessing && (
          <span className="text-primary font-medium animate-pulse">Verificando...</span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            okCount === total && total > 0 ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────

export default function Step2Documents({
  entries,
  onChange,
  onBack,
  onContinue,
  continueDisabled = false,
}: Step2DocumentsProps) {
  const nsfw = useNSFW();
  const model = nsfw.status === "ready" ? nsfw.model : null;

  const { entries: processorEntries, isProcessing, allValid, setFile, removeEntry } =
    useImageProcessor(model, LICENSE_DOCUMENTS.length);

  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;

    let hasRestoredFile = false;
    for (const [index, doc] of LICENSE_DOCUMENTS.entries()) {
      const restoredEntry = entries[doc.photoType];
      if (!restoredEntry?.file) continue;

      setFile(index, restoredEntry.file, doc.validateRatio);
      hasRestoredFile = true;
    }

    if (hasRestoredFile) {
      restoredRef.current = true;
    }
  }, [entries, setFile]);

  // Sincroniza entradas para o pai
  useEffect(() => {
    const mapped: DocumentEntries = Object.fromEntries(
      LICENSE_DOCUMENTS.map((doc, i) => [doc.photoType, processorEntries[i] ?? null])
    );
    onChange(mapped);
  }, [processorEntries, onChange]);

  const handleFileSelect = useCallback(
    (index: number, file: File, validateRatio: boolean) => {
      setFile(index, file, validateRatio);
    },
    [setFile]
  );

  const okCount = processorEntries.filter((e) => e?.result?.status === "ok").length;
  const total = LICENSE_DOCUMENTS.length;

  return (
    <div className="space-y-5 pb-28">
      {/* Banner do modelo */}
      <ModelBanner status={nsfw.status} onRetry={nsfw.retry} />

      {/* Barra de progresso */}
      <ProgressBar okCount={okCount} total={total} isProcessing={isProcessing} />

      {/* Lista de documentos */}
      <div className="space-y-3">
        {LICENSE_DOCUMENTS.map((doc, index) => (
          <DocumentUpload
            key={doc.photoType}
            config={doc}
            entry={processorEntries[index] ?? null}
            onFileSelect={(file) => handleFileSelect(index, file, doc.validateRatio)}
            onRemove={() => removeEntry(index)}
            disabled={isProcessing}
          />
        ))}
      </div>

      {/* Ações — fixas no rodapé via portal no page.tsx */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-6 bg-linear-to-t from-surface via-surface/90 to-transparent">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-all disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={!allValid || isProcessing || continueDisabled}
            onClick={onContinue}
          >
            {allValid
              ? "Continuar"
              : isProcessing
              ? "Verificando..."
              : `Aguardando documentos (${okCount}/${total})`}
          </Button>
        </div>
      </div>
    </div>
  );
}