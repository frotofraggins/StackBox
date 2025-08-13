# 🏗️ StackPro Capability Architecture

**Version**: 1.0  
**Date**: August 9, 2025  
**Status**: Phase 0 - Scaffolding Complete

---

## 🎯 **Overview**

StackPro implements a **production-ready, modular backend architecture** where each "capability" (Messaging, AI, Data Lake, Billing) exposes a stable contract, tiny SDK, feature flags, degraded fallbacks, and first-class observability—all within AWS free tier constraints.

### **Design Principles**

1. **Contracts-First**: OpenAPI specs define the interface before implementation
2. **SDK-Driven**: Lightweight, generated clients with graceful degradation
3. **Flag-Controlled**: Feature flags enable/disable capabilities safely
4. **Discovery-Based**: Runtime service resolution via environment + SSM
5. **Observability-First**: Structured logging, metrics, and tracing built-in
6. **Free-Tier Optimized**: Lambda, API Gateway, DynamoDB On-Demand only

---

## 🏛️ **Architecture Components**

### **1. Contracts (`/packages/contracts/`)**

Each capability defines its interface using OpenAPI 3.0 specifications:

```
/packages/contracts/
├── messaging/
│   └── v1.yaml          # Messaging API contract
├── datalake/
│   └── v1.yaml          # Data Lake API contract
├── ai/
│   └── v1.yaml          # AI Services API contract
└── billing/
    └── v1.yaml          # Billing API contract
```

**Contract Requirements**:
- **SemVer Versioning**: Never break `/v1`, use `/v2` for breaking changes
- **Response Shapes**: All responses include `degraded: boolean` field
- **Error Handling**: Standardized error response format
- **Authentication**: IAM or JWT-based auth schemes defined

**Example Contract Structure**:
```yaml
# /packages/contracts/messaging/v1.yaml
openapi: 3.0.3
info:
  title: StackPro Messaging API
  version: 1.0.0
paths:
  /v1/threads:
    get:
      summary: List message threads
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  threads:
                    type: array
                    items:
                      $ref: '#/components/schemas/Thread'
                  degraded:
                    type: boolean
                    description: True if service is in degraded mode
```

### **2. Client SDKs (`/packages/clients/`)**

Lightweight, dependency-minimal clients generated from contracts:

```
/packages/clients/
├── messaging/
│   ├── package.json
│   ├── src/
│   │   └── index.ts     # Generated client
│   └── dist/            # Built output
├── datalake/
├── ai/
└── billing/
```

**SDK Features**:
- **Dependency-Light**: Only `fetch` + generated types
- **Configuration**: `createClient({ baseUrl, getAuthToken, timeoutMs })`
- **Graceful Degradation**: Never throw, return `{ degraded: true }` on failure
- **Tree-Shakeable**: ESM exports for optimal bundling
- **TypeScript-First**: Full type safety from contracts

**Example SDK Usage**:
```typescript
import { createMessagingClient } from '@stackpro/messaging-client'

const client = createMessagingClient({
  baseUrl: await resolveCapabilityUrl('messaging'),
  getAuthToken: () => getJWTToken(),
  timeoutMs: 5000
})

const result = await client.listThreads()
if (result.degraded) {
  // Show degraded UI banner
  console.warn('Messaging service temporarily unavailable')
}
```

### **3. Runtime Services (`/packages/runtime/`)**

Core infrastructure services supporting all capabilities:

#### **Feature Flags (`/packages/runtime/flags/`)**

```typescript
// Primary: AWS AppConfig (free tier)
// Fallback: DynamoDB table 'stackpro-flags' 
// Final: Environment variables

export const isEnabled = async (
  key: string, 
  opts?: { tenantId?: string }
): Promise<boolean> => {
  // 60-second in-memory cache
  return process.env[key] === 'true'
}

export const getVariant = async (
  key: string,
  opts?: { tenantId?: string }
): Promise<string> => {
  // Support A/B testing variants
  return 'default'
}
```

**Flag Naming Convention**:
- `CAP_MESSAGING_ENABLED=false` - Capability on/off
- `CAP_MESSAGING_VERSION=v1` - API version routing
- `CAP_MESSAGING_DEGRADED=false` - Force degraded mode

#### **Service Discovery (`/packages/runtime/discovery/`)**

```typescript
export async function resolveCapabilityUrl(
  capability: 'messaging' | 'datalake' | 'ai' | 'billing',
  env: 'sandbox' | 'production' = 'sandbox'
): Promise<string> {
  // 1. Environment variable (dev/test)
  const envUrl = process.env[`CAP_${capability.toUpperCase()}_BASE_URL`]
  if (envUrl) return envUrl
  
  // 2. AWS SSM Parameter Store (production)
  const ssmKey = `/stackpro/${env}/capabilities/${capability}/base-url`
  try {
    const ssmValue = await getSSMParameter(ssmKey)
    if (ssmValue) return ssmValue
  } catch (error) {
    console.warn(`SSM lookup failed for ${ssmKey}:`, error)
  }
  
  // 3. Fallback to main API
  return '/api'
}
```

