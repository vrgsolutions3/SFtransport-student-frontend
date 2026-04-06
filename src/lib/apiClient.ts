// ─────────────────────────────────────────────────────────────
// lib/apiClient.ts
// Fetch wrapper com:
//   - credentials: 'include' em todas as requests
//   - Authorization: Bearer <access_token> via injeção externa
//   - Fila anti-401: um único refresh simultâneo; demais requests
//     aguardam na fila e são reexecutadas com o novo token
// ─────────────────────────────────────────────────────────────

import type { ApiError } from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── Estado da fila anti-401 ───────────────────────────────────
type QueueEntry = {
  resolve: (token: string) => void;
  reject: (reason: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueueEntry[] = [];

/** Callback injetado pelo AuthContext para executar o refresh real */
let onRefreshToken: (() => Promise<string>) | null = null;
/** Callback injetado pelo AuthContext para forçar logout */
let onForceLogout: (() => void) | null = null;
/** Getter do access token atual, injetado pelo AuthContext */
let getAccessToken: (() => string | null) | null = null;

export function configureApiClient(opts: {
  getToken: () => string | null;
  refreshToken: () => Promise<string>;
  forceLogout: () => void;
}) {
  getAccessToken = opts.getToken;
  onRefreshToken = opts.refreshToken;
  onForceLogout = opts.forceLogout;
}

// ── Fila anti-401 ────────────────────────────────────────────
function processQueue(newToken: string) {
  refreshQueue.forEach((entry) => entry.resolve(newToken));
  refreshQueue = [];
}

function rejectQueue(reason: unknown) {
  refreshQueue.forEach((entry) => entry.reject(reason));
  refreshQueue = [];
}

async function waitForRefresh(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });
}

async function attemptRefresh(): Promise<string> {
  if (!onRefreshToken) throw new Error("refreshToken não configurado");
  try {
    const newToken = await onRefreshToken();
    processQueue(newToken);
    return newToken;
  } catch (err) {
    rejectQueue(err);
    onForceLogout?.();
    throw err;
  } finally {
    isRefreshing = false;
  }
}

// ── Core request ─────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = getAccessToken?.();

  const headers: HeadersInit = {
    ...(!(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Sucesso
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return data as T;
  }

  // ── 401: token expirado → fila anti-401 ──────────────────
  if (res.status === 401 && !isRetry) {
    let freshToken: string;

    if (isRefreshing) {
      // Outro refresh já está em andamento — entra na fila
      freshToken = await waitForRefresh();
    } else {
      isRefreshing = true;
      freshToken = await attemptRefresh();
    }

    // Reexecuta a request original com o token novo
    return request<T>(
      path,
      {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${freshToken}`,
        },
      },
      true // isRetry — não entra em loop
    );
  }

  // ── Outros erros ─────────────────────────────────────────
  const body = await res.json().catch(() => ({}));
  const error: ApiError = {
    message: body?.message ?? "Erro desconhecido",
    status: res.status,
  };
  throw error;
}

// ── API pública ───────────────────────────────────────────────
export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  /** Envia FormData (multipart) — sem Content-Type manual */
  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: "POST", body }),

  /** PATCH com FormData (multipart) — sem Content-Type manual */
  patchForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: "PATCH", body }),
};