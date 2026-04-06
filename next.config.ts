import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

// PWA config com Next.js 15+
const pwaConfig = {
  dest: 'public',
  sw: 'sw.js',
  register: true,
  skipWaiting: true,
};

const withPWAConfig = (withPWA as any)(pwaConfig)(nextConfig as any) as NextConfig;

export default withPWAConfig;