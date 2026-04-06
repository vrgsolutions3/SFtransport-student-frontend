const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface StorageEntry<T> {
  data: T;
  timestamp: number;
}

export function setWithTTL<T>(key: string, data: T): void {
  const entry: StorageEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  localStorage.setItem(key, JSON.stringify(entry));
}

export function getWithTTL<T>(key: string, ttlMs = ONE_DAY_MS): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StorageEntry<T>;
    const isExpired = Date.now() - parsed.timestamp > ttlMs;

    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function removeWithTTL(key: string): void {
  localStorage.removeItem(key);
}

export { ONE_DAY_MS };
