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
  const isDev = process.env.NODE_ENV === 'development';

  const directives = [
    "default-src 'self'",
    // Em dev: unsafe-inline necessário pelo Turbopack/Next.js HMR
    // Em prod: remover unsafe-inline e usar nonce (implementação futura)
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://use.typekit.net",
    "img-src 'self' data: blob: https:",
    `connect-src ${getConnectSrcDirective()}`,
    "font-src 'self' data: https://use.typekit.net",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' data: blob:",
    "frame-ancestors 'none'",
  ];

  if (!isDev) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

const offlineRuntimeCaching = [
  {
    urlPattern: /\/dashboard(?:\/card)?\/?$/,
    handler: 'NetworkFirst' as const,
    options: {
      cacheName: 'pages-dashboard',
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 semana
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
  {
    urlPattern: /\/api\/(auth\/session|v1\/license\/me|v1\/license-request\/me)$/,
    handler: 'NetworkFirst' as const,
    options: {
      cacheName: 'api-student-session',
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60, // 1 dia
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
];

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
    runtimeCaching: offlineRuntimeCaching,
  },
})(nextConfig);