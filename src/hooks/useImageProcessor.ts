"use client";

import { useState, useCallback, useEffect } from "react";
import type { ImageValidationResult } from "@/types/imageValidation";
import { preprocessImage, getTargetSize } from "@/utils/preprocessImage";
import { validate3x4Ratio, analyzeFaceHeuristic } from "@/utils/validate3x4";
import { analyzeNSFW, interpretNSFW } from "@/utils/analyzeNSFW";
import type { NSFWModel } from "@/utils/analyzeNSFW";

export interface ImageEntry {
  file: File;
  previewUrl: string;
  result: ImageValidationResult | null;
}

export interface ImageProcessorState {
  entries: (ImageEntry | null)[];
  isProcessing: boolean;
  allValid: boolean;
  setFile: (index: number, file: File, validateRatio: boolean) => void;
  removeEntry: (index: number) => void;
}

async function createPngPreviewUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Falha ao criar contexto de preview");
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Falha ao gerar PNG de preview"));
    }, "image/png");
  });

  return URL.createObjectURL(blob);
}

async function runPipeline(
  file: File,
  model: NSFWModel | null,
  validateRatio: boolean
): Promise<ImageValidationResult> {

  // PDFs passam direto — sem análise de imagem
  if (file.type === "application/pdf") {
    return { status: "ok", processedBlob: file, nsfw: null, aspectRatio: null, faceHeuristic: null, message: "" };
  }

  // 1. Pré-processamento
  const targetSize = getTargetSize();
  let preprocessed: Awaited<ReturnType<typeof preprocessImage>>;
  try {
    preprocessed = await preprocessImage(file, { targetSize });
  } catch {
    return { status: "error", processedBlob: null, nsfw: null, aspectRatio: null, faceHeuristic: null, message: "Erro ao processar imagem. Tente novamente." };
  }

  const { blob, canvas, width, height } = preprocessed;

  // 2. Proporção 3x4 e rosto — só para ProfilePhoto
  const aspectRatio = validateRatio
    ? validate3x4Ratio(width, height)
    : { valid: true, ratio: width / height, message: "" };

  const faceHeuristic = validateRatio
    ? analyzeFaceHeuristic(canvas)
    : { likelyCentered: true, message: "" };

  // 3. NSFW — roda em todas as imagens
  let nsfw: ImageValidationResult["nsfw"] = null;
  let nsfwMessage = "";

  if (model) {
    try {
      nsfw = await analyzeNSFW(model, canvas);
      const { decision, message } = interpretNSFW(nsfw);
      if (decision === "block") {
        return { status: "error", processedBlob: null, nsfw, aspectRatio, faceHeuristic, message: message || "Conteúdo impróprio detectado." };
      }
      if (decision === "warn") nsfwMessage = message || "";
    } catch {
      // falha silenciosa
    }
  }

  // 4. Erros estruturais
  const errors: string[] = [];
  if (!aspectRatio.valid && aspectRatio.message) errors.push(aspectRatio.message);
  if (!faceHeuristic.likelyCentered && faceHeuristic.message) errors.push(faceHeuristic.message);

  if (errors.length > 0) {
    return { status: "error", processedBlob: blob, nsfw, aspectRatio, faceHeuristic, message: errors.join(" ") };
  }

  return { status: nsfwMessage ? "warning" : "ok", processedBlob: blob, nsfw, aspectRatio, faceHeuristic, message: nsfwMessage };
}

export function useImageProcessor(model: NSFWModel | null, slotsCount: number): ImageProcessorState {
  const [entries, setEntries] = useState<(ImageEntry | null)[]>(
    () => new Array(slotsCount).fill(null)
  );
  const [processingCount, setProcessingCount] = useState(0);

  useEffect(() => {
    return () => {
      setEntries((prev) => {
        prev.forEach((e) => { if (e?.previewUrl) URL.revokeObjectURL(e.previewUrl); });
        return prev;
      });
    };
  }, []);

  const processEntry = useCallback(async (index: number, entry: ImageEntry, validateRatio: boolean) => {
    setProcessingCount((c) => c + 1);
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...entry, result: { status: "processing", processedBlob: null, nsfw: null, aspectRatio: null, faceHeuristic: null, message: "Analisando..." } };
      return next;
    });

    const result = await runPipeline(entry.file, model, validateRatio);

    setEntries((prev) => {
      if (prev[index]?.file !== entry.file) return prev;
      const next = [...prev];
      next[index] = { ...prev[index]!, result };
      return next;
    });
    setProcessingCount((c) => c - 1);
  }, [model]);

  const setFile = useCallback((index: number, file: File, validateRatio: boolean) => {
    const isPdf = file.type === "application/pdf";
    const newEntry: ImageEntry = {
      file,
      previewUrl: "",
      result: null,
    };

    setEntries((prev) => {
      const next = [...prev];
      if (next[index]?.previewUrl) URL.revokeObjectURL(next[index]!.previewUrl);
      next[index] = newEntry;
      return next;
    });

    if (!isPdf) {
      createPngPreviewUrl(file)
        .then((pngPreviewUrl) => {
          setEntries((prev) => {
            if (prev[index]?.file !== file) {
              URL.revokeObjectURL(pngPreviewUrl);
              return prev;
            }

            const currentPreviewUrl = prev[index]?.previewUrl;
            if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);

            const next = [...prev];
            next[index] = {
              ...prev[index]!,
              previewUrl: pngPreviewUrl,
            };
            return next;
          });
        })
        .catch(() => {
          const fallbackUrl = URL.createObjectURL(file);
          setEntries((prev) => {
            if (prev[index]?.file !== file) {
              URL.revokeObjectURL(fallbackUrl);
              return prev;
            }

            const currentPreviewUrl = prev[index]?.previewUrl;
            if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);

            const next = [...prev];
            next[index] = {
              ...prev[index]!,
              previewUrl: fallbackUrl,
            };
            return next;
          });
        });
    }

    processEntry(index, newEntry, validateRatio);
  }, [processEntry]);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => {
      const next = [...prev];
      if (next[index]?.previewUrl) URL.revokeObjectURL(next[index]!.previewUrl);
      next[index] = null;
      return next;
    });
  }, []);

  // Todos os slots devem ter arquivo E status "ok"
  const allValid = entries.length > 0 && entries.every((e) => e !== null && e.result?.status === "ok");

  return { entries, isProcessing: processingCount > 0, allValid, setFile, removeEntry };
}