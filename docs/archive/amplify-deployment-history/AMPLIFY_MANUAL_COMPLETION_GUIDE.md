# 🚀 **STEP-BY-STEP: Complete Amplify Sandbox Deployment**

**Let's finish Phase 2 together!** 

Each step includes exact values and screenshots guidance.

---

## **STEP 1: Create Amplify App** ⭐

### **Action Required**:
1. **Open**: [AWS Amplify Console](https://console.aws.amazon.com/amplify/home?region=us-west-2) in new tab
2. **Click**: "Create new app" → "Host web app" 
3. **Select**: GitHub (if not connected, authorize GitHub access)

### **Repository Configuration**:
```
Repository: frotofraggins/StackBox
Branch: main
```

### **App Settings**:
```
App name: StackPro-Sandbox
Subdirectory: frontend/
Auto-deploy: ✅ Enable
```

**✅ Expected Result**: Amplify app created with auto-deployment enabled

---

## **STEP 2: Configure Build Settings** ⚙️

### **Action Required**:
1. **Navigate to**: App Settings → Build settings  
2. **Click**: "Edit" on build specification
3. **Replace content** with:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - echo "Installing dependencies for sandbox deployment"
            - cd frontend
            - npm ci --only=production
        build:
          commands:
            - echo "Building Next.js app for sandbox"  
            - echo "Free tier mode: $NEXT_PUBLIC_FREE_TIER"
            - echo "AI disabled: $AI_ENABLED"
            - npm run build
      artifacts:
        baseDirectory: frontend/.next
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
    appRoot: ./
```

4. **Click**: "Save"

**✅ Expected Result**: Build settings updated

---

## **STEP 3: Set Environment Variables** 🔧

### **Action Required**:
1. **Navigate to**: App Settings → Environment variables
2. **Click**: "Manage variables"
3. **Add each variable** (click "Add variable" for each):

```
NEXT_PUBLIC_ENV = sandbox
NEXT_PUBLIC_API_URL = https://api-sandbox.stackpro.io
NEXT_PUBLIC_WS_URL = wss://ws-sandbox.stackpro.io
NEXT_PUBLIC_FREE_TIER = true
AI_ENABLED = false
TURNSTILE_ENABLED = true
NODE_ENV = production
NEXT_TELEMETRY_DISABLED = 1
GENERATE_SOURCEMAP = false
NEXT_PUBLIC_MESSAGING_ENABLED = true
NEXT_PUBLIC_SITE_BUILDER_ENABLED = true
NEXT_PUBLIC_MAX_USERS = 10
NEXT_PUBLIC_MAX_STORAGE_MB = 100
```

4. **Click**: "Save"

**✅ Expected Result**: 12 environment variables configured

---

## **STEP 4: Trigger First Build** 🔨

### **Action Required**:
1. **Navigate to**: Main app dashboard
2. **Click**: "Start build" or wait for auto-trigger
3. **Monitor**: Build progress (should take 3-5 minutes)

### **Expected Build Stages**:
- ✅ Provision
- ✅ Build (frontend npm install + npm run build)
- ✅ Deploy 
- ✅ Verify

**✅ Expected Result**: Build succeeds, default URL works

---

## **STEP 5: SSL Certificate Validation** 🔒

### **Action Required**:
1. **Open**: [ACM Console](https://console.aws.amazon.com/acm/home?region=us-east-1) (must be us-east-1)
2. **Find certificate**: `97f24629-e578-4534-aed5-a598d8a67c93`
3. **Click**: Certificate ID to view details
4. **Copy**: DNS validation CNAME record

### **Certificate Validation Values** (example format):
```
Name: _abc123def456.sandbox.stackpro.io.
Value: _xyz789ghi012.acm-validations.aws.
```

### **Add DNS Record**:
1. **Open**: [Route53 Console](https://console.aws.amazon.com/route53/v2/hostedzones)
2. **Find**: stackpro.io hosted zone
3. **Click**: "Create record"
4. **Settings**:
   - **Record type**: CNAME
   - **Record name**: [Copy from ACM - the _abc123def456 part]
   - **Value**: [Copy from ACM - the _xyz789ghi012 part]  
   - **TTL**: 300

5. **Click**: "Create records"

**⏳ Wait**: 5-10 minutes for validation (refresh ACM console)

**✅ Expected Result**: Certificate status changes to "Issued"

---

## **STEP 6: Configure Custom Domain** 🌐

### **Action Required** (only after SSL certificate is "Issued"):
1. **Return to**: Amplify Console → Domain management
2. **Click**: "Add domain"
3. **Settings**:
   - **Domain**: `sandbox.stackpro.io`
   - **Certificate**: Select the issued certificate `97f24629-e578-4534-aed5-a598d8a67c93`
   - **Subdomain settings**: 
     - **Subdomain**: (leave empty for root)
     - **Branch**: main

4. **Click**: "Save"

### **Note CNAME Values**:
Amplify will provide a CNAME like:
```
d-abc123def456.cloudfront.net
```

### **Add Domain DNS Record**:
1. **Return to**: Route53 Console
2. **Create record**:
   - **Record type**: CNAME
   - **Record name**: sandbox
   - **Value**: [Amplify-provided CloudFront domain]
   - **TTL**: 300

3. **Click**: "Create records"

**✅ Expected Result**: Domain shows "Available" in Amplify console

---

## **STEP 7: Add robots.txt** 🤖

### **Action Required**:
1. **Create file**: `frontend/public/robots.txt` in your local repository
2. **Content**:
```
User-agent: *
Disallow: /
```

3. **Commit and push** to trigger new build:
```bash
git add frontend/public/robots.txt
git commit -m "Add robots.txt for sandbox"  
git push origin main
```

**✅ Expected Result**: New build triggered automatically

---

## **STEP 8: Smoke Test** 🧪

### **Test Checklist**:
Wait 15-20 minutes for DNS propagation, then test:

#### **Basic Tests**:
- [ ] ✅ **https://sandbox.stackpro.io** loads
- [ ] ✅ **SSL certificate** shows as valid (green lock)  
- [ ] ✅ **No console errors** (F12 → Console tab)
- [ ] ✅ **Sandbox environment** indicator visible

#### **API Tests** (expect failures until API is deployed):
- [ ] ⚠️ **API calls** attempt to reach `api-sandbox.stackpro.io` (will fail - expected)
- [ ] ⚠️ **WebSocket** attempts connection to `ws-sandbox.stackpro.io` (will fail - expected)

#### **Feature Tests**:
- [ ] ✅ **Pages load**: pricing, features, about, contact
- [ ] ✅ **Turnstile CAPTCHA** appears on forms (if configured)
- [ ] ✅ **No AI features** visible (AI disabled)

---

## **📊 COMPLETION CONFIRMATION**

### **Take Screenshots** 📸:
1. **Working HTTPS site**: https://sandbox.stackpro.io
2. **Valid SSL certificate**: Browser address bar with green lock
3. **Amplify dashboard**: Showing successful deployment
4. **Route53 records**: sandbox CNAME + SSL validation CNAME

### **Collect Final Details** 📋:
From Amplify console, note:
- **App ID**: [New app ID]
- **Default URL**: [App].amplifyapp.com  
- **Custom Domain Status**: Available
- **Last Build**: Success

---

## **🎯 COMPLETION CHECKLIST**

- [ ] ✅ Amplify app created and connected to GitHub
- [ ] ✅ Build settings configured with Next.js spec
- [ ] ✅ All 12 environment variables set  
- [ ] ✅ First build completed successfully
- [ ] ✅ SSL certificate validated and issued
- [ ] ✅ Custom domain configured and DNS records added
- [ ] ✅ robots.txt added and deployed
- [ ] ✅ Smoke tests completed with screenshots
- [ ] ✅ API errors expected (backend not deployed yet)

---

## **🚀 READY FOR PHASE 3**

Once checklist complete, Phase 2 is done!

**Next**: Phase 3 - Production API Gateway setup (without DNS cutover)

**Estimated Time**: 15-20 minutes total
**Current Step**: [Tell me which step you're on]

---

Let me know when you start Step 1 and I'll help you through each step! 🚀
