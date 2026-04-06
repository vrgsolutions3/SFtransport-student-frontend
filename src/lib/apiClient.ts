import type { ApiError } from "@/types/auth";

export const API_BASE_URL = "/api/v1";

let onUnauthorized: (() => void) | null = null;

export function configureApiClient(opts: { onUnauthorized: () => void }) {
  onUnauthorized = opts.onUnauthorized;
}

export function resetApiClientState(): void {
  onUnauthorized = null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    ...(!(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    return data as T;
  }

  if (res.status === 401) {
    onUnauthorized?.();
  }

  const body = await res.json().catch(() => ({}));
  const error: ApiError = {
    message: body?.message ?? "Erro desconhecido",
    status: res.status,
  };
  throw error;
}

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

  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: "POST", body }),

  /** PATCH com FormData (multipart) — sem Content-Type manual */
  patchForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: "PATCH", body }),
};
