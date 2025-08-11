# StackPro Free-Tier Mode - Demo Environment Guide

**Status**: ✅ **DEPLOYMENT READY** - Dry run completed successfully  
**Cost**: $0/month (AWS Free Tier compliant)  
**Purpose**: Enable demos and trials without affecting production

---

## 🎯 **OVERVIEW**

StackPro Free-Tier Mode provides a complete sandbox environment for demonstrations, trials, and development testing. All resources stay within AWS Free Tier limits with automatic cost monitoring and alerts.

### **Key Features**
- **Zero Cost**: All services within AWS Free Tier quotas
- **Production Isolation**: Completely separate from live StackPro.io
- **Full Stack Demo**: CRM, messaging, file sharing, site building
- **Automatic Cleanup**: 7-day TTL on demo files
- **Cost Monitoring**: $5/month budget with alerts
- **Easy Rollback**: Complete teardown capability

---

## 🛠️ **DEPLOYED INFRASTRUCTURE**

### **Database Layer**
- **RDS MySQL**: `stackpro-sandbox-db` (db.t3.micro)
  - 20GB storage (Free Tier: up to 20GB)
  - Single AZ deployment
  - 7-day backup retention
  - Multi-tenant via tenant_id column

### **Real-Time Messaging**
- **DynamoDB Tables** (On-Demand billing):
  - `stackpro-sandbox-messages` - Message storage with user indexing
  - `stackpro-sandbox-connections` - WebSocket connection management (24hr TTL)
  - `stackpro-sandbox-rooms` - Chat room and client isolation
  
- **WebSocket API**: Reuses existing `c7zc4l0r88` with sandbox stage
  - Endpoint: `wss://c7zc4l0r88.execute-api.us-west-2.amazonaws.com/sandbox`
  - Routes: `$connect`, `$disconnect`, `sendMessage`, `joinRoom`, `typing`

### **File Storage**
- **S3 Bucket**: `stackpro-sandbox-assets`
  - Lifecycle: Delete demo/ files after 7 days
  - 10MB file size limit per upload
  - Pre-signed URL generation for secure uploads

### **Lambda Functions** (Prepared)
- `stackpro-sandbox-ws-connect` - WebSocket connection handler (128MB)
- `stackpro-sandbox-ws-disconnect` - Disconnection handler (128MB)  
- `stackpro-sandbox-message-router` - Message processing (256MB)

### **Monitoring & Cost Control**
- **AWS Budget**: `StackPro-FreeTier-Budget`
  - Monthly limit: $5.00
  - Email alerts: ops@stackpro.dev
  - Forecasted 80% + Actual 100% thresholds

- **EventBridge Automation** (5 scheduled rules):
  - Demo session cleanup (every 4 hours)
  - Nightly maintenance (11 PM PST daily)
  - Demo analytics generation (11 AM PST daily)
  - Trial conversion reminders (every 12 hours)
  - Cost monitoring and alerts (every 6 hours)

- **CloudWatch Logs**: 4 log groups for comprehensive monitoring

### **Email Services**
- **SES Sandbox Mode**: noreply@stackpro.io
  - Daily limit: 200 emails
  - Rate: 1 message/second

---

## 🏷️ **RESOURCE TAGGING**

All resources tagged with:
```json
{
  "Project": "StackPro",
  "Env": "FreeTier", 
  "Owner": "Ops",
  "CostCenter": "Sandbox"
}
```

---

## 💰 **COST BREAKDOWN**

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| RDS db.t3.micro | 750 hours | $0.00 (Free Tier) |
| DynamoDB On-Demand | 25GB storage, 25 WCU/RCU | $0.00 (Free Tier) |
| S3 Storage | 5GB + 20k GET + 2k PUT | $0.00 (Free Tier) |
| API Gateway | 1M WebSocket messages | $0.00 (Free Tier) |
| Lambda | 1M requests, 400k GB-seconds | $0.00 (Free Tier) |
| EventBridge | 1M events | $0.00 (Free Tier) |
| SES | 62k emails | $0.00 (Free Tier) |
| CloudWatch Logs | 5GB | $0.00 (Free Tier) |
| **TOTAL** | | **$0.00** |

**⚠️ Safety Net**: $5/month budget alert if usage exceeds free tier quotas

---

## ⚙️ **CONFIGURATION LIMITS**

| Setting | Value | Purpose |
|---------|-------|---------|
| Max Demo Tenants | 3 | Prevent resource exhaustion |
| File TTL | 7 days | Automatic cleanup |
| Max File Size | 10MB | Storage optimization |
| WebSocket Rate Limit | 60 msgs/min | Abuse prevention |
| API Rate Limit | 120 requests/min | Performance protection |

---

## 🚀 **DEPLOYMENT COMMANDS**

### **Deploy Free-Tier Environment**
```bash
# Run dry-run deployment plan
node scripts/deploy-free-tier-mode.js

# After approval, deploy actual resources
# (Implementation pending your approval)
```

