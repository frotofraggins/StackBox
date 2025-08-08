# 🧪 StackPro Testing Setup Guide

## 💳 **PAYMENT PROCESSING: STRIPE (100% FREE for Testing!)**

### **Good News: Stripe Test Mode is Completely FREE!**
- ✅ **No charges** - Test mode never processes real payments
- ✅ **No fees** - No transaction costs in test mode  
- ✅ **No account verification** needed for testing
- ✅ **Instant setup** - Get testing keys immediately
- ✅ **Full functionality** - All features work in test mode

### **AWS vs Stripe for Payments:**
- **❌ AWS doesn't offer payment processing** (no free alternative)
- **✅ Stripe is the industry standard** for SaaS platforms
- **✅ Stripe test mode** is completely free and full-featured
- **✅ Easy integration** with your business tools platform

---

## 🚀 **QUICK STRIPE TEST SETUP (5 minutes)**

### **Step 1: Create Free Stripe Account**
1. Go to: https://dashboard.stripe.com/register
2. **Sign up with your email** (no verification needed for test mode)
3. **Skip business verification** (only needed for live payments)

### **Step 2: Get Test API Keys (FREE)**
1. **Go to:** https://dashboard.stripe.com/test/apikeys
2. **Copy these keys:**
   ```bash
   # Publishable key (safe to expose)
   pk_test_51xxxxx...
   
   # Secret key (keep private)
   sk_test_51xxxxx...
   ```

### **Step 3: Update Your .env File**
```bash
# Replace the placeholder values:
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE

# Webhook secret (optional for basic testing)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### **Test Credit Card Numbers (FREE - No Real Charges):**
```bash
# Successful payment test
4242424242424242

# Card declined test  
4000000000000002

# Insufficient funds test
4000000000009995
```

---

## 🏗️ **CURRENT INFRASTRUCTURE STATUS**

### **✅ What's Already Configured:**
- ✅ **Domain:** stackpro.io (DNS controlled by Stackbox account)
- ✅ **SSL Certificate:** Requested (arn:aws:acm:us-west-2:304052673868:certificate/2b683549-81e3-47c2-8929-3ae0e26c7328)
- ✅ **DNS Validation:** SSL validation record added (pending)
- ✅ **Environment:** .env file configured with StackPro settings
- ✅ **Hosted Zone:** Z0293767219852CNS3KMT in Stackbox account

### **⏳ What's Pending:**
- ⏳ **SSL Certificate Validation:** 5-10 minutes for DNS propagation
- ⏳ **Website DNS Records:** Need to add A/CNAME records
- ⏳ **Load Balancer Setup:** Point domain to your infrastructure
- ⏳ **Stripe Keys:** Add your test keys to .env

---

## 🌐 **NEXT STEP: ADD WEBSITE DNS RECORDS**

Let me add basic DNS records so your domain points somewhere:

### **Basic DNS Configuration:**
```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "stackpro.io",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {"Value": "76.76.19.19"}
        ]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.stackpro.io",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {"Value": "stackpro.io"}
        ]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.stackpro.io",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {"Value": "76.76.19.19"}
        ]
      }
    }
  ]
}
```

---

## 🧪 **TESTING CHECKLIST**

### **Phase 1: Domain & SSL (Today)**
- [ ] **Verify SSL certificate** validates (5-10 minutes)
- [ ] **Add website DNS records** (immediate)
- [ ] **Test domain resolution** (`nslookup stackpro.io`)
- [ ] **Verify HTTPS works** (once SSL validates)

### **Phase 2: Payment Testing (Today)**
- [ ] **Create Stripe test account** (5 minutes)
- [ ] **Get API keys** and update .env
- [ ] **Test payment forms** with test card numbers
- [ ] **Verify webhooks** (optional for basic testing)

### **Phase 3: Platform Testing (This Week)**
- [ ] **Test signup flow** with Stripe test payments
- [ ] **Verify client deployment** simulation
- [ ] **Test business tools** provisioning
- [ ] **End-to-end client journey**

---

## 💻 **DEVELOPMENT TESTING COMMANDS**

### **Start Your Platform:**
```bash
# Install dependencies (if not done)
npm install

# Start backend API
npm run dev

# Start frontend (in separate terminal)
cd frontend && npm run dev
```

### **Test Domain Resolution:**
```bash
# Check if domain resolves
nslookup stackpro.io

# Check SSL certificate status
openssl s_client -connect stackpro.io:443 -servername stackpro.io