### **4. Degraded Fallbacks**

Every capability SDK implements graceful degradation:

```typescript
// Never throw exceptions - always return shape with degraded flag
export const createMessagingClient = (config) => ({
  async listThreads() {
    try {
      const response = await fetch(`${config.baseUrl}/v1/threads`)
      const data = await response.json()
      return { threads: data.threads, degraded: false }
    } catch (error) {
      console.warn('Messaging degraded:', error)
      return { threads: [], degraded: true }
    }
  },
  
  async sendMessage(body) {
    try {
      const response = await fetch(`${config.baseUrl}/v1/messages`, {
        method: 'POST',
        body: JSON.stringify(body)
      })
      return { ok: response.ok, degraded: false }
    } catch (error) {
      console.warn('Send message degraded:', error)
      return { ok: false, degraded: true }
    }
  }
})
```

**Frontend Degraded Handling**:
```tsx
const MessagingComponent = () => {
  const [threads, setThreads] = useState([])
  const [isDegraded, setIsDegraded] = useState(false)
  
  useEffect(() => {
    const loadThreads = async () => {
      const result = await messagingClient.listThreads()
      setThreads(result.threads)
      setIsDegraded(result.degraded)
    }
    loadThreads()
  }, [])
  
  return (
    <div>
      {isDegraded && (
        <div className="bg-yellow-100 p-2 rounded">
          ⚠️ Messaging temporarily unavailable - showing cached data
        </div>
      )}
      {threads.map(thread => <ThreadItem key={thread.id} thread={thread} />)}
    </div>
  )
}
```

---

## 🔐 **Authentication Between Capabilities**

### **Option A: API Gateway + IAM (Recommended)**

```typescript
// Lambda execution role includes:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "execute-api:Invoke",
      "Resource": "arn:aws:execute-api:*:*:*/*/v1/*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-west-2"
        }
      }
    }
  ]
}
```

### **Option B: Short-lived JWT (Fallback)**

```typescript
// Service-to-service JWT with capability claims
const createServiceJWT = (fromCapability: string, toCapability: string) => {
  return jwt.sign(
    {
      iss: 'stackpro-runtime',
      aud: toCapability,
      scope: `capability:${toCapability}:read capability:${toCapability}:write`,
      exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
    },
    process.env.SERVICE_JWT_SECRET
  )
}
```

---

## 📊 **Observability**

### **Structured Logging**

```typescript
// Standard log format for all capabilities
const logger = {
  info: (message: string, context: {
    capability: string
    route: string
    tenantId?: string
    latency_ms?: number
    degraded?: boolean
  }) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...context,
      trace_id: getTraceId()
    }))
  }
}

// Usage in capability handlers
logger.info('Thread list retrieved', {
  capability: 'messaging',
  route: '/v1/threads',
  tenantId: request.tenantId,
  latency_ms: 45,
  degraded: false
})
```

### **CloudWatch Metrics**

```typescript
// Standard metrics for all capabilities
const metrics = {
  success_count: new CloudWatchMetric('stackpro.capability.success'),
  error_count: new CloudWatchMetric('stackpro.capability.error'),
  p95_latency_ms: new CloudWatchMetric('stackpro.capability.latency.p95'),
  degraded_count: new CloudWatchMetric('stackpro.capability.degraded'),
  circuit_breaker_open: new CloudWatchMetric('stackpro.capability.breaker.open')
}

// Automatic emission in middleware
export const observabilityMiddleware = (capability: string) => (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const latency = Date.now() - start
    const success = res.statusCode < 400
    
    if (success) {
      metrics.success_count.increment({ capability, route: req.path })
    } else {
      metrics.error_count.increment({ capability, route: req.path })
    }
    
    metrics.p95_latency_ms.record(latency, { capability, route: req.path })
  })
  
  next()
}
```

### **CloudWatch Dashboards**

