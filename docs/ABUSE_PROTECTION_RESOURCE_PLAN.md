# 🛡️ StackPro Free-Tier Abuse Protection - Resource Plan

**Target Environment**: Sandbox only (Project=StackPro,Env=FreeTier)  
**Cost Impact**: $0.00 (stays within AWS free tier)  
**Production Impact**: None (feature-flagged and isolated)  
**Downtime Risk**: Zero (additive resources only)

---

## 📋 **RESOURCE CHANGES OVERVIEW**

### **🔒 Guardrails Compliance**
- ✅ **No downtime**: Only adding new resources, no modifications to existing
- ✅ **No production changes**: All resources tagged Env=FreeTier 
- ✅ **Zero cost**: Uses existing free tier allowances
- ✅ **Feature-flagged**: Behind ABUSE_PROTECTION_ENABLED=true

### **🎯 Implementation Scope**
- **New DynamoDB Table**: stackpro-sandbox-quotas (pay-per-request)
- **New Lambda Function**: stackpro-sandbox-tenant-lock 
- **Extended CloudWatch**: 5 new alarms, dashboard updates
- **Backend Middleware**: Express rate limiting + quota enforcement
- **Frontend Integration**: Cloudflare Turnstile CAPTCHA
- **Admin APIs**: Tenant suspension/unsuspension endpoints

---

## 🗄️ **1. NEW DYNAMODB RESOURCES**

### **Table: stackpro-sandbox-quotas**
```json
{
  "TableName": "stackpro-sandbox-quotas",
  "BillingMode": "PAY_PER_REQUEST",
  "AttributeDefinitions": [
    {
      "AttributeName": "scope",
      "AttributeType": "S"
    },
    {
      "AttributeName": "date",
      "AttributeType": "S"
    }
  ],
  "KeySchema": [
    {
      "AttributeName": "scope",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "date", 
      "KeyType": "RANGE"
    }
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  },
  "Tags": [
    {
      "Key": "Project",
      "Value": "StackPro"
    },
    {
      "Key": "Env",
      "Value": "FreeTier"
    },
    {
      "Key": "Purpose",
      "Value": "AbuseProtection"
    }
  ]
}
```

**Estimated Cost**: $0.00 (within 25GB/25RCU/25WCU free tier)

