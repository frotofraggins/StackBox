# Job #5 Failure Analysis
*Generated: 2025-08-08 14:59:40*

## Problem: Amplify Still Using Inline BuildSpec

### Key Discovery
**Root Cause**: Amplify is **ignoring our amplify.yml file** and still using the inline buildspec.

**Evidence:**
```bash
aws amplify get-app --app-id d3m3k3uuuvlvyv --profile Stackbox --query "app.buildSpec"
```
**Output (Still Active):**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo 'Installing dependencies for sandbox deployment'
        - cd frontend  # <- Manual directory change (OLD METHOD)
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - echo 'Building Next.js app for sandbox'
        - npm run build
  artifacts:
    baseDirectory: frontend/.next  # <- Wrong path reference
```

### Build Logic Conflict

**Inline Buildspec Logic (Current - BROKEN):**
1. Start in repo root `/`
2. Run `cd frontend` → now in `/frontend/`
3. Run `npm ci` → installs to `/frontend/node_modules/`
4. Run `npm run build` → creates `/frontend/.next/`
5. **FAIL**: Try to find artifacts at `frontend/.next` relative to `/frontend/` = `/frontend/frontend/.next` (DOES NOT EXIST)

**Our amplify.yml Logic (Ignored - CORRECT):**
1. Set `appRoot: frontend` → Amplify starts in `/frontend/`
2. Run `npm ci` → installs to `/frontend/node_modules/`
3. Run `npm run build` → creates `/frontend/.next/`
4. **SUCCESS**: Find artifacts at `.next` relative to `/frontend/` = `/frontend/.next` (EXISTS)

### Solution Required
**Clear the inline buildspec** so Amplify reads `amplify.yml` from repository root.

**Command to Fix:**
```bash
# AWS CLI doesn't support clearing buildspec directly
# Must use AWS Console or boto3/API to set buildSpec to null
```

### Alternative Approach
Update the **inline buildspec** to match our amplify.yml logic:
```yaml
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
```

**Status**: Amplify configuration issue, not code issue. Files are correct.
