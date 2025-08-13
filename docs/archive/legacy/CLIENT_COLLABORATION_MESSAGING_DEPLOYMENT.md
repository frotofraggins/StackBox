# StackPro Client Collaboration Messaging - Deployment Guide

## 🚀 Complete Deployment Guide for Client Collaboration Messaging System

This guide provides step-by-step instructions for deploying the complete client collaboration messaging system for StackPro.

---

## 📋 Prerequisites

### AWS Requirements
- AWS CLI configured with appropriate permissions
- AWS Account ID set in environment variables
- IAM permissions for DynamoDB, SNS, SQS, Lambda, API Gateway, CloudWatch

### Environment Setup
```bash
# Required environment variables
export AWS_REGION=us-west-2
export AWS_ACCOUNT_ID=your-account-id
export NODE_ENV=production

# Optional WebSocket configuration
export NEXT_PUBLIC_WS_URL=wss://your-websocket-endpoint
export API_BASE_URL=https://your-api-domain.com/api
```

### Dependencies
```bash
# Install required packages
npm install aws-sdk ws jszip node-fetch

# Frontend dependencies (already in package.json)
# - WebSocket support
# - React hooks for real-time features
# - Notification handling
```

---

## 🏗️ Infrastructure Deployment

### Step 1: Deploy AWS Infrastructure
```bash
# Set up DynamoDB tables, IAM roles, SNS/SQS, WebSocket API
node scripts/setup-messaging-infrastructure.js
```

This script will create:
- **5 DynamoDB Tables**: Connections, Messages, Channels, Presence, Notifications
- **IAM Roles & Policies**: Lambda execution roles with least privilege access
- **WebSocket API Gateway**: Real-time communication endpoint
- **SNS Topics & SQS Queues**: Notification delivery infrastructure
- **CloudWatch Log Groups**: Monitoring and debugging

### Step 2: Deploy Lambda Functions
```bash
# Package and deploy WebSocket handlers
cd src/services/messaging
zip -r websocket-handler.zip websocket-handler.js messaging-service.js ../logger.js
aws lambda update-function-code --function-name StackPro-WebSocket-Connect --zip-file fileb://websocket-handler.zip
aws lambda update-function-code --function-name StackPro-WebSocket-Disconnect --zip-file fileb://websocket-handler.zip
aws lambda update-function-code --function-name StackPro-WebSocket-Message --zip-file fileb://websocket-handler.zip
```

### Step 3: Configure API Gateway Integration
```bash
# Update API Gateway integrations to point to Lambda functions
aws apigatewayv2 update-route --api-id $WEBSOCKET_API_ID --route-id $CONNECT_ROUTE_ID --target integrations/$CONNECT_INTEGRATION_ID
aws apigatewayv2 update-route --api-id $WEBSOCKET_API_ID --route-id $DISCONNECT_ROUTE_ID --target integrations/$DISCONNECT_INTEGRATION_ID
aws apigatewayv2 update-route --api-id $WEBSOCKET_API_ID --route-id $MESSAGE_ROUTE_ID --target integrations/$MESSAGE_INTEGRATION_ID
```

---

## 🖥️ Backend Deployment

### Step 1: Update Server Configuration
Add messaging routes to your main server:

```javascript
// In src/api/server.js
const messagingRoutes = require('./routes/messaging');
app.use('/api/messaging', messagingRoutes);
```

### Step 2: Environment Configuration
Update your `.env` file:

```env
# Messaging Configuration
WEBSOCKET_API_ENDPOINT=wss://your-websocket-id.execute-api.us-west-2.amazonaws.com/prod
AWS_REGION=us-west-2
AWS_ACCOUNT_ID=123456789012

# Database Tables (these are created by setup script)
CONNECTIONS_TABLE=StackPro-Connections
MESSAGES_TABLE=StackPro-Messages
CHANNELS_TABLE=StackPro-Channels
PRESENCE_TABLE=StackPro-Presence
NOTIFICATIONS_TABLE=StackPro-Notifications

# Notification Settings
SNS_TOPIC_PREFIX=stackpro-notifications
SQS_QUEUE_PREFIX=stackpro-messaging
```

