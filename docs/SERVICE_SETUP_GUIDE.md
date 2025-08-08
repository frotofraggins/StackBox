# 🚀 StackBox Service Setup Guide

## 📋 **OVERVIEW - Services You Need**

To run your StackBox MVP, you need these services configured:

1. **AWS Account** - For enterprise infrastructure (ACM, ALB, RDS, etc.)
2. **Stripe Account** - For payment processing  
3. **Domain Name** - For your primary website
4. **Environment Configuration** - Local development setup
5. **Git Repository** - For code deployment

---

## 🏗️ **STEP 1: AWS ACCOUNT SETUP**

### **Create AWS Account (if you don't have one):**
1. Go to: https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow signup process
4. **Important:** You'll get 12 months free tier

### **Configure AWS CLI:**
```bash
# Install AWS CLI (if not installed)
# Download from: https://aws.amazon.com/cli/

# Configure your credentials
aws configure

# Enter when prompted:
AWS Access Key ID: [Your access key]
AWS Secret Access Key: [Your secret key]  
Default region name: us-west-2
Default output format: json
```

### **Get AWS Credentials:**
1. **Login to AWS Console:** https://console.aws.amazon.com/
2. **Go to IAM:** Search "IAM" in services
3. **Create User:**
   - Click "Users" → "Create User"
   - Username: `stackbox-deployer`
   - Check "Programmatic access"
4. **Attach Policies:**
   - `AmazonEC2FullAccess`
   - `AmazonS3FullAccess`
   - `AmazonRoute53FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonVPCFullAccess`
   - `AWSCertificateManagerFullAccess`
   - `SecretsManagerReadWrite`
5. **Save credentials** - You'll need the Access Key ID and Secret Access Key

### **Test AWS Connection:**
```bash
# Test your credentials
npm run test-aws
```

---

## 💳 **STEP 2: STRIPE ACCOUNT SETUP**

### **Create Stripe Account:**
1. Go to: https://stripe.com/
2. Click "Start now" 
3. Create account with your email
4. **Skip business verification for now** (use test mode)

### **Get Stripe API Keys:**
1. **Login to Stripe Dashboard:** https://dashboard.stripe.com/
2. **Go to Developers → API Keys**
3. **Copy these keys:**
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
4. **Create webhook endpoint:**
   - Go to "Developers → Webhooks"
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/stripe-webhook` (for now use localhost)
   - Select events: `checkout.session.completed`, `invoice.payment_failed`
   - Copy the **Webhook Secret** (starts with `whsec_`)

---

## 🌐 **STEP 3: DOMAIN NAME SETUP**

### **Option A: Use Your Existing Domain**
If you have `allbusinesstools.com`:
1. **Point DNS to your deployment:**
   - Add CNAME record pointing to your Vercel deployment
   - Or use AWS Route 53 for full AWS integration

### **Option B: Get a New Domain**
1. **Check availability:**
   ```bash
   npm run check-domains
   ```
2. **Purchase domain:**
   - Use AWS Route 53 (recommended): https://console.aws.amazon.com/route53/
   - Or use Namecheap, GoDaddy, etc.
3. **Configure DNS:**
   - If using Route 53: Automatic
   - If external: Point nameservers to Route 53

### **Option C: Use Subdomain (Development)**
- Use Vercel's provided domain (e.g., `stackbox.vercel.app`)
- Or use ngrok for local testing: https://ngrok.com/

---

## ⚙️ **STEP 4: ENVIRONMENT CONFIGURATION**

### **Create your .env file:**
```bash
# Copy the template
copy .env.template .env
```

### **Fill in your .env file:**
```bash
# AWS Configuration (from Step 1)
AWS_PROFILE=default
AWS_REGION=us-west-2

# Domain Configuration
DOMAIN_PRIMARY=allbusinesstools.com
FRONTEND_URL=http://localhost:3000
STACKBOX_API_URL=http://localhost:3001

