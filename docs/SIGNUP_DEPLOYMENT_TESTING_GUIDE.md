# 🧪 StackPro Signup → Deployment Testing Guide

## 🎯 **Overview**
This guide walks you through testing the complete customer journey from signup to working business infrastructure deployment.

---

## ⚡ **Quick Test Setup (5 minutes)**

### **1. Start Local Development Environment**
```bash
# Terminal 1: Start Backend API
npm run dev

# Terminal 2: Start Frontend  
cd frontend && npm run dev
```

### **2. Verify Services Running**
- **Frontend**: http://localhost:3000 
- **Backend API**: http://localhost:3002 (check server.js for actual port)
- **Health Check**: http://localhost:3002/health

---

## 🚀 **Complete Signup Flow Test**

### **Test 1: Frontend Signup Experience**

#### **Step 1: Landing Page → Signup Modal**
1. **Open**: http://localhost:3000
2. **Click**: "Start Free Trial" or "Get Started" button
3. **Verify**: Signup modal opens with 4-step wizard

#### **Step 2: Business Information (Step 1)**
Fill out the form:
```
First Name: John
Last Name: Smith  
Email: test+$(date +%s)@example.com  # Unique email
Business Name: Smith Real Estate
Business Type: Real Estate Agent
Phone: (555) 123-4567
```
**Click**: "Continue" → **Verify**: Advances to Step 2

#### **Step 3: Domain Selection (Step 2)** 
- **Option A**: Test free subdomain
  - Enter: `smithrealestate`
  - **Verify**: Preview shows `smithrealestate.stackpro.io`
- **Option B**: Test custom domain
  - Enter: `smithrealestate.com`
  - **Verify**: Domain availability check works

**Click**: "Continue" → **Verify**: Advances to Step 3

#### **Step 4: Feature Selection (Step 3)**
- **Verify**: Essential features pre-selected
  - ✅ Business Website 
  - ✅ CRM System
  - ✅ File Sharing Portal
- **Test**: Toggle optional features
  - □ AI Assistant
  - □ Booking System  
  - □ Email Marketing

**Click**: "Continue" → **Verify**: Advances to Step 4

#### **Step 5: Plan Selection (Step 4)**
- **Test Free Trial**: Click "Start Free Trial (14 days)"
- **Test Professional**: Click "Start Professional ($49/month)"
- **Verify**: Loading state shows "Setting up your business..."

---

### **Test 2: Backend API Processing**

#### **Monitor API Logs During Signup**
In backend terminal, watch for:
```bash
# Expected log sequence:
POST /api/signup - Customer signup initiated
POST /api/deploy - Deployment pipeline started  
GET /api/deploy-status/:clientId - Client polling status
POST /stripe/webhook - Payment processed (if paid plan)
```

#### **Test API Endpoints Directly**
```bash
# Test signup endpoint
curl -X POST http://localhost:3002/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith", 
    "email": "test@example.com",
    "businessName": "Smith Real Estate",
    "businessType": "real-estate",
    "domain": "smithrealestate",
    "features": {
      "website": true,
      "crm": true,
      "filePortal": true,
      "aiAssistant": false
    },
    "plan": "trial"
  }'

# Expected Response:
{
  "success": true,
  "clientId": "client_1234567890",
  "message": "Account created successfully",
  "deploymentStatus": "initiated"
}
```

#### **Test Deployment Status Endpoint**
```bash
# Check deployment progress
curl http://localhost:3002/api/deploy-status/client_1234567890

# Expected Response:
{
  "clientId": "client_1234567890", 
  "status": "provisioning", # or "completed", "failed"
  "progress": 45,
  "currentStep": "Setting up CRM database",
  "estimatedCompletion": "8 minutes",
  "services": {
    "ec2": "completed",
    "s3": "in-progress", 
    "route53": "pending",
    "ses": "pending"
  }
}
```

---

### **Test 3: AWS Infrastructure Provisioning**

#### **Monitor AWS Resource Creation**
```bash
# Check if AWS credentials work
aws sts get-caller-identity

# Monitor EC2 instances
aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=StackPro" \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,Tags[?Key==`ClientId`].Value|[0]]'

# Monitor S3 buckets  
aws s3 ls | grep stackpro-client

# Monitor Route53 hosted zones
aws route53 list-hosted-zones \
  --query 'HostedZones[?contains(Name, `stackpro.io`)]'
```

#### **Test Resource Creation Script**
```bash
# Run deployment test (simulate customer signup)
node scripts/test-deployment.js

# This should:
# 1. Create test client record
# 2. Provision AWS resources  
# 3. Set up Docker containers
# 4. Configure DNS
# 5. Send welcome email
```

---

### **Test 4: Client Dashboard Access**

