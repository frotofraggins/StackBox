/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  experimental: { forceSwcTransforms: true },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
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
}

module.exports = nextConfig