### Step 3: Deploy Backend Services
```bash
# Deploy to your hosting platform (EC2, ECS, Lambda, etc.)
# Ensure all messaging service files are included:
# - src/services/messaging/messaging-service.js
# - src/services/messaging/notification-service.js
# - src/services/messaging/websocket-handler.js
# - src/api/routes/messaging.js

# For PM2 deployment:
pm2 start src/api/server.js --name stackpro-api
pm2 save
```

---

## 🌐 Frontend Deployment

### Step 1: Configure Frontend Environment
Update your `frontend/.env.local`:

```env
NEXT_PUBLIC_WS_URL=wss://your-websocket-id.execute-api.us-west-2.amazonaws.com/prod
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### Step 2: Build and Deploy Frontend
```bash
cd frontend
npm run build

# Deploy to Vercel (recommended)
vercel --prod

# Or deploy to your preferred platform
# Ensure these files are included:
# - src/components/messaging/* (all messaging components)
# - src/hooks/useWebSocket.ts
# - src/hooks/useNotification.ts
```

### Step 3: Integration with Dashboard
Add messaging to your dashboard pages:

```tsx
// In frontend/src/pages/dashboard/messaging.tsx
import ChatWindow from '../../components/messaging/ChatWindow';

export default function MessagingPage() {
  const clientId = 'your-client-id';
  const userId = 'current-user-id';
  
  return (
    <div className="h-screen">
      <ChatWindow
        channelId="general"
        userId={userId}
        clientId={clientId}
        className="h-full"
      />
    </div>
  );
}
```

---

## 🧪 Testing Deployment

### Step 1: Run Infrastructure Tests
```bash
node scripts/test-messaging-system.js
```

### Step 2: Manual Testing Checklist

#### Backend API Testing
- [ ] Health check: `GET /api/messaging/health`
- [ ] Create channel: `POST /api/messaging/channels`
- [ ] Send message: `POST /api/messaging/channels/{id}/messages`
- [ ] Get messages: `GET /api/messaging/channels/{id}/messages`
- [ ] Update presence: `PUT /api/messaging/presence`
- [ ] Create notifications: `POST /api/messaging/notifications`

#### WebSocket Testing
- [ ] Connection establishment
- [ ] Message sending/receiving
- [ ] Typing indicators
- [ ] Presence updates
- [ ] Channel joining/leaving

#### Frontend Testing
- [ ] Chat window loads correctly
- [ ] Messages display properly
- [ ] Real-time updates work
- [ ] File uploads function
- [ ] Notifications appear
- [ ] User presence indicators

---

## 📊 Monitoring & Maintenance

### CloudWatch Dashboards
Create dashboards to monitor:
- WebSocket connection count
- Message throughput
- DynamoDB read/write capacity
- Lambda function performance
- Error rates and latency

### Log Monitoring
Key log groups to monitor:
- `/stackpro/messaging/websocket`
- `/stackpro/messaging/api`
- `/aws/lambda/StackPro-WebSocket-*`

### Performance Metrics
- Message delivery latency
- WebSocket connection stability
- Database query performance
- Notification delivery rates

---

## 🔧 Troubleshooting

### Common Issues

#### WebSocket Connection Failures
```bash
# Check API Gateway configuration
aws apigatewayv2 get-api --api-id $WEBSOCKET_API_ID

# Check Lambda function logs
aws logs tail /aws/lambda/StackPro-WebSocket-Connect --follow
```

#### Message Delivery Issues
```bash
# Check DynamoDB table status
aws dynamodb describe-table --table-name StackPro-Messages

# Check SQS queue messages
aws sqs receive-message --queue-url $QUEUE_URL
```

#### High Latency
```bash
# Check DynamoDB performance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

### Debug Mode
Enable debug logging:

