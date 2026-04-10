export const SID_COOKIE_NAME = "_tk";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} não configurado no frontend.`);
  }
  return value;
}

function normalizeApiBaseUrl(rawValue: string): string {
  const base = rawValue.trim().replace(/\/+$/, "");

  if (!base) return "";
  if (/\/api\/v1$/i.test(base)) return base;

  return `${base}/api/v1`;
}

export function getBackendApiBaseUrl(): string {
  const rawApiTarget = process.env.API_PROXY_TARGET?.trim()
    ? getRequiredEnv("API_PROXY_TARGET")
    : getRequiredEnv("NEXT_PUBLIC_API_URL");

  const base = rawApiTarget.trim().replace(/\/api\/v1\/?$/i, "").replace(/\/+$/, "");
  return normalizeApiBaseUrl(base);
}

export function getServiceSecret(): string {
  const secret = process.env.BFF_SERVICE_SECRET ?? process.env.SERVICE_SECRET;

  if (!secret || !secret.trim()) {
    throw new Error("BFF_SERVICE_SECRET (ou SERVICE_SECRET) não configurado no frontend.");
  }

  return secret.trim();
}

export function getSidMaxAgeSeconds(): number {
  const raw = getRequiredEnv("SESSION_TTL_DAYS");
  if (!/^\d+$/.test(raw)) {
    throw new Error("SESSION_TTL_DAYS deve conter apenas números inteiros.");
  }

  const days = Number(raw);
  return days * 24 * 60 * 60;
}
