# AWS SDK v3 Migration Status

## Overview
Migrating from AWS SDK v2 to v3 to resolve deprecation warnings and improve performance.

## Progress: 2/10 Files Complete (20%)

### ✅ **Completed Files (2)**
1. **src/services/logger.js**
   - ✅ CloudWatchLogsClient
   - ✅ CreateLogStreamCommand, PutLogEventsCommand, DescribeLogStreamsCommand
   - ✅ Updated error handling (error.name vs error.code)

2. **src/services/ai/dataset-ingestion-service.js**
   - ✅ S3Client with GetObjectCommand, ListObjectsV2Command, PutObjectCommand
   - ✅ BedrockRuntimeClient with InvokeModelCommand
   - ✅ Updated response body handling with TextDecoder

### 🚧 **Remaining Files (8)**

#### **Group 1: Email Utilities (2 files)**
1. **src/utils/ses-email-intake.js**
   - Uses: AWS SDK v2 alongside some v3 (mixed usage)
   - Services: SES, S3
   - Priority: High (email functionality)

2. **src/utils/email-parser.js**
   - Uses: AWS SDK v2 alongside some v3 (mixed usage)
   - Services: S3
   - Priority: High (email functionality)

#### **Group 2: Messaging Services (3 files)**
3. **src/services/messaging/notification-service.js**
   - Uses: AWS SDK v2
   - Services: SNS, SES
   - Priority: Medium

4. **src/services/messaging/websocket-handler.js**
   - Uses: AWS SDK v2
   - Services: DynamoDB, API Gateway
   - Priority: Medium

5. **src/services/messaging/messaging-service.js**
   - Uses: AWS SDK v2
   - Services: DynamoDB, SQS
   - Priority: Medium

#### **Group 3: AI Services (3 files)**
6. **src/services/ai/document-processor.js**
   - Uses: AWS SDK v2
   - Services: S3, Textract, Bedrock
   - Priority: Low (AI features)

7. **src/services/ai/embedding-service.js**
   - Uses: AWS SDK v2
   - Services: Bedrock, DynamoDB
   - Priority: Low (AI features)

8. **src/services/ai/claude-assistant.js**
   - Uses: AWS SDK v2
   - Services: Bedrock Runtime
   - Priority: Low (AI features)

## Migration Strategy

### **Phase 1: Critical Path (High Priority)**
- Focus on email utilities first (Group 1)
- These are likely blocking server startup

### **Phase 2: Core Features (Medium Priority)**  
- Migrate messaging services (Group 2)
- Essential for platform functionality

### **Phase 3: Enhanced Features (Low Priority)**
- Migrate AI services (Group 3)
- Can be done incrementally

## Technical Notes

### **Common Patterns for Migration:**

**Old (v2):**
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const result = await s3.getObject(params).promise();
```

**New (v3):**
```javascript
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });
const command = new GetObjectCommand(params);
const result = await s3.send(command);
```

### **Key Changes:**
1. **Imports:** Service-specific imports instead of monolithic AWS object
2. **Client Creation:** New constructor pattern with config object  
3. **Commands:** Each operation is a separate command class
4. **Execution:** Use `client.send(command)` instead of `service.operation().promise()`
5. **Error Handling:** `error.name` instead of `error.code` in many cases
6. **Response Handling:** Some response formats changed (e.g., body streams)

## Package Dependencies

### ✅ **Already Installed:**
- @aws-sdk/client-s3
- @aws-sdk/client-cloudwatch-logs  
- @aws-sdk/client-bedrock-runtime
- @aws-sdk/client-bedrock
- @aws-sdk/client-ses
- @aws-sdk/client-sesv2
- @aws-sdk/client-dynamodb
- @aws-sdk/client-sns (might need to add)
- @aws-sdk/client-sqs (might need to add)
- @aws-sdk/client-textract (might need to add)

### 🔄 **Removed:**
- ~~aws-sdk~~ (v2 - removed)

## Current Status
- **Server Status:** ❌ Failing to start due to remaining v2 dependencies
- **Next Step:** Migrate Group 1 (Email Utilities) to unblock server startup
- **Estimated Time:** 2-3 hours for complete migration

## Testing Strategy
After each group migration:
1. Run `pnpm run dev` to test server startup
2. Test affected functionality (email, messaging, AI)  
3. Commit working state
4. Move to next group

## Recovery Plan
If issues arise:
- Each migration group is committed separately
- Can rollback to last working state
- Original v2 code preserved in git history
