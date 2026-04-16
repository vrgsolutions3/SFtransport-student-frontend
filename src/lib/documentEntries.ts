import { LICENSE_DOCUMENTS } from "@/constants/license-documents";
import type { DocumentEntries } from "@/components/dashboard/license-request/Step2Documents";

export interface PersistedDocumentEntry {
  name: string;
  type: string;
  dataUrl: string;
}

export type PersistedStep2 = Record<string, PersistedDocumentEntry | null>;

export function makeEmptyEntries(): DocumentEntries {
  return Object.fromEntries(LICENSE_DOCUMENTS.map((d) => [d.photoType, null]));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

export async function serializeDocumentEntries(
  entries: DocumentEntries,
): Promise<PersistedStep2> {
  const serialized: PersistedStep2 = {};

  for (const doc of LICENSE_DOCUMENTS) {
    const entry = entries[doc.photoType];
    const source = entry?.file ?? null;

    if (!source) {
      serialized[doc.photoType] = null;
      continue;
    }

    const dataUrl = await fileToDataUrl(source);
    serialized[doc.photoType] = {
      name: source.name,
      type: source.type,
      dataUrl,
    };
  }

  return serialized;
}

export function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  type: string,
): File {
  const [, base64] = dataUrl.split(",");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type });
}

export async function deserializeDocumentEntries(
  data: PersistedStep2,
): Promise<DocumentEntries> {
  const hydrated = makeEmptyEntries();

  for (const doc of LICENSE_DOCUMENTS) {
    const persisted = data[doc.photoType];
    if (!persisted) continue;

    const file = await dataUrlToFile(
      persisted.dataUrl,
      persisted.name,
      persisted.type,
    );
    hydrated[doc.photoType] = {
      file,
      previewUrl: file.type.startsWith("image/") ? persisted.dataUrl : "",
      result: null,
    };
  }

  return hydrated;
}
