# StackPro Amplify Build - Pending Actions  
*Generated: 2025-08-08 13:17:30*

## ⚠️ AWAITING "GO" APPROVAL

### Immediate Actions (Ready to Execute)

#### 1. Set Additional Amplify Environment Variables
```bash
aws amplify update-app --app-id d3m3k3uuuvlvyv \
  --environment-variables \
  NODE_OPTIONS=--max_old_space_size=4096,\
  NEXT_PUBLIC_API_URL=https://api-sandbox.stackpro.io,\
  NEXT_PUBLIC_WS_URL=wss://ws-sandbox.stackpro.io,\
  SHARP_IGNORE_GLOBAL_LIBVIPS=1 \
  --profile Stackbox
```

#### 2. Apply File Changes (4 files)
- **NEW**: `amplify.yml` (repo root) - 15 lines
- **PATCH**: `frontend/package.json` - +3 lines  
- **PATCH**: `frontend/next.config.js` - +6 lines
- **OPTIONAL**: `.npmrc` (repo root) - 3 lines

#### 3. Trigger New Build
```bash
aws amplify start-job --app-id d3m3k3uuuvlvyv --branch-name main --job-type RELEASE --profile Stackbox
```

#### 4. Monitor Build Progress
```bash
# Check status every 2 minutes
aws amplify get-job --app-id d3m3k3uuuvlvyv --branch-name main --job-id 4 --profile Stackbox
```

### Success Criteria
- ✅ Build completes successfully (status: SUCCEED)
- ✅ Website accessible at: https://d3m3k3uuuvlvyv.amplifyapp.com
- ✅ Homepage loads without errors
- ✅ Environment variables correctly injected
- ✅ Next.js app renders with sandbox configuration

### Rollback Plan (if build fails)
```bash
# Revert commits
git reset HEAD~1 --hard
git push origin main --force

# Or create hotfix
git checkout -b hotfix/revert-amplify-fix
git revert HEAD
git push origin hotfix/revert-amplify-fix
```

### Post-Success Actions (After Build Green)
1. Verify smoke test checklist
2. Plan custom domain setup (sandbox.stackpro.io)  
3. Set up service-level budgets (Amplify, AppSync, Bedrock)
4. Document successful configuration for production reference

### Risk Assessment
- **Low Risk**: All changes are minimal and reversible
- **Cost Impact**: $0 (free-tier friendly)
- **Infrastructure Impact**: None (sandbox only)
- **Rollback Time**: <5 minutes

---
**STATUS**: Ready for execution upon "GO" approval
**CONFIDENCE**: HIGH (90%) - Standard monorepo fix pattern
**ESTIMATED TIME**: 10-15 minutes total execution
