const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface StorageEntry<T> {
  data: T;
  timestamp: number;
}

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.localStorage !== "undefined";
}

export function setWithTTL<T>(key: string, data: T): void {
  if (!isStorageAvailable()) return;

  const entry: StorageEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  window.localStorage.setItem(key, JSON.stringify(entry));
}

export function getWithTTL<T>(key: string, ttlMs = ONE_DAY_MS): T | null {
  if (!isStorageAvailable()) return null;

  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StorageEntry<T>;
    const isExpired = Date.now() - parsed.timestamp > ttlMs;

    if (isExpired) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function removeWithTTL(key: string): void {
  if (!isStorageAvailable()) return;
  window.localStorage.removeItem(key);
}

export { ONE_DAY_MS };
