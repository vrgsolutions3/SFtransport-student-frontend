import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

function ensureRequiredEnvVars(): void {
  const requiredKeys = [
    'NEXT_PUBLIC_API_URL',
    'API_PROXY_TARGET',
    'SESSION_TTL_STUDENT_DAYS',
    'CSRF_COOKIE_NAME',
    'CSRF_HEADER_NAME',
  ];

  const missing = requiredKeys.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  const hasServiceSecret = Boolean(
    process.env.BFF_SERVICE_SECRET?.trim() || process.env.SERVICE_SECRET?.trim(),
  );

  if (!hasServiceSecret) {
    missing.push('BFF_SERVICE_SECRET ou SERVICE_SECRET');
  }

  const ttl = process.env.SESSION_TTL_STUDENT_DAYS?.trim();
  if (ttl && !/^\d+$/.test(ttl)) {
    throw new Error('SESSION_TTL_DAYS deve conter apenas números inteiros.');
  }

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes/vazias: ${missing.join(', ')}`,
    );
  }
}

ensureRequiredEnvVars();

function getConnectSrcDirective(): string {
  const connectSrc = new Set(["'self'"]);
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (rawApiUrl) {
    try {
      connectSrc.add(new URL(rawApiUrl).origin);
    } catch {
      // Ignora valor inválido: validação estrutural da URL acontece em outro ponto.
    }
  }

  return Array.from(connectSrc).join(' ');
}

function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    `connect-src ${getConnectSrcDirective()}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    qualities: [40, 75],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: buildContentSecurityPolicy(),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
})(nextConfig);