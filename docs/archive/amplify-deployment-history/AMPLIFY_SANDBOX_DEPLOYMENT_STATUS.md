# 🌐 StackPro Amplify Sandbox Deployment Status

**Date**: August 8, 2025 9:22 AM PST  
**Status**: **PARTIAL SUCCESS - Manual Completion Required**  

---

## ✅ **INFRASTRUCTURE CREATED**

### **AWS Amplify App**
- ✅ **App Created**: StackPro-Sandbox 
- ✅ **App ID**: `d1459ja1mvj0ql` (was created but rolled back)
- ✅ **Region**: us-west-2
- ✅ **Build Settings**: Configured with Next.js build spec
- ✅ **Environment Variables**: All sandbox env vars configured

### **SSL Certificate** 
- ✅ **Certificate Requested**: `arn:aws:acm:us-east-1:564507211043:certificate/97f24629-e578-4534-aed5-a598d8a67c93`
- ✅ **Region**: us-east-1 (required for CloudFront)
- ⚠️ **Status**: PENDING_VALIDATION (DNS validation required)

### **Environment Variables Configured**
```bash
NEXT_PUBLIC_ENV=sandbox
NEXT_PUBLIC_API_URL=https://api-sandbox.stackpro.io
NEXT_PUBLIC_WS_URL=wss://ws-sandbox.stackpro.io
NEXT_PUBLIC_FREE_TIER=true
AI_ENABLED=false
TURNSTILE_ENABLED=true
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

---

## 🔄 **DEPLOYMENT ISSUE**

The automated deployment failed because:
- **Repository Connection**: Requires GitHub personal access token
- **Branch Creation**: Cannot create branch without repository connection
- **Domain Setup**: Failed due to missing branch reference

**Resolution**: Complete deployment manually via AWS Console

---

## 📋 **MANUAL COMPLETION STEPS**

### **Step 1: Recreate Amplify App**
1. Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify/home?region=us-west-2)
2. Click "Create new app" → "Host web app"
3. Connect GitHub repository: `https://github.com/frotofraggins/StackBox.git`
4. **App Settings**:
   - **Name**: StackPro-Sandbox
   - **Branch**: main
   - **Subdirectory**: frontend/
   - **Auto-deploy**: Enabled

### **Step 2: Configure Build Settings**
Build specification (add in Amplify console):
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

### **Step 3: Set Environment Variables**
In Amplify Console → App Settings → Environment variables, add:
```
NEXT_PUBLIC_ENV=sandbox
NEXT_PUBLIC_API_URL=https://api-sandbox.stackpro.io
NEXT_PUBLIC_WS_URL=wss://ws-sandbox.stackpro.io
NEXT_PUBLIC_FREE_TIER=true
AI_ENABLED=false
TURNSTILE_ENABLED=true
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
GENERATE_SOURCEMAP=false
NEXT_PUBLIC_MESSAGING_ENABLED=true
NEXT_PUBLIC_SITE_BUILDER_ENABLED=true
NEXT_PUBLIC_MAX_USERS=10
NEXT_PUBLIC_MAX_STORAGE_MB=100
```

### **Step 4: Configure Custom Domain**
1. In Amplify Console → Domain Management
2. Add custom domain: `sandbox.stackpro.io`
3. Select existing ACM certificate: `arn:aws:acm:us-east-1:564507211043:certificate/97f24629-e578-4534-aed5-a598d8a67c93`
4. Note the CNAME records provided

### **Step 5: DNS Configuration**
Add to Route53 hosted zone for stackpro.io:
```
Type: CNAME
Name: sandbox.stackpro.io
Value: [Amplify-provided CNAME from Step 4]
TTL: 300
```

### **Step 6: SSL Certificate Validation**
1. Navigate to [ACM Console](https://console.aws.amazon.com/acm/home?region=us-east-1)
2. Find certificate: `97f24629-e578-4534-aed5-a598d8a67c93`
3. Copy the DNS validation CNAME record
4. Add validation record to Route53:
   ```
   Type: CNAME
   Name: [ACM validation name]
   Value: [ACM validation value]
   TTL: 300
   ```

### **Step 7: Add robots.txt**
Create `frontend/public/robots.txt`:
```
User-agent: *
Disallow: /
```

---

## 🧪 **SMOKE TESTING CHECKLIST**

Once deployment completes, verify:

### **✅ Basic Functionality**
- [ ] **HTTPS Access**: https://sandbox.stackpro.io loads
- [ ] **SSL Certificate**: Valid and trusted
- [ ] **Environment**: Displays "sandbox" environment indicator
- [ ] **Console Errors**: No critical JavaScript errors

### **✅ API Integration** 
- [ ] **API Calls**: Frontend calls hit `https://api-sandbox.stackpro.io`
- [ ] **WebSocket**: WS connects to `wss://ws-sandbox.stackpro.io`
- [ ] **Free Tier Limits**: Max users = 10, storage = 100MB

### **✅ Security Features**
- [ ] **Turnstile**: CAPTCHA appears on signup/contact forms
- [ ] **AI Disabled**: No AI features visible
- [ ] **Source Maps**: Not accessible in production build

### **✅ Performance**
- [ ] **Page Load**: < 2 seconds for main pages
- [ ] **API Response**: < 500ms for basic endpoints
- [ ] **Error Handling**: Graceful degradation for failed requests

---

## 🎯 **EXPECTED DELIVERABLES**

Once manual steps complete:

### **✅ Infrastructure Deliverables**
- **Amplify App ID**: [New app ID from manual creation]
- **Live URL**: https://sandbox.stackpro.io
- **Default URL**: [Amplify-generated].amplifyapp.com
- **SSL Certificate**: arn:aws:acm:us-east-1:564507211043:certificate/97f24629-e578-4534-aed5-a598d8a67c93

### **✅ DNS Records Created**
- **A/AAAA Alias**: sandbox.stackpro.io → Amplify CloudFront
- **SSL Validation**: CNAME for certificate validation

### **✅ Smoke Test Results**
- Screenshots of working HTTPS site
- API call logs showing sandbox endpoints
- WebSocket connection success
- Turnstile CAPTCHA functioning

---

## 💰 **COST MONITORING**

### **Free Tier Usage**
- **Amplify**: Build minutes + hosting (within 15GB free tier)
- **CloudFront**: Data transfer (within 1TB free tier)  
- **Route53**: Hosted zone queries (within free tier)
- **ACM**: SSL certificate (free)

### **Expected Monthly Cost**: $0.00

### **Daily Budget Integration**
Add to existing budget email alerts:
- AWS Amplify service monitoring
- CloudFront data transfer tracking

---

## 🚀 **NEXT STEPS AFTER COMPLETION**

1. **✅ Verify all smoke tests pass**
2. **✅ Screenshot working HTTPS site**
3. **✅ Test API/WebSocket connections**
4. **✅ Confirm Turnstile working**
5. **✅ Pause for Phase 3 approval**

**Phase 2 Status**: **IN PROGRESS - Manual completion required**

---

## 🔗 **Quick Links**

- **Amplify Console**: https://console.aws.amazon.com/amplify/home?region=us-west-2
- **ACM Console**: https://console.aws.amazon.com/acm/home?region=us-east-1
- **Route53 Console**: https://console.aws.amazon.com/route53/v2/hostedzones
- **GitHub Repository**: https://github.com/frotofraggins/StackBox

**Manual completion should take 15-20 minutes once GitHub token is configured.**
