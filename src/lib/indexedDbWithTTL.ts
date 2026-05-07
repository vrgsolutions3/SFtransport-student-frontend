const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DB_NAME = "vrg-student-storage";
const DB_VERSION = 1;
const STORE_NAME = "ttlEntries";

interface StorageEntry<T> {
  data: T;
  timestamp: number;
}

function isDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setWithTTL<T>(key: string, data: T): Promise<boolean> {
  if (!isDbAvailable()) return false;

  const entry: StorageEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(entry, key);

    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };

    tx.onerror = () => {
      const err = tx.error;
      db.close();
      if (err instanceof DOMException && err.name === "QuotaExceededError") {
        resolve(false);
        return;
      }
      reject(err ?? new Error("Erro ao gravar no IndexedDB"));
    };
  });
}

export async function getWithTTL<T>(key: string, ttlMs = ONE_DAY_MS): Promise<T | null> {
  if (!isDbAvailable()) return null;

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = async () => {
      db.close();
      const entry = request.result as StorageEntry<T> | undefined;
      if (!entry) {
        resolve(null);
        return;
      }

      const isExpired = Date.now() - entry.timestamp > ttlMs;
      if (isExpired) {
        try {
          await removeWithTTL(key);
        } catch {
          // ignore cleanup errors and still return null
        }
        resolve(null);
        return;
      }

      resolve(entry.data);
    };

    request.onerror = () => {
      db.close();
      reject(request.error ?? new Error("Erro ao ler do IndexedDB"));
    };
  });
}

export async function removeWithTTL(key: string): Promise<void> {
  if (!isDbAvailable()) return;

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Erro ao remover do IndexedDB"));
    };
  });
}

export { ONE_DAY_MS };