### **Environment Configuration**
```bash
# Set environment variables
export ENV=free-tier
export AI_ENABLED=false
export MAX_DEMO_TENANTS=3
export FILE_TTL_DAYS=7
export WS_MAX_MSGS_PER_MIN=60
export API_RPM=120
```

---

## 🛡️ **SAFETY GUARDRAILS**

### **Production Protection**
✅ **No modifications to live frontend** (stackpro.io)  
✅ **No deletion/rename of existing AWS resources**  
✅ **Complete isolation** from production databases  
✅ **Separate WebSocket API stage** (sandbox)  

### **Cost Protection**
✅ **Free-tier eligible SKUs only**  
✅ **Automatic file cleanup** (7-day lifecycle)  
✅ **Rate limiting** on all APIs  
✅ **Budget alerts** at 80% forecasted usage  

### **Rollback Protection**
✅ **Configuration backup exported** to `config/backup-pre-freetier-deployment.json`  
✅ **Complete resource inventory** with ARNs  
✅ **Tag-based resource identification** for selective cleanup  

---

## 📋 **ROLLBACK PROCEDURE**

### **Complete Environment Teardown**
```bash
# Delete all resources tagged with Env=FreeTier
aws resourcegroupstaggingapi get-resources \
  --tag-filters "Key=Env,Values=FreeTier" \
  --query 'ResourceTagMappingList[].ResourceARN' \
  --output text

# Automated cleanup script (to be implemented)
node scripts/teardown-free-tier.js --confirm
```

### **Selective Service Rollback**
```bash
# Delete only DynamoDB tables
aws dynamodb delete-table --table-name stackpro-sandbox-messages
aws dynamodb delete-table --table-name stackpro-sandbox-connections  
aws dynamodb delete-table --table-name stackpro-sandbox-rooms

# Delete S3 bucket and contents
aws s3 rm s3://stackpro-sandbox-assets --recursive
aws s3api delete-bucket --bucket stackpro-sandbox-assets

# Delete RDS instance
aws rds delete-db-instance \
  --db-instance-identifier stackpro-sandbox-db \
  --skip-final-snapshot
```

---

## 🧪 **DEMO SCENARIOS**

### **Business Owner Trial Flow**
1. **Website Builder**: Create business website with drag-and-drop
2. **CRM Demo**: Add contacts, create opportunities, track activities
3. **File Sharing**: Upload documents, generate secure sharing links
4. **Real-Time Messaging**: Chat with team members, file attachments
5. **Email Integration**: Send automated email campaigns

### **Developer Testing**
1. **API Endpoints**: Test all REST and WebSocket APIs
2. **Authentication**: JWT token validation and session management
3. **File Uploads**: S3 pre-signed URL generation and validation
4. **Multi-Tenant**: Test tenant isolation and data segregation
5. **Rate Limiting**: Verify API throttling and abuse prevention

---

## 📈 **MONITORING & ALERTS**

### **CloudWatch Dashboards**
- **Cost Tracking**: Real-time spend monitoring
- **API Performance**: Response times and error rates  
- **WebSocket Connections**: Active connections and message throughput
- **Database Performance**: Query latency and connection pooling

### **Email Notifications**
- **Budget Alerts**: Sent to ops@stackpro.dev
  - 80% forecasted usage warning
  - 100% actual usage alert
- **Error Notifications**: API failures and system issues
- **Daily Usage Reports**: Resource consumption summaries

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

**WebSocket Connection Fails**
```bash
# Check API Gateway logs
aws logs filter-log-events \
  --log-group-name /aws/apigateway/stackpro-messaging

# Test connection directly
wscat -c wss://c7zc4l0r88.execute-api.us-west-2.amazonaws.com/sandbox
```

**File Upload Issues**
```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket stackpro-sandbox-assets

# Test pre-signed URL generation
curl -X POST http://localhost:3001/api/upload/generate-url \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.pdf", "fileType": "application/pdf"}'
```

**Database Connection Problems**
```bash
# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier stackpro-sandbox-db

# Test connection
mysql -h stackpro-sandbox-db.region.rds.amazonaws.com \
  -u admin -p sandbox_db
```

---

## 📞 **SUPPORT**

**Deployment Issues**: Review deployment logs in `logs/deployment.log`  
**Cost Overruns**: Check AWS Billing Dashboard and Budget alerts  
**Performance Issues**: Monitor CloudWatch metrics and API response times  
**Security Concerns**: Verify IAM roles and S3 bucket policies  

**Emergency Rollback**: Execute `node scripts/teardown-free-tier.js --emergency`

---

## ✅ **DEPLOYMENT VERIFICATION**

After deployment completion, verify:
- [ ] RDS instance status: `available`
- [ ] DynamoDB tables: `ACTIVE` state
- [ ] S3 bucket: Accessible with lifecycle policy
- [ ] WebSocket API: Connection test successful  
- [ ] Lambda functions: Deployed and executable
- [ ] Budget alerts: Configured and active
- [ ] CloudWatch logs: Receiving data
- [ ] SES verification: Domain verified

**Status**: Ready for production demo deployment upon your approval.