```bash
# Backend debug mode
DEBUG=stackpro:messaging npm start

# Frontend debug mode
NEXT_PUBLIC_DEBUG_MESSAGING=true npm run dev
```

---

## 🚀 Production Optimization

### Performance Tuning
1. **DynamoDB**: Configure auto-scaling for read/write capacity
2. **Lambda**: Adjust memory and timeout settings based on usage
3. **WebSocket**: Implement connection pooling for high concurrency
4. **Caching**: Add Redis for frequently accessed data

### Security Hardening
1. **API Rate Limiting**: Implement rate limiting on messaging endpoints
2. **Input Validation**: Ensure all message content is properly sanitized
3. **Access Control**: Verify client isolation is properly enforced
4. **Encryption**: Enable encryption at rest for DynamoDB tables

### Scaling Considerations
1. **Multi-Region**: Deploy in multiple AWS regions for global users
2. **Load Balancing**: Use ALB for API endpoints
3. **Auto Scaling**: Configure Lambda concurrency limits
4. **Monitoring**: Set up comprehensive alerting for all components

---

## 📚 API Documentation

### WebSocket API
```javascript
// Connection
const ws = new WebSocket('wss://your-endpoint?userId=123&clientId=abc');

// Send message
ws.send(JSON.stringify({
  action: 'sendMessage',
  channelId: 'channel-123',
  content: 'Hello world',
  messageType: 'text'
}));

// Typing indicator
ws.send(JSON.stringify({
  action: 'typing',
  channelId: 'channel-123',
  isTyping: true
}));
```

### REST API
```bash
# Create channel
curl -X POST https://api.yourdomain.com/api/messaging/channels \
  -H "Content-Type: application/json" \
  -H "x-client-id: client-123" \
  -H "x-user-id: user-456" \
  -d '{"name": "General", "type": "public"}'

# Send message
curl -X POST https://api.yourdomain.com/api/messaging/channels/ch-123/messages \
  -H "Content-Type: application/json" \
  -H "x-client-id: client-123" \
  -H "x-user-id: user-456" \
  -d '{"content": "Hello", "type": "text"}'
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] AWS credentials configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Configuration files updated

### Infrastructure
- [ ] DynamoDB tables created and active
- [ ] IAM roles and policies configured
- [ ] SNS/SQS resources provisioned
- [ ] WebSocket API Gateway deployed
- [ ] Lambda functions deployed
- [ ] CloudWatch logging enabled

### Application
- [ ] Backend services deployed
- [ ] Frontend components deployed
- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] WebSocket connections working

### Testing
- [ ] Infrastructure tests passing
- [ ] API endpoints tested
- [ ] WebSocket functionality verified
- [ ] Frontend integration working
- [ ] Performance benchmarks met

### Monitoring
- [ ] CloudWatch dashboards created
- [ ] Log monitoring configured
- [ ] Alerts set up
- [ ] Performance metrics tracked

---

## 🎉 Success Criteria

Your messaging system deployment is successful when:

1. **All tests pass**: Infrastructure, API, WebSocket, and integration tests
2. **Real-time messaging works**: Messages appear instantly across connected clients
3. **Performance meets targets**: < 100ms message latency, >99.9% uptime
4. **Security is enforced**: Client isolation, proper authentication
5. **Monitoring is active**: Dashboards show healthy metrics
6. **Users can collaborate**: File sharing, reactions, presence indicators work

---

## 🆘 Support & Resources

### Documentation
- [AWS WebSocket API Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Lambda Performance Optimization](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

### Monitoring Tools
- AWS CloudWatch
- AWS X-Ray for tracing
- Third-party APM tools (DataDog, New Relic)

### Community
- AWS Forums for infrastructure issues
- GitHub Issues for application bugs
- Stack Overflow for development questions

---

**🎯 Your StackPro client collaboration messaging system is now ready for production!**

This system provides enterprise-grade real-time messaging with proper security isolation, scalable architecture, and comprehensive monitoring. Your clients can now collaborate effectively within their isolated environments while you maintain full control over the infrastructure.
