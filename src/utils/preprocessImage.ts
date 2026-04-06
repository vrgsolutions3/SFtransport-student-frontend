// ─────────────────────────────────────────────────────────────
// utils/preprocessImage.ts
// Converte File → ImageBitmap → Canvas → Blob (JPEG leve)
// Sem base64. Roda no browser. Seguro para mobile.
// ─────────────────────────────────────────────────────────────

export interface PreprocessOptions {
  /**
   * Dimensão máxima (largura ou altura) em pixels.
   * Mobile: 1024 | Desktop: 1600
   */
  targetSize: number;
  /**
   * Qualidade JPEG entre 0 e 1.
   * Default: 0.95 — prioriza nitidez para emissão da carteirinha.
   */
  quality?: number;
}

export interface PreprocessResult {
  /** Blob JPEG redimensionado, pronto para envio via FormData */
  blob: Blob;
  /** Canvas original — reutilizado na análise NSFW */
  canvas: HTMLCanvasElement;
  /** Dimensões finais */
  width: number;
  height: number;
}

/**
 * Detecta se o dispositivo é mobile pelo User-Agent + largura de tela.
 * Usado para escolher targetSize automaticamente.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const isTouchUA = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  const isNarrow = window.innerWidth <= 768;
  return isTouchUA || isNarrow;
}

/**
 * Retorna o targetSize recomendado baseado no dispositivo.
 * Mobile: 1024px | Desktop: 1600px
 */
export function getTargetSize(): number {
  return isMobileDevice() ? 1024 : 1600;
}

/**
 * Pipeline principal:
 * File → createImageBitmap (decodifica na GPU quando disponível) →
 * desenha em OffscreenCanvas (ou Canvas) → exporta como Blob JPEG
 *
 * NÃO usa base64. O canvas é retornado para ser reutilizado pelo NSFW.
 */
export async function preprocessImage(
  file: File,
  options: PreprocessOptions
): Promise<PreprocessResult> {
  const { targetSize, quality = 0.95 } = options;

  // 1. Decodifica a imagem como bitmap (mais eficiente que new Image())
  const bitmap = await createImageBitmap(file);

  // 2. Calcula dimensões mantendo proporção
  const { width: srcW, height: srcH } = bitmap;
  let dstW = srcW;
  let dstH = srcH;

  if (srcW > targetSize || srcH > targetSize) {
    const scale = targetSize / Math.max(srcW, srcH);
    dstW = Math.round(srcW * scale);
    dstH = Math.round(srcH * scale);
  }

  // 3. Cria canvas e desenha
  // OffscreenCanvas é mais rápido, mas sem suporte total em Safari <16.4
  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Não foi possível criar contexto 2D do canvas.");

  ctx.drawImage(bitmap, 0, 0, dstW, dstH);
  bitmap.close(); // libera memória da GPU

  // 4. Exporta como Blob JPEG (sem base64)
  const blob = await canvasToBlob(canvas, "image/jpeg", quality);

  return { blob, canvas, width: dstW, height: dstH };
}

/**
 * Wrapper Promise para canvas.toBlob (API callback-based)
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar blob do canvas."));
      },
      type,
      quality
    );
  });
}