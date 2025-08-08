# Amplify Build Fix Plan
*Generated: 2025-08-08 13:16:00*

## Local Reproduction Plan

**From repo root:**
```bash
# This will FAIL (same as Amplify)
npm ci                    # Error: no package.json
npm run build             # Error: no package.json or scripts

# This will SUCCEED (correct path)
cd frontend
rm -rf node_modules .next
npm ci
npm run build
```

**Expected Node Version:** 18.x LTS (detected from deps: Next.js 14.0.4, React 18)

## Proposed Minimal Patches

### 1. Primary Fix: amplify.yml (NEW FILE)
**Path:** `amplify.yml` (repo root)
```yaml
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - nvm install 18
            - nvm use 18
            - corepack enable || true
            - npm ci
        build:
          commands:
            - NEXT_TELEMETRY_DISABLED=1 CI=false npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
```

### 2. Secondary Fix: frontend/package.json (PATCH)
**Add Node engines constraint:**
```json
{
  "name": "stackbox-frontend",
  "version": "0.1.0",
  "private": true,
+ "engines": {
+   "node": ">=18 <21"
+ },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    ...
```

### 3. Secondary Fix: frontend/next.config.js (PATCH)
**Add sandbox environment variables:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
+ productionBrowserSourceMaps: false,
  env: {
+   NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
+   NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
+   NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'sandbox',
+   NEXT_PUBLIC_FREE_TIER: process.env.NEXT_PUBLIC_FREE_TIER || 'true',
+   AI_ENABLED: process.env.AI_ENABLED || 'false',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STACKBOX_API_URL: process.env.STACKBOX_API_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.STACKBOX_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
```

### 4. Optional: .npmrc (NEW FILE)
**Path:** `.npmrc` (repo root)
```ini
fund=false
audit=false
legacy-peer-deps=true
```

## Rationale
1. **amplify.yml with appRoot**: Tells Amplify to build from `frontend/` directory
2. **Node 18 constraint**: Ensures consistent runtime environment
3. **Environment variable guards**: Prevents Next.js build failures from undefined vars
4. **Disable source maps**: Reduces build time and memory usage
5. **CI=false**: Prevents warnings from breaking the build

## File Changes Summary
- **NEW:** `amplify.yml` (15 lines)
- **PATCH:** `frontend/package.json` (+3 lines)  
- **PATCH:** `frontend/next.config.js` (+6 lines)
- **OPTIONAL:** `.npmrc` (3 lines)

**Total Impact:** ~27 lines added, 0 lines removed
