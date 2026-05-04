"use client";

import { useRef, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  FileText,
  ImagePlus,
  FilePlus,
  Camera,
  Images,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentConfig } from "@/constants/license-documents";
import type { ImageEntry } from "@/hooks/useImageProcessor";
import type { ImageValidationStatus } from "@/types/imageValidation";

interface DocumentUploadProps {
  config: DocumentConfig;
  entry: ImageEntry | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png"];

function validateSelectedFile(file: File, acceptPdf: boolean): string | null {
  const allowedTypes = acceptPdf ? [...IMAGE_TYPES, "application/pdf"] : IMAGE_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return acceptPdf
      ? "Apenas JPEG, PNG ou PDF são permitidos."
      : "Apenas imagens JPEG e PNG são permitidas.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "O arquivo deve ter no máximo 10MB.";
  }

  return null;
}

// ─── Status visual ────────────────────────────────────────────

function StatusIcon({ status }: { status: ImageValidationStatus }) {
  if (status === "ok") return <CheckCircle className="w-5 h-5 text-success" />;
  if (status === "warning") return <AlertTriangle className="w-5 h-5 text-warning" />;
  if (status === "error") return <XCircle className="w-5 h-5 text-error" />;
  if (status === "processing") return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
  return null;
}

// ─── Painel de checagens detalhadas ──────────────────────────
// Exibe o resultado de cada verificação realizada na imagem.
// Só aparece após o processamento (não durante).

interface CheckRowProps {
  label: string;
  passed: boolean;
  detail?: string;
}

