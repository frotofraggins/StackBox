# StackBox Amplify Deployment Fix Plan

## Current Status: 47 Consecutive Failed Deployments
**Primary Issue**: Node.js version incompatibility and invalid Next.js build flags

---

## 🚨 IMMEDIATE FIXES (Phase 1 - Critical Path)

### 1. **Node.js Version Compatibility**
- **Problem**: Project requires Node >=22, Amplify uses v18.20.8
- **Solution**: Use Node 20.x (latest supported by Amplify)
- **Files Created/Modified**: 
  - ✅ `amplify-fixed.yml` - New simplified Amplify config
  - ✅ `frontend/package.json` - Fixed engine requirement and build script

### 2. **Invalid Next.js Build Flag**
- **Problem**: `--no-build-trace` flag doesn't exist in Next.js
- **Solution**: Remove invalid flag, use standard `next build`
- **Status**: ✅ Fixed in `frontend/package.json`

### 3. **Simplified Build Process**
- **Problem**: Complex turbo prune process causing timeouts
- **Solution**: Direct frontend build without monorepo complexity
- **Status**: ✅ Implemented in `amplify-fixed.yml`

---

## 📋 DEPLOYMENT PHASES

### **PHASE 1: Critical Fixes (IMMEDIATE - Today)**
```bash
# Actions Required:
1. Replace current amplify.yml with amplify-fixed.yml
2. Test build locally: cd frontend && pnpm run build:amplify:fixed
3. Deploy to test the fixes
```

### **PHASE 2: Build Optimization (1-2 days)**
- Optimize memory usage and build performance
- Add proper error handling and logging
- Implement build caching strategies

### **PHASE 3: Monorepo Integration (3-5 days)**
- Properly integrate turbo build system with Amplify
- Set up workspace-aware builds
- Implement selective package building

### **PHASE 4: Advanced Features (1 week)**
- Environment-specific configurations
- Preview deployments
- Automated testing in CI/CD

---

## 🔧 TECHNICAL BREAKDOWN

### **Frontend Build Issues**
1. **Node Version**: ✅ Fixed (>=20 instead of >=22)
2. **Build Command**: ✅ Fixed (removed --no-build-trace)
3. **Memory**: ✅ Optimized (8GB allocated)
4. **Dependencies**: ⏳ Need to verify compatibility

### **Amplify Configuration Issues**
1. **Runtime**: ✅ Fixed (nodejs20.x)
2. **Build Path**: ✅ Simplified (direct frontend build)
3. **Artifacts**: ✅ Corrected (.next output)
4. **Cache**: ✅ Optimized (node_modules caching)

### **Monorepo Complexity**
1. **Workspace**: ⏳ Need to integrate properly
2. **Dependencies**: ⏳ Cross-package dependencies need review
3. **Build Order**: ⏳ Turbo pipeline needs Amplify integration

---

## 🚀 NEXT STEPS (Priority Order)

### **Step 1: Deploy Immediate Fix**
```bash
# Replace amplify.yml with the fixed version
cp amplify-fixed.yml amplify.yml
git add .
git commit -m "fix(amplify): critical build fixes - Node 20.x + removed invalid flags"
git push origin main
```

### **Step 2: Monitor Build**
- Watch Amplify console for build progress
- Check for any remaining errors
- Verify successful deployment

### **Step 3: Local Testing**
```bash
# Test the build locally first
cd frontend
pnpm install
pnpm run build:amplify:fixed
```

### **Step 4: Incremental Improvements**
- Add better error handling
- Optimize build performance
- Re-integrate monorepo features gradually

---

## 📊 SUCCESS METRICS

### **Phase 1 Success Criteria**
- [ ] Build completes without Node version warnings
- [ ] Next.js build succeeds without flag errors
- [ ] Deployment completes in < 5 minutes
- [ ] Site loads successfully at domain

### **Long-term Success Criteria**
- [ ] Consistent build times < 3 minutes
- [ ] Zero failed deployments for 1 week
- [ ] Full monorepo integration working
- [ ] Preview deployments functional

---

## 🛠 TROUBLESHOOTING GUIDE

### **If Build Still Fails After Phase 1**
1. Check Node version in Amplify logs
2. Verify pnpm installation succeeded
3. Check for missing dependencies
4. Review Next.js configuration compatibility

### **Common Issues to Watch For**
- Memory exhaustion (increase NODE_OPTIONS)
- Package resolution issues (check pnpm-lock.yaml)
- Missing environment variables
- Incompatible dependency versions

---

## 📁 FILES MODIFIED/CREATED

### **Created Files**
- `amplify-fixed.yml` - Fixed Amplify configuration
- `AMPLIFY_DEPLOYMENT_FIX_PLAN.md` - This action plan

### **Modified Files**
- `frontend/package.json` - Fixed build scripts and Node version

### **Files to Review Next**
- `next.config.js` - May need Amplify-specific optimizations
- `tailwind.config.js` - Build-time dependencies
- `tsconfig.json` - TypeScript configuration compatibility

---

## 🎯 IMMEDIATE ACTION REQUIRED

**Replace the current amplify.yml with amplify-fixed.yml and deploy immediately to break the failure cycle.**

The current configuration has fundamental incompatibilities that will continue to cause failures. The fixed version addresses:
- ✅ Node.js compatibility
- ✅ Invalid build flags
- ✅ Simplified build process
- ✅ Proper artifact configuration

**Est. time to fix**: 15 minutes to deploy + 5 minutes build time = 20 minutes total
