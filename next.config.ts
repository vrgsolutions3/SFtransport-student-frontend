import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

type NextPwaWrapper = (config: {
  dest: string;
  sw: string;
  register: boolean;
  skipWaiting: boolean;
}) => (nextConfig: NextConfig) => NextConfig;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    qualities: [40, 75],
  },
};

// PWA config com Next.js 15+
const pwaConfig = {
  dest: 'public',
  sw: 'sw.js',
  register: true,
  skipWaiting: true,
};

const applyPwa = withPWA as unknown as NextPwaWrapper;
const withPWAConfig = applyPwa(pwaConfig)(nextConfig);

export default withPWAConfig;