#### **After Deployment Completes:**
1. **Check Email**: Welcome email with dashboard link
2. **Access Dashboard**: 
   - URL: `https://smithrealestate.stackpro.io/dashboard`
   - Or: `http://localhost:3000/dashboard?client=client_1234567890`

#### **Verify Dashboard Features:**
- ✅ **Login Works**: Use credentials from welcome email
- ✅ **CRM Access**: Button redirects to EspoCRM instance
- ✅ **File Portal**: Button redirects to Nextcloud instance  
- ✅ **Website Builder**: Can edit and preview business site
- ✅ **Settings Panel**: Can update business information

#### **Test Deployed Services:**
```bash
# Test if client services are responding
curl -I https://crm.smithrealestate.stackpro.io
curl -I https://files.smithrealestate.stackpro.io  
curl -I https://smithrealestate.stackpro.io
```

---

## 🔧 **Troubleshooting Common Issues**

### **Frontend Issues**

#### **Signup Modal Won't Open**
```bash
# Check browser console for errors
# Common fixes:
cd frontend && npm install
npm run dev
```

#### **Form Validation Errors**
- **Email**: Must be valid format
- **Domain**: Letters/numbers/hyphens only
- **Business Name**: 2-50 characters

### **Backend Issues**

#### **API Not Responding** 
```bash
# Check if server is running on correct port
netstat -tlnp | grep :3002
ps aux | grep node

# Restart API server
npm run dev
```

#### **Database Connection Errors**
```bash
# Check database service
npm run test-db

# Reset database (development only)
npm run db-reset
```

### **AWS Issues**

#### **Credentials Not Configured**
```bash
aws configure
# Enter Access Key, Secret Key, Region: us-west-2
```

#### **Permission Errors**
```bash
# Verify IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```

#### **Resource Limits**
- **EC2**: Check if you're hitting instance limits
- **S3**: Verify bucket naming conflicts
- **Route53**: Confirm hosted zone limits

---

## 🎯 **End-to-End Test Script**

Create automated test:

```javascript
// scripts/test-complete-flow.js
const puppeteer = require('puppeteer');
const axios = require('axios');

async function testCompleteFlow() {
  console.log('🧪 Starting complete signup → deployment test...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. Test signup flow
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="signup-button"]');
    
    // Fill form...
    await page.type('[name="firstName"]', 'Test');
    await page.type('[name="lastName"]', 'User');  
    await page.type('[name="email"]', `test+${Date.now()}@example.com`);
    // ... continue with form filling
    
    // 2. Submit and get client ID
    await page.click('[data-testid="submit-signup"]');
    await page.waitForSelector('[data-testid="client-id"]');
    const clientId = await page.$eval('[data-testid="client-id"]', el => el.textContent);
    
    console.log(`✅ Signup completed: ${clientId}`);
    
    // 3. Poll deployment status
    let deploymentComplete = false;
    let attempts = 0;
    
    while (!deploymentComplete && attempts < 20) {
      const response = await axios.get(`http://localhost:3002/api/deploy-status/${clientId}`);
      
      if (response.data.status === 'completed') {
        deploymentComplete = true;
        console.log('✅ Deployment completed successfully!');
      } else {
        console.log(`⏳ Deployment status: ${response.data.status} (${response.data.progress}%)`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s
      }
      
      attempts++;
    }
    
    // 4. Test dashboard access
    if (deploymentComplete) {
      await page.goto(`http://localhost:3000/dashboard?client=${clientId}`);
      await page.waitForSelector('[data-testid="dashboard-welcome"]');
      console.log('✅ Dashboard accessible!');
      
      // Test CRM access
      await page.click('[data-testid="crm-button"]');
      // ... additional dashboard tests
    }
    
    console.log('🎉 Complete flow test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testCompleteFlow();
```

Run the test:
```bash
npm install puppeteer axios
node scripts/test-complete-flow.js
```

---

## ✅ **Success Checklist**

After running all tests, verify:

### **Frontend** 
- [ ] Landing page loads quickly
- [ ] Signup modal opens and advances through steps  
- [ ] Form validation works correctly
- [ ] Loading states display during processing
- [ ] Success/error messages appear appropriately

### **Backend**
- [ ] API endpoints respond correctly
- [ ] Client records created in database
- [ ] Deployment pipeline initiates
- [ ] Status updates work reliably
- [ ] Error handling functions properly

### **AWS Infrastructure** 
- [ ] EC2 instances launch successfully
- [ ] S3 buckets created with correct permissions
- [ ] Route53 DNS records configured
- [ ] SES email delivery working
- [ ] All resources tagged properly

### **Client Experience**
- [ ] Welcome email received
- [ ] Dashboard login works  
- [ ] All deployed services accessible
- [ ] Business website loads
- [ ] CRM and file portal functional

**🚀 When all items are checked, your signup → deployment pipeline is production ready!**