Each capability gets a free-tier dashboard:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["stackpro.capability", "success", "capability", "messaging"],
          ["stackpro.capability", "error", "capability", "messaging"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-west-2",
        "title": "Messaging Request Volume"
      }
    },
    {
      "type": "metric", 
      "properties": {
        "metrics": [
          ["stackpro.capability", "latency.p95", "capability", "messaging"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-west-2", 
        "title": "Messaging P95 Latency"
      }
    }
  ]
}
```

---

## 🚢 **Deployment Architecture**

### **Per-Capability Infrastructure**

```
Capability: messaging
├── API Gateway: stackpro-messaging-sandbox
├── Lambda: stackpro-messaging-handler-sandbox  
├── DynamoDB: stackpro-messaging-threads (On-Demand)
├── CloudWatch Dashboard: StackPro-Messaging-Sandbox
└── IAM Role: stackpro-messaging-execution-role
```

### **Environment Separation**

```
Environments:
├── sandbox/
│   ├── Feature flags: Default OFF
│   ├── Small Lambda memory (128MB)
│   └── DynamoDB On-Demand (free tier)
└── production/
    ├── Feature flags: Explicit enablement
    ├── Larger Lambda memory (512MB)
    └── DynamoDB Provisioned (if needed)
```

---

## 🧪 **Testing Strategy**

### **Contract Tests**

```typescript
// Validate SDK matches OpenAPI contract
describe('Messaging Client Contract', () => {
  it('should match OpenAPI response schema', async () => {
    const response = await messagingClient.listThreads()
    
    // Validate against generated schema
    expect(response).toMatchSchema(ThreadListResponseSchema)
    expect(response.degraded).toBeDefined()
    expect(typeof response.degraded).toBe('boolean')
  })
})
```

### **Degraded Mode Tests**

```typescript
describe('Degraded Fallbacks', () => {
  it('should return degraded response on network failure', async () => {
    // Mock network failure
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
    
    const response = await messagingClient.listThreads()
    
    expect(response.degraded).toBe(true)
    expect(response.threads).toEqual([])
  })
})
```

### **Feature Flag Tests**

```typescript
describe('Feature Flags', () => {
  it('should return false when capability disabled', async () => {
    process.env.CAP_MESSAGING_ENABLED = 'false'
    
    const enabled = await isEnabled('CAP_MESSAGING_ENABLED')
    expect(enabled).toBe(false)
  })
})
```

---

## 📋 **Phase Implementation Plan**

### **Phase 0: Scaffolding** ✅
- [x] Workspace structure (`/packages/`)
- [x] pnpm + Turborepo configuration
- [x] GitHub Actions CI pipeline
- [x] Architecture documentation

### **Phase 1: First Capability (Messaging)**
- [ ] OpenAPI contract for messaging
- [ ] Generated TypeScript SDK
- [ ] Lambda + API Gateway infrastructure
- [ ] Feature flag integration
- [ ] Degraded fallback implementation
- [ ] CloudWatch observability

### **Phase 2: Discovery & Health**
- [ ] Service discovery via SSM
- [ ] `/internal/capabilities` endpoint
- [ ] Health check integration
- [ ] Visual regression testing

### **Phase 3: Second Capability (Data Lake)**
- [ ] Data Lake contract + SDK
- [ ] DynamoDB-backed stubs
- [ ] Seller portal integration
- [ ] Multi-capability testing

---

## 🎯 **Success Metrics**

### **Development Experience**
- **SDK Generation**: Contracts → SDKs in <30 seconds
- **Local Development**: All capabilities work offline
- **Type Safety**: 100% TypeScript contract compliance

### **Production Reliability**
- **Uptime**: 99.9% per capability
- **Latency**: P95 < 200ms for all endpoints
- **Degraded Mode**: <1% of requests in degraded state

### **Cost Optimization**
- **Free Tier**: All capabilities within AWS free tier
- **Monthly Cost**: <$5 total for sandbox environment
- **Resource Efficiency**: Lambda cold starts <500ms

---

## 🔍 **Troubleshooting**

### **Common Issues**

**Contract Validation Fails**:
```bash
# Validate specific contract
cd packages/contracts/messaging
npx swagger-codegen validate -i v1.yaml
```

**SDK Generation Issues**:  
```bash
# Regenerate client from contract
pnpm turbo run generate-clients --filter=messaging-client
```

**Feature Flag Not Working**:
```bash
# Check flag resolution order
node -e "console.log(process.env.CAP_MESSAGING_ENABLED)"
```

**Service Discovery Issues**:
```bash
# Test capability URL resolution
node -e "
const { resolveCapabilityUrl } = require('./packages/runtime/discovery');
resolveCapabilityUrl('messaging').then(console.log);
"
```

### **Debugging Commands**

```bash
# Check all capability flags
env | grep CAP_

# Test capability health
curl /internal/capabilities

# View capability logs
aws logs tail /aws/lambda/stackpro-messaging-handler-sandbox --follow

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace stackpro.capability \
  --metric-name success \
  --dimensions Name=capability,Value=messaging
```

---

**🏗️ This architecture provides a scalable, observable, and cost-effective foundation for StackPro's modular backend evolution while maintaining backward compatibility and staying within AWS free tier constraints.**

---

*Last Updated: August 9, 2025*  
*Next Review: After each phase completion*