# Stripe Configuration (from Step 2)
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE

# Development Settings
NODE_ENV=development
PORT=3001
FRONTEND_PORT=3000
```

### **Create frontend environment:**
```bash
# Create frontend/.env.local
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE" > frontend/.env.local
echo "STACKBOX_API_URL=http://localhost:3001" >> frontend/.env.local
```

---

## 📧 **STEP 5: EMAIL SETUP (Optional)**

### **Option A: AWS SES (Recommended)**
1. **Go to AWS SES:** https://console.aws.amazon.com/ses/
2. **Verify your email address**
3. **Request production access** (for sending to any email)
4. **Add to .env:**
   ```bash
   SMTP_HOST=email-smtp.us-west-2.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   ```

### **Option B: Gmail (Development)**
1. **Enable 2-factor authentication** on your Google account
2. **Generate app password:** https://myaccount.google.com/apppasswords
3. **Add to .env:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

---

## 🚀 **STEP 6: DEPLOYMENT SETUP**

### **Option A: Vercel (Recommended - Easiest)**

#### **Install Vercel CLI:**
```bash
npm install -g vercel
```

#### **Deploy:**
```bash
# Deploy the entire project
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set environment variables in Vercel dashboard
```

#### **Add Environment Variables in Vercel:**
1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add all variables from your .env file

### **Option B: AWS (Advanced)**
1. **Frontend:** Use S3 + CloudFront
2. **Backend:** Use Fargate or Lambda
3. **Follow:** TESTING_AND_DEPLOYMENT_GUIDE.md for detailed instructions

---

## 🧪 **STEP 7: TESTING YOUR SETUP**

### **Run System Tests:**
```bash
# Test everything is configured
npm run quick-test

# Test AWS connectivity
npm run test-aws

# Test API server
npm run dev
# (In another terminal)
npm run health
```

### **Test Frontend:**
```bash
# Start frontend (in another terminal)
cd frontend
npm run dev

# Open browser to:
http://localhost:3000
```

### **Test Payment Flow:**
1. **Use Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

---

## 🔧 **STEP 8: TROUBLESHOOTING**

### **Common Issues & Solutions:**

#### **AWS Credentials Error:**
```bash
# Check AWS configuration
aws sts get-caller-identity

# If error, reconfigure:
aws configure
```

#### **Stripe Webhook Error:**
```bash
# For local testing, use Stripe CLI:
stripe listen --forward-to localhost:3001/api/stripe-webhook
```

#### **Port Already in Use:**
```bash
# Kill processes on ports
npx kill-port 3000 3001
```

#### **Environment Variables Not Loading:**
- Ensure `.env` is in project root
- Restart your development server
- Check for typos in variable names

---

## 🎯 **QUICK START CHECKLIST**

Once you have all services set up:

- [ ] ✅ AWS credentials configured (`aws sts get-caller-identity` works)
- [ ] ✅ Stripe keys added to `.env` and `frontend/.env.local`  
- [ ] ✅ Domain configured (or using localhost for development)
- [ ] ✅ Environment files created and populated
- [ ] ✅ All tests pass (`npm run quick-test`)

### **Launch Your MVP:**
```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start frontend  
cd frontend && npm run dev

# Terminal 3: Test everything
npm run health
```

**Open:** http://localhost:3000

## 🎉 **SUCCESS!**

Your StackBox MVP should now be running with:
- ✅ Professional landing page
- ✅ 4-step signup flow  
- ✅ Stripe payment integration
- ✅ AWS enterprise infrastructure ready
- ✅ Complete business platform

**Next:** Test the signup flow and start getting customers! 🚀

---

## 📞 **NEED HELP?**

If you get stuck on any step:
1. Check `TESTING_AND_DEPLOYMENT_GUIDE.md` for detailed instructions
2. Run `npm run quick-test` to identify issues
3. Check the service documentation links provided above

**Your enterprise SaaS platform is ready to launch!** 🎯
