/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  output: 'export',
  images: { 
    unoptimized: true // Required for static export
  },
  trailingSlash: true, // Helps with static hosting
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'sandbox',
    NEXT_PUBLIC_FREE_TIER: process.env.NEXT_PUBLIC_FREE_TIER || 'true',
    AI_ENABLED: process.env.AI_ENABLED || 'false',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STACKBOX_API_URL: process.env.STACKBOX_API_URL || 'http://localhost:3001',
  },
  // Note: rewrites() don't work with static export, API calls will be direct
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.STACKBOX_API_URL || 'http://localhost:3001'}/api/:path*`,
  //     },
  //   ];
  // },
}

module.exports = nextConfig
