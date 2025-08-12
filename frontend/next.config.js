/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  experimental: { forceSwcTransforms: true },
  images: {
    domains: ['stackpro-sandbox-assets.s3.amazonaws.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'sandbox',
    NEXT_PUBLIC_FREE_TIER: process.env.NEXT_PUBLIC_FREE_TIER || 'true',
    AI_ENABLED: process.env.AI_ENABLED || 'false',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  async rewrites() {
    // Only add rewrites in development - Amplify handles this in production
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig
