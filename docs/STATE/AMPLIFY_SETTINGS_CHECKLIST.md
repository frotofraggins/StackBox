# Amplify Configuration Checklist
*Generated: 2025-08-08 13:16:30*

## Required Amplify App Settings

### App Configuration
- [x] **App ID**: d3m3k3uuuvlvyv
- [x] **Region**: us-west-2  
- [x] **Repository**: https://github.com/frotofraggins/stackbox
- [x] **Branch**: main (auto-deploy enabled)

### Environment Variables (Amplify Console → App → Environment Variables)
**Current Status:** ✅ Already Set
```ini
NEXT_PUBLIC_ENV=sandbox
NEXT_PUBLIC_FREE_TIER=true  
AI_ENABLED=false
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**Additional Variables Needed:** ⚠️ TO BE SET
```ini
NODE_OPTIONS=--max_old_space_size=4096
NEXT_PUBLIC_API_URL=https://api-sandbox.stackpro.io
NEXT_PUBLIC_WS_URL=wss://ws-sandbox.stackpro.io
SHARP_IGNORE_GLOBAL_LIBVIPS=1
```

### Build Configuration
- [x] **Build Compute**: STANDARD_8GB (already set)
- [x] **Node Runtime**: Default (will be 18.x from amplify.yml)
- [ ] **Build Spec Source**: Will use amplify.yml from repository root

### Build Specification Mapping
**Current (Broken):**
```yaml
# Using inline buildspec, no appRoot
cd frontend  # Manual directory change
npm ci
npm run build
artifacts: frontend/.next  # Wrong path
```

**Proposed (Fixed):**
```yaml
# Using amplify.yml with proper appRoot
version: 1
applications:
  - appRoot: frontend      # ✅ Sets build context
    frontend:
      phases:
        preBuild:
          commands:
            - nvm install 18     # ✅ Explicit Node version
            - nvm use 18
            - npm ci
        build:
          commands:
            - NEXT_TELEMETRY_DISABLED=1 CI=false npm run build
      artifacts:
        baseDirectory: .next    # ✅ Relative to appRoot (frontend/)
```

### Domain Configuration
- [x] **Default Domain**: d3m3k3uuuvlvyv.amplifyapp.com (active)
- [ ] **Custom Domain**: sandbox.stackpro.io (planned after build success)

## Verification Commands
```bash
# Check current app settings
aws amplify get-app --app-id d3m3k3uuuvlvyv --profile Stackbox

# Check environment variables
aws amplify get-app --app-id d3m3k3uuuvlvyv --profile Stackbox --query "app.environmentVariables"

# Check build settings  
aws amplify get-branch --app-id d3m3k3uuuvlvyv --branch-name main --profile Stackbox
```

## Pre-Deploy Checklist
- [x] Environment variables configured
- [ ] amplify.yml created at repo root
- [ ] frontend/package.json updated with engines
- [ ] frontend/next.config.js updated with env guards
- [ ] Optional .npmrc created
