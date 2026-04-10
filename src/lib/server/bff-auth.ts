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

function parseTtlDays(raw: string, envName: string): number {
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${envName} deve conter apenas números inteiros.`);
  }

  const days = Number(raw);
  if (days <= 0) {
    throw new Error(`${envName} deve ser maior que zero.`);
  }

  return days;
}

export function getSidMaxAgeSeconds(): number {
  const studentRaw = process.env.SESSION_TTL_STUDENT_DAYS?.trim();
  const legacyRaw = process.env.SESSION_TTL_DAYS?.trim();
  const days = studentRaw
    ? parseTtlDays(studentRaw, "SESSION_TTL_STUDENT_DAYS")
    : legacyRaw
      ? parseTtlDays(legacyRaw, "SESSION_TTL_DAYS")
      : 3;

  return days * 24 * 60 * 60;
}