# Check website loads
curl -I https://stackpro.io
```

### **Test API Endpoints:**
```bash
# Test API health
curl https://api.stackpro.io/health

# Test payment endpoint (with Stripe test keys)
curl -X POST https://api.stackpro.io/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 29900}'
```

---

## 🔧 **MOCK DATA FOR TESTING**

### **Test Client Configuration:**
```json
{
  "clientId": "test-client-123",
  "email": "test@lawfirm.com",
  "domain": "testlawfirm.stackpro.io",
  "features": {
    "espocrm": true,
    "nextcloud": true,
    "calcom": false,
    "mailtrain": true
  },
  "branding": {
    "logoUrl": "https://stackpro.io/assets/logos/test-client.png",
    "themeColor": "#1e40af"
  }
}
```

### **Test Stripe Products:**
```javascript
// Test pricing plans for your platform
const testPricing = [
  {
    name: "StackPro Starter",
    price: 299,
    features: ["CRM", "File Portal", "Basic Website"]
  },
  {
    name: "StackPro Business", 
    price: 599,
    features: ["All Starter", "Booking System", "Email Marketing"]
  },
  {
    name: "StackPro Enterprise",
    price: 1299,
    features: ["All Business", "Custom Integrations", "Priority Support"]
  }
];
```

---

## ⚡ **TESTING SCENARIOS**

### **Scenario 1: New Client Signup**
1. **Visit:** https://stackpro.io
2. **Select plan:** StackPro Business ($599/month)
3. **Fill out form:** Business details
4. **Test payment:** Use 4242424242424242
5. **Verify deployment:** Check client subdomain created

### **Scenario 2: Failed Payment**
1. **Use test card:** 4000000000000002 (declined)
2. **Verify error handling:** Proper error messages
3. **Retry with valid card:** 4242424242424242
4. **Confirm success flow:** Deployment proceeds

### **Scenario 3: Webhook Testing**
1. **Stripe webhook endpoint:** /stripe/webhook
2. **Test events:** payment_intent.succeeded
3. **Verify client provisioning:** Automatic deployment
4. **Check email notifications:** SES integration

---

## 🎯 **SUCCESS METRICS**

### **Testing Complete When:**
- [ ] **Domain resolves:** stackpro.io loads
- [ ] **SSL certificate:** HTTPS works without warnings  
- [ ] **Payment processing:** Stripe test payments work
- [ ] **Client provisioning:** Test deployment succeeds
- [ ] **End-to-end flow:** Complete signup → deployment → login

---

## 🚨 **IMMEDIATE ACTIONS**

### **Right Now (15 minutes):**
1. **✅ Get Stripe test keys** - https://dashboard.stripe.com/test/apikeys
2. **✅ Update .env file** with your actual Stripe keys
3. **✅ Wait for SSL validation** (5-10 minutes)
4. **✅ Add DNS records** for website (I'll do this next)

### **Today (2 hours):**
1. **✅ Test payment flow** with Stripe test cards
2. **✅ Verify domain loads** over HTTPS
3. **✅ Test signup form** end-to-end
4. **✅ Deploy test client** to verify provisioning

---

## 💡 **WHY STRIPE IS PERFECT FOR YOU**

### **Business Benefits:**
- ✅ **Industry standard** - All SaaS platforms use Stripe
- ✅ **Professional appearance** - Customers trust Stripe
- ✅ **No AWS vendor lock-in** - Works with any infrastructure
- ✅ **Global payments** - Accept payments worldwide
- ✅ **Automatic receipts** - Built-in email receipts

### **Technical Benefits:**
- ✅ **Easy integration** - Great documentation
- ✅ **Webhook support** - Automatic provisioning triggers
- ✅ **Test mode** - Unlimited free testing
- ✅ **PCI compliance** - Stripe handles security
- ✅ **Subscription billing** - Perfect for SaaS recurring revenue

### **Cost Benefits:**
- ✅ **Free testing** - No setup fees
- ✅ **Pay per transaction** - Only 2.9% + 30¢ when live
- ✅ **No monthly fees** - No fixed costs
- ✅ **Transparent pricing** - No hidden fees

---

## 🎉 **READY TO TEST!**

**Your StackPro platform is almost ready for testing!**

**Next Steps:**
1. **Get Stripe test keys** (5 minutes)
2. **Update .env file** with keys
3. **I'll add DNS records** so domain works
4. **Start testing payments** with test cards

**You'll be testing live payments within the next 30 minutes!** 🚀

**No real money needed - everything is FREE in test mode!** 💰