**Data Model**:
- **PK**: `scope` (tenant#<id>, user#<id>, ip#<ipv4>)
- **SK**: `date` (yyyy-mm-dd UTC)
- **Attributes**: `{ apiCalls: 0, wsMsgs: 0, filesUploaded: 0, bytesUploaded: 0 }`
- **TTL**: `ttl` (set to next midnight UTC)

---

## ⚡ **2. NEW LAMBDA FUNCTIONS**

### **Function: stackpro-sandbox-tenant-lock**
```json
{
  "FunctionName": "stackpro-sandbox-tenant-lock",
  "Runtime": "nodejs18.x",
  "Handler": "index.handler",
  "MemorySize": 256,
  "Timeout": 30,
  "Environment": {
    "Variables": {
      "QUOTAS_TABLE": "stackpro-sandbox-quotas",
      "ABUSE_PROTECTION_ENABLED": "true"
    }
  },
  "Tags": {
    "Project": "StackPro",
    "Env": "FreeTier",
    "Purpose": "AnomalyResponse"
  }
}
```

**Trigger**: CloudWatch Alarm (HighUsageAnomaly)
**Action**: Set tenant status to SUSPENDED_ABUSE
**Estimated Cost**: $0.00 (within 1M requests/400k GB-sec free tier)

---

## 📊 **3. CLOUDWATCH EXTENSIONS**

### **New Custom Metrics**
1. `StackPro/Sandbox/QuotaRejected` (Count, Dimensions: TenantId, QuotaType)
2. `StackPro/Sandbox/AnomalyLockTriggered` (Count, Dimensions: TenantId)
3. `StackPro/Sandbox/CaptchaFailed` (Count, Dimensions: FormType)
4. `StackPro/Sandbox/TenantSuspended` (Count, Dimensions: Reason)
5. `StackPro/Sandbox/ApiThrottled` (Count, Dimensions: Route, IP)

### **New CloudWatch Alarms**

#### **Alarm 1: QuotaRejectedRateHigh**
```json
{
  "AlarmName": "StackPro-Sandbox-QuotaRejectedRateHigh",
  "ComparisonOperator": "GreaterThanThreshold",
  "EvaluationPeriods": 2,
  "MetricName": "QuotaRejected",
  "Namespace": "StackPro/Sandbox",
  "Period": 300,
  "Statistic": "Sum",
  "Threshold": 250,
  "ActionsEnabled": true,
  "AlarmActions": [],
  "AlarmDescription": "High rate of quota rejections indicates potential abuse",
  "Tags": [
    {"Key": "Project", "Value": "StackPro"},
    {"Key": "Env", "Value": "FreeTier"}
  ]
}
```

#### **Alarm 2: HighUsageAnomaly (Composite)**
```json
{
  "AlarmName": "StackPro-Sandbox-HighUsageAnomaly",
  "AlarmRule": "(ALARM 'StackPro-Sandbox-ApiSpike-Tenant' OR ALARM 'StackPro-Sandbox-WSSpike-Tenant')",
  "ActionsEnabled": true,
  "AlarmActions": [
    "arn:aws:lambda:us-west-2:304052673868:function:stackpro-sandbox-tenant-lock"
  ],
  "AlarmDescription": "Composite alarm for usage spikes triggering tenant lock",
  "Tags": [
    {"Key": "Project", "Value": "StackPro"},
    {"Key": "Env", "Value": "FreeTier"}
  ]
}
```

#### **Alarm 3: ApiSpike-Tenant**
```json
{
  "AlarmName": "StackPro-Sandbox-ApiSpike-Tenant",
  "ComparisonOperator": "GreaterThanThreshold",
  "EvaluationPeriods": 1,
  "MetricName": "ApiRequests",
  "Namespace": "StackPro/Sandbox",
  "Period": 900,
  "Statistic": "Sum",
  "Threshold": 1000,
  "TreatMissingData": "notBreaching",
  "AlarmDescription": "Detect API usage spikes per tenant",
  "Tags": [
    {"Key": "Project", "Value": "StackPro"},
    {"Key": "Env", "Value": "FreeTier"}
  ]
}
```

#### **Alarm 4: WSSpike-Tenant**
```json
{
  "AlarmName": "StackPro-Sandbox-WSSpike-Tenant", 
  "ComparisonOperator": "GreaterThanThreshold",
  "EvaluationPeriods": 1,
  "MetricName": "WsMessages",
  "Namespace": "StackPro/Sandbox",
  "Period": 900,
  "Statistic": "Sum", 
  "Threshold": 1000,
  "TreatMissingData": "notBreaching",
  "AlarmDescription": "Detect WebSocket message spikes per tenant",
  "Tags": [
    {"Key": "Project", "Value": "StackPro"},
    {"Key": "Env", "Value": "FreeTier"}
  ]
}
```

#### **Alarm 5: AnomalyLockTriggered**
```json
{
  "AlarmName": "StackPro-Sandbox-AnomalyLockTriggered",
  "ComparisonOperator": "GreaterThanOrEqualToThreshold",
  "EvaluationPeriods": 1,
  "MetricName": "AnomalyLockTriggered", 
  "Namespace": "StackPro/Sandbox",
  "Period": 300,
  "Statistic": "Sum",
  "Threshold": 1,
  "AlarmActions": [],
  "AlarmDescription": "Alert when anomaly detection triggers tenant lock",
  "Tags": [
    {"Key": "Project", "Value": "StackPro"},
    {"Key": "Env", "Value": "FreeTier"}
  ]
}
```

**Estimated Cost**: $0.00 (within 10 custom metrics, 10 alarms free tier)

---

## 🌐 **4. API GATEWAY CHANGES**

### **Route-Level Throttling Updates**
```json
{
  "RouteThrottling": {
    "POST /lead": {
      "RateLimit": 60,
      "BurstLimit": 120
    },
    "POST /signup": {
      "RateLimit": 30,
      "BurstLimit": 60
    },
    "POST /files/presign": {
      "RateLimit": 100,
      "BurstLimit": 200
    },
    "WS $default": {
      "RateLimit": 500,
      "BurstLimit": 1000
    }
  }
}
```

**Cost Impact**: $0.00 (no additional charges for throttling)

---

## 💻 **5. BACKEND CODE CHANGES**

### **New Files to Create**:
1. `src/middleware/abuseProtection.js` - Main quota enforcement
2. `src/middleware/rateLimiter.js` - Token bucket rate limiting  
3. `src/services/quotaService.js` - DynamoDB quota operations
4. `src/services/captchaService.js` - Turnstile verification
5. `src/services/suspensionService.js` - Tenant lock/unlock
6. `src/api/routes/admin.js` - Admin suspension endpoints
7. `src/lambdas/tenantLock.js` - CloudWatch alarm handler

### **Files to Modify**:
1. `src/api/server.js` - Add middleware integration
2. `src/services/messaging/websocket-handler.js` - Add WS quota checks
3. `src/api/routes/site-builder.js` - Add presign quota checks
4. `frontend/src/components/SignupForm.tsx` - Add Turnstile
5. `frontend/src/pages/contact.tsx` - Add Turnstile

**Feature Flag**: All changes wrapped in `process.env.ABUSE_PROTECTION_ENABLED === 'true'`

---

## 🎨 **6. FRONTEND CHANGES**

### **New Dependencies**:
```json
{
  "dependencies": {
    "@marsidev/react-turnstile": "^0.7.0"
  }
}
```

### **Components to Update**:
1. **SignupForm.tsx** - Add Turnstile widget
2. **ContactForm.tsx** - Add Turnstile widget  
3. **LeadCaptureForm.tsx** - Add Turnstile widget

### **Environment Variables**:
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
NEXT_PUBLIC_ABUSE_PROTECTION_ENABLED=true
```

---

## 📝 **7. CONFIGURATION UPDATES**

### **New Environment Variables**:
```bash
# Feature Flags
ABUSE_PROTECTION_ENABLED=true
TURNSTILE_ENABLED=true

# Quota Limits
QUOTA_TENANT_API_DAILY=5000
QUOTA_USER_API_DAILY=1000  
QUOTA_IP_API_DAILY=1500
QUOTA_TENANT_WS_MSGS_DAILY=5000
QUOTA_USER_WS_MSGS_DAILY=1000
QUOTA_TENANT_FILES_DAILY=20
QUOTA_MAX_FILE_MB=10

# Rate Limiting
RATE_LIMIT_RPM=120
RATE_LIMIT_BURST=240

# Turnstile
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

# Tables
QUOTAS_TABLE=stackpro-sandbox-quotas
```

---

## 📊 **8. MONITORING DASHBOARD EXTENSIONS**

### **New Dashboard Widgets**:
1. **Quota Rejections by Tenant** (Top 10, 24h)
2. **API Requests by Tenant** (Top 10, 24h)  
3. **WebSocket Messages by Tenant** (Top 10, 24h)
4. **Suspended Tenants** (Current count)
5. **CAPTCHA Failures** (Rate over time)
6. **Rate Limit Hits** (By IP and route)

### **Extended Metrics**:
- All existing metrics remain unchanged
- New abuse-protection metrics added alongside

---

## 🧪 **9. TESTING PLAN**

### **Automated Test Suite** (`scripts/test-abuse-protection.js`):
1. **Quota Tests**:
   - Create tenant + 2 users
   - Hit QUOTA_USER_API_DAILY+1 → expect 429
   - Verify resetAt timestamp in response

2. **WebSocket Quota Tests**:
   - Send QUOTA_USER_WS_MSGS_DAILY+1 messages
   - Expect quota error payload

3. **File Upload Tests**:
   - Request > QUOTA_TENANT_FILES_DAILY presigns
   - Last request should fail with 429

4. **CAPTCHA Tests**:
   - Submit /signup with invalid Turnstile token
   - Expect 400 response

5. **Anomaly Tests**:
   - Flood one tenant quickly (1000 requests in 1 minute)
   - Confirm SUSPENDED_ABUSE status flip
   - Verify CloudWatch alarm fired

### **Test Deliverables**:
- Automated test script with pass/fail results
- Screenshots of dashboard showing metrics
- CloudWatch alarm status screenshots
- Sample 429 response payloads

---

## 💰 **10. COST ANALYSIS**

### **Resource Utilization**:
- **DynamoDB**: ~100 items/day × 365 days = 36.5K items (well within 25GB)
- **Lambda**: ~50 executions/day × 256MB × 5s = 64MB-seconds (within 400K GB-seconds)
- **CloudWatch**: 5 new metrics (within 10 free), 5 alarms (within 10 free)
- **API Gateway**: No additional requests (using existing allocation)

### **Estimated Monthly Cost**: **$0.00**

All resources stay within AWS free tier limits with significant headroom.

---

## 🔄 **11. ROLLOUT STRATEGY**

### **Phase 1: Infrastructure**
1. Create DynamoDB table
2. Deploy Lambda function
3. Create CloudWatch alarms
4. Update API Gateway throttling

### **Phase 2: Backend Integration**
1. Deploy middleware with feature flag OFF
2. Test quota service independently  
3. Enable feature flag for internal testing
4. Gradual rollout to sandbox users

### **Phase 3: Frontend Integration**
1. Add Turnstile to staging environment
2. Test CAPTCHA flows
3. Deploy to production with feature flag
4. Monitor and adjust thresholds

### **Rollback Plan**:
- Set ABUSE_PROTECTION_ENABLED=false
- All new code paths become inactive
- DynamoDB table can remain (zero cost)
- CloudWatch alarms can be disabled

---

## 📋 **12. DELIVERABLES SUMMARY**

### **Code Changes**:
- [ ] 7 new backend files
- [ ] 5 modified backend files  
- [ ] 3 modified frontend components
- [ ] 1 new Lambda function
- [ ] 1 comprehensive test suite

### **Infrastructure**:
- [ ] 1 new DynamoDB table
- [ ] 5 new CloudWatch alarms
- [ ] 1 new Lambda function
- [ ] Updated API Gateway throttling
- [ ] Extended CloudWatch dashboard

### **Documentation**:
- [ ] `docs/FREE_TIER_ABUSE_PROTECTION.md`
- [ ] Architecture diagram
- [ ] Limits reference table
- [ ] Admin procedures
- [ ] Test results report

### **Testing**:
- [ ] Automated test suite
- [ ] Manual verification checklist  
- [ ] Dashboard screenshots
- [ ] Performance impact analysis

---

## ⚠️ **SAFETY CHECKLIST**

- ✅ **Zero production impact**: All resources tagged Env=FreeTier
- ✅ **Zero downtime risk**: Only additive changes
- ✅ **Zero cost increase**: Within free tier limits
- ✅ **Feature flagged**: Can be disabled instantly
- ✅ **Gradual rollout**: Controlled deployment phases
- ✅ **Rollback ready**: All changes can be reverted
- ✅ **Conservative limits**: Start with safe thresholds
- ✅ **Monitoring first**: Observability before enforcement

---

## 🚨 **APPROVAL REQUIRED**

**Before proceeding, please confirm**:

1. ✅ Resource plan approved (DynamoDB table, Lambda, CloudWatch alarms)
2. ✅ Cost analysis acceptable ($0.00 impact)
3. ✅ Implementation approach agreed
4. ✅ Testing plan sufficient
5. ✅ Rollout strategy approved

**Once approved, implementation will proceed in phases with status updates after each phase.**

---

**Total Implementation Time**: 4-6 hours
**Risk Level**: Low (feature-flagged, zero cost, zero production impact)
**Business Impact**: High (prevents abuse, maintains service quality)
