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

  // Na Vercel, localhost/127.0.0.1 não alcança o backend real.
  if (process.env.VERCEL === '1') {
    const localHostPattern = /(^|\/\/)(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i;
    const apiTarget = process.env.API_PROXY_TARGET?.trim() ?? '';
    const publicApi = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';

    if (localHostPattern.test(apiTarget) || localHostPattern.test(publicApi)) {
      throw new Error(
        'API_PROXY_TARGET/NEXT_PUBLIC_API_URL apontam para localhost em ambiente Vercel. Use URL pública do backend.',
      );
    }
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
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
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
        maxAgeSeconds: 7 * 24 * 60 * 60,
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
        maxAgeSeconds: 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
  {
    // Instituições e cursos — necessário para o formulário de solicitação funcionar no PWA
    urlPattern: /\/api\/v1\/(university|course)/,
    handler: 'NetworkFirst' as const,
    options: {
      cacheName: 'api-institutions',
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
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
  async rewrites() {
    return [
      // Redireciona /.well-known/assetlinks.json para /assetlinks.json (necessário para TWA/PWA no Android)
      {
        source: '/.well-known/assetlinks.json',
        destination: '/assetlinks.json',
      },
    ];
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
      // Content-Type correto para o assetlinks.json
      {
        source: '/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'no-cache' },
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