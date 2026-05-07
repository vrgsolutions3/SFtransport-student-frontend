import { LICENSE_DOCUMENTS } from "@/constants/license-documents";
import type { DocumentEntries } from "@/components/dashboard/license-request/Step2Documents";

export interface PersistedDocumentEntry {
  name: string;
  type: string;
  blob: Blob;
}

export type PersistedStep2 = Record<string, PersistedDocumentEntry | null>;

export function makeEmptyEntries(): DocumentEntries {
  return Object.fromEntries(LICENSE_DOCUMENTS.map((d) => [d.photoType, null]));
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

    serialized[doc.photoType] = {
      name: source.name,
      type: source.type,
      blob: source,
    };
  }

  return serialized;
}

export async function deserializeDocumentEntries(
  data: PersistedStep2,
): Promise<DocumentEntries> {
  const hydrated = makeEmptyEntries();

  for (const doc of LICENSE_DOCUMENTS) {
    const persisted = data[doc.photoType];
    if (!persisted) continue;

    const file = new File([persisted.blob], persisted.name, { type: persisted.type });
    hydrated[doc.photoType] = {
      file,
      previewUrl: "",
      result: null,
    };
  }

  return hydrated;
}