function CheckRow({ label, passed, detail }: CheckRowProps) {
  return (
    <div className="flex items-start gap-2">
      {passed
        ? <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
        : <XCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
      }
      <div className="min-w-0">
        <span className={cn("text-[11px] font-medium", passed ? "text-success" : "text-error")}>
          {label}
        </span>
        {!passed && detail && (
          <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  );
}

function ValidationPanel({ entry, validateRatio }: { entry: ImageEntry; validateRatio: boolean }) {
  const { result } = entry;
  if (!result || result.status === "processing" || result.status === "idle" || result.status === "pending") return null;

  const isPdf = entry.file.type === "application/pdf";
  if (isPdf) return null; // PDFs não têm checagens de imagem

  const checks: CheckRowProps[] = [];

  // Proporção 3x4 — só para ProfilePhoto
  if (validateRatio && result.aspectRatio) {
    checks.push({
      label: `Proporção 3x4 (${result.aspectRatio.ratio.toFixed(2)})`,
      passed: result.aspectRatio.valid,
      detail: result.aspectRatio.message,
    });
  }

  // Rosto centralizado — só para ProfilePhoto
  if (validateRatio && result.faceHeuristic) {
    checks.push({
      label: "Rosto centralizado",
      passed: result.faceHeuristic.likelyCentered,
      detail: result.faceHeuristic.message,
    });
  }

  // NSFW — sempre que o modelo rodou
  if (result.nsfw) {
    const nsfwOk = result.nsfw.porn < 0.2 && result.nsfw.hentai < 0.2 && result.nsfw.sexy < 0.4;
    checks.push({
      label: `Conteúdo adequado (${Math.round(result.nsfw.neutral * 100)}% neutro)`,
      passed: nsfwOk,
      detail: !nsfwOk
        ? `Porn: ${Math.round(result.nsfw.porn * 100)}% · Hentai: ${Math.round(result.nsfw.hentai * 100)}% · Sexy: ${Math.round(result.nsfw.sexy * 100)}%`
        : undefined,
    });
  }

  if (checks.length === 0) return null;

  return (
    <div className="mt-2 px-3 py-2 bg-surface-container-high rounded-lg space-y-1.5">
      {checks.map((c) => (
        <CheckRow key={c.label} {...c} />
      ))}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────

export default function DocumentUpload({
  config,
  entry,
  onFileSelect,
  onRemove,
  disabled = false,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { showToast } = useToast();

  const status: ImageValidationStatus = entry?.result?.status ?? "idle";
  const isPdf = entry?.file?.type === "application/pdf";
  const isProcessing = status === "processing";
  const Icon = config.icon;
  const uploadLabel = config.acceptPdf
    ? "Selecionar Imagem ou PDF"
    : config.validateRatio
      ? "Selecionar Foto 3x4"
      : "Selecionar Imagem";

  const cardBorder = cn(
    "rounded-xl border transition-all duration-200 overflow-hidden",
    status === "ok"      && "border-success/40 bg-success-container/30",
    status === "error"   && "border-error/40 bg-error-container/30",
    status === "warning" && "border-warning/40 bg-warning-container/30",
    (status === "idle" || status === "processing" || status === "pending") && "border-outline-variant/50 bg-surface-container-low",
  );

  return (
    <div className={cardBorder}>
      {/* ── Cabeçalho ── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "p-2 rounded-lg shrink-0 transition-colors",
            status === "ok" ? "bg-success/10" : "bg-surface-container-high"
          )}>
            <Icon className={cn("w-5 h-5", status === "ok" ? "text-success" : "text-primary")} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface flex items-center gap-1">
              {config.label}
              {config.required && <span className="text-error text-xs">*</span>}
            </p>
            <p className="text-xs text-on-surface-variant leading-tight mt-0.5">
              {config.description}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <StatusIcon status={status} />
        </div>
      </div>

      {/* ── Área de arquivo ── */}
      {entry ? (
        <div className="px-4 pb-4 pt-4 space-y-2">
          {/* Preview row */}
          <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-lg border border-outline-variant/40">
            {/* Thumbnail */}
            <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-surface-container-high rounded border border-outline-variant/30 overflow-hidden">
              {isProcessing ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : isPdf ? (
                <FileText className="w-6 h-6 text-error" />
              ) : entry.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : null}
            </div>

            {/* Nome e ações */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-on-surface">{entry.file.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled || isProcessing}
                  className="flex items-center gap-1 text-[11px] text-primary font-bold hover:opacity-70 transition-opacity disabled:opacity-40"
                >
                  <Pencil className="w-3 h-3" />
                  Alterar
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={disabled || isProcessing}
                  className="flex items-center gap-1 text-[11px] text-error font-bold hover:opacity-70 transition-opacity disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover
                </button>
              </div>
            </div>
          </div>

          {/* Painel de verificações */}
          <ValidationPanel entry={entry} validateRatio={config.validateRatio} />
        </div>
      ) : (
        <div className="px-4 pb-4 pt-4">
          <button
            type="button"
            onClick={() => config.acceptPdf ? inputRef.current?.click() : setSheetOpen(true)}
            disabled={disabled}
            className="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-xs font-bold text-primary hover:bg-primary/5 hover:border-primary/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40"
          >
            {config.acceptPdf ? <FilePlus className="w-4 h-4" /> : <ImagePlus className="w-4 h-4" />}
            {uploadLabel}
          </button>
        </div>
      )}

      {fileError && (
        <p className="px-4 pb-3 text-xs text-error">{fileError}</p>
      )}

      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl px-6 pt-4 pb-10">
            <p className="text-base font-bold text-on-surface mb-4">
              {config.label}
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setSheetOpen(false); setTimeout(() => inputRef.current?.click(), 50); }}
                className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium text-on-surface hover:bg-surface-container rounded-xl transition-all"
              >
                <Camera className="w-5 h-5 shrink-0" />
                Usar câmera
              </button>
              <button
                type="button"
                onClick={() => { setSheetOpen(false); setTimeout(() => galleryRef.current?.click(), 50); }}
                className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium text-on-surface hover:bg-surface-container rounded-xl transition-all"
              >
                <Images className="w-5 h-5 shrink-0" />
                Escolher da galeria
              </button>
            </div>
          </div>
        </>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) { setFileError(null); return; }
          const validationError = validateSelectedFile(file, false);
          if (validationError) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
              showToast(`Arquivo muito grande — máximo 10MB (seu arquivo: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
            } else {
              setFileError(validationError);
            }
            e.target.value = "";
            return;
          }
          setFileError(null);
          onFileSelect(file);
          e.target.value = "";
        }}
        className="hidden"
      />

      <input
        ref={inputRef}
        type="file"
        accept={config.acceptPdf ? "image/jpeg,image/png,application/pdf" : "image/jpeg,image/png"}
        capture={config.acceptPdf ? undefined : "environment"}
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (!file) {
            setFileError(null);
            return;
          }

          const validationError = validateSelectedFile(file, config.acceptPdf);
          if (validationError) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
              showToast(`Arquivo muito grande — máximo 10MB (seu arquivo: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
            } else {
              setFileError(validationError);
            }
            e.target.value = "";
            return;
          }

          setFileError(null);
          onFileSelect(file);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}