# 🚀 StackBox Testing & Deployment Guide

## 📋 **QUICK START CHECKLIST**

### ✅ **Phase 1: Local Development Setup (15 minutes)**
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Test backend API server
- [ ] Test frontend application
- [ ] Verify AWS connections

### ✅ **Phase 2: MVP Testing (30 minutes)**  
- [ ] Test signup flow
- [ ] Test deployment pipeline
- [ ] Test payment integration
- [ ] Verify enterprise services

### ✅ **Phase 3: Production Deployment (60 minutes)**
- [ ] Deploy frontend to production
- [ ] Deploy API server
- [ ] Configure custom domain
- [ ] Set up monitoring

---

## 🛠️ **PHASE 1: LOCAL DEVELOPMENT SETUP**

### **Step 1: Install Dependencies**
```bash
# Install main project dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### **Step 2: Environment Configuration**
Create `.env` file in the root directory:

```bash
# .env file
# AWS Configuration
AWS_PROFILE=default
AWS_REGION=us-west-2

# Domain Configuration
DOMAIN_PRIMARY=allbusinesstools.com
FRONTEND_URL=http://localhost:3000
STACKBOX_API_URL=http://localhost:3001

# Stripe Configuration (Get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Database Configuration (for future use)
DB_HOST=localhost
DB_NAME=stackbox_main
DB_USER=stackbox_user
DB_PASSWORD=your_secure_password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### **Step 3: Frontend Environment**
Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STACKBOX_API_URL=http://localhost:3001
```

### **Step 4: Test Backend API Server**
```bash
# Start the API server
npm run dev

# Expected output:
# 🚀 StackBox API server running on port 3001
# 📊 Environment: development
# 🔗 Health check: http://localhost:3001/health
```

### **Step 5: Test API Health**
Open new terminal:
```bash
curl http://localhost:3001/health
# Expected: {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### **Step 6: Test Frontend Application**
```bash
# In new terminal
cd frontend
npm run dev

# Expected output:
# ▲ Next.js 14.0.4
# - Local:        http://localhost:3000
# - Ready in 2.3s
```

---

## 🧪 **PHASE 2: MVP TESTING**

### **Test 1: Frontend Landing Page**
1. **Open:** http://localhost:3000
2. **Verify:**
   - ✅ Landing page loads
   - ✅ "Start Free Trial" button works
   - ✅ Signup modal opens
   - ✅ 4-step flow navigation
   - ✅ Mobile responsive design

### **Test 2: Signup Flow**
1. **Click:** "Start Free Trial"
2. **Step 1:** Enter business information
   - First Name: `John`
   - Last Name: `Smith`  
   - Email: `test@example.com`
   - Business Name: `Smith Real Estate`
   - Business Type: `Real Estate Agent`
3. **Step 2:** Choose domain
   - Select: `Use Free Subdomain`
   - Preview: `smithrealestate.allbusinesstools.com`
4. **Step 3:** Select features
   - Verify: Essential features pre-selected
   - Toggle: Optional features
5. **Step 4:** Launch options
   - Test: "Start Free Trial" button
   - Test: "Upgrade to Professional" button

### **Test 3: API Deployment Endpoint**
```bash
curl -X POST http://localhost:3001/api/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "testclient",
    "email": "test@example.com",
    "businessName": "Test Business",
    "businessType": "consultant",
    "features": {
      "espocrm": true,
      "nextcloud": true,
      "staticSite": true,
      "aiAssistant": false
    }
  }'

# Expected response:
# {
#   "success": true,
#   "message": "Deployment started successfully",
#   "clientId": "testclient",
#   "estimatedCompletion": "5-15 minutes"
# }
```

### **Test 4: AWS Service Connections**
```bash
# Test AWS credentials
node -e "
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const client = new STSClient({});
client.send(new GetCallerIdentityCommand({}))
  .then(data => console.log('✅ AWS Connected:', data.Account))
  .catch(err => console.log('❌ AWS Error:', err.message));
"
```

---

## 🚀 **PHASE 3: PRODUCTION DEPLOYMENT**

### **Option A: Vercel Deployment (Recommended)**

#### **Frontend Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Follow prompts:
# - Project name: stackbox-frontend
# - Framework: Next.js
# - Deploy: Yes
```

#### **API Server Deployment:**
```bash
# Deploy API to Vercel (serverless functions)
cd ..
vercel

# Configure vercel.json for API routes
```

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "src/api/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/src/api/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "AWS_REGION": "us-west-2"
  }
}
```

### **Option B: AWS Deployment**

#### **Frontend (CloudFront + S3):**
```bash
# Build frontend
cd frontend
npm run build
npm run export

# Deploy to S3
aws s3 sync ./out s3://stackbox-frontend-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### **API Server (AWS Fargate):**
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY config/ ./config/
EXPOSE 3001
CMD ["node", "src/api/server.js"]
```

Deploy:
```bash
# Build and push to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin YOUR_ECR_URI
docker build -t stackbox-api .
docker tag stackbox-api:latest YOUR_ECR_URI/stackbox-api:latest
docker push YOUR_ECR_URI/stackbox-api:latest

# Deploy to Fargate (use AWS Console or CDK)
```

### **Domain Configuration**

#### **Custom Domain Setup:**
1. **Purchase Domain:** `allbusinesstools.com`
2. **Configure DNS:**
   ```bash
   # Point to frontend
   CNAME @ your-vercel-deployment.vercel.app
   
   # Point API subdomain
   CNAME api your-api-deployment.vercel.app
   ```
3. **SSL Certificate:** Automatic with Vercel/CloudFront

---

## 🔧 **PRODUCTION CHECKLIST**

### **Security:**
- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Stripe webhooks secured
- [ ] AWS IAM roles minimal permissions

### **Performance:**
- [ ] Frontend assets optimized
- [ ] API response caching
- [ ] CDN configured
- [ ] Database connections pooled
- [ ] Monitoring enabled

### **Functionality:**
- [ ] Signup flow end-to-end
- [ ] Payment processing
- [ ] AWS deployment pipeline
- [ ] Email notifications
- [ ] Error handling

### **Monitoring:**
- [ ] Health check endpoints
- [ ] Error logging (Winston)
- [ ] Performance monitoring
- [ ] AWS CloudWatch alarms
- [ ] Stripe dashboard monitoring

---

## 🎯 **QUICK TEST COMMANDS**

```bash
# Test everything locally
npm run test-local

# Test API health
curl http://localhost:3001/health

# Test deployment endpoint  
npm run test-deployment

# Test payment flow
npm run test-payment

# Check AWS connectivity
npm run test-aws

# Build for production
npm run build

# Start production server
npm run start
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

#### **"Module not found" errors:**
```bash
npm install
cd frontend && npm install
```

#### **AWS credential errors:**
```bash
aws configure
# Enter your AWS credentials
```

#### **Stripe webhook errors:**
```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:3001/api/stripe-webhook
```

#### **Port already in use:**
```bash
# Kill processes on ports 3000/3001
npx kill-port 3000 3001
```

---

## 🎉 **SUCCESS METRICS**

After deployment, verify:

✅ **Frontend:** Landing page loads in <2 seconds globally  
✅ **Signup:** Complete flow from landing to deployment works  
✅ **Payment:** Stripe integration processes payments  
✅ **AWS:** Enterprise services provision correctly  
✅ **Monitoring:** Health checks and logging operational  

**🚀 Your MVP is ready for customers when all tests pass!**
