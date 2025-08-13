# Amplify Dual Package Manager Setup - WORKING SOLUTION

## Overview

StackPro uses a dual package manager approach that successfully resolves 53+ deployment failures:
- **pnpm** for local development (monorepo support, faster installs)
- **npm** for Amplify deployment (AWS compatibility, reliable builds)

## Final Working Configuration

### Root amplify.yml
```yaml
version: 1
env:
  variables:
    AMPLIFY_MONOREPO_APP_ROOT: frontend
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

### Key Success Factors

1. **Monorepo Detection**: `AMPLIFY_MONOREPO_APP_ROOT: frontend`
2. **Clean Dependencies**: Regenerated package-lock.json with 1854+ packages
3. **Reliable Build Command**: `npx next build` in package.json
4. **Correct Artifacts Path**: `frontend/.next` for monorepo structure
5. **No Build Blockers**: Removed preflight scripts and conflicting configs

## Architecture

```
Root (pnpm workspace)
├── amplify.yml (monorepo config)
├── frontend/ 
│   ├── package.json (npm managed)
│   ├── package-lock.json (1854+ packages)
│   └── .next/ (build artifacts)
├── packages/ (pnpm managed)
└── src/ (backend services)
```

## Deployment Process

1. **Amplify reads root amplify.yml**
2. **Detects monorepo with AMPLIFY_MONOREPO_APP_ROOT**
3. **Navigates to frontend directory**
4. **Installs dependencies with npm --legacy-peer-deps**
5. **Builds with npx next build**
6. **Finds artifacts in frontend/.next**
7. **Deploys successfully**

## Local Development

Use pnpm for local development:
```bash
pnpm install
pnpm dev
```

## Troubleshooting

- **Build fails**: Ensure package-lock.json has 1854+ packages
- **Next.js not found**: Use `npx next build` in package.json
- **Artifacts missing**: Verify `baseDirectory: frontend/.next`
- **Dependencies conflict**: Use `--legacy-peer-deps` flag

## Success Metrics

- ✅ Build Phase: ~7 minutes, all 17 pages generated
- ✅ Deploy Phase: Artifacts found and uploaded
- ✅ Status: Live at https://main.d3m3k3uuuvlvyv.amplifyapp.com
