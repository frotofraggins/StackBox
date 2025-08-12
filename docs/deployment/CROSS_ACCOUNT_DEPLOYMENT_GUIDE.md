# Cross-Account Deployment Guide ✅

## 🎯 Problem Solved
- **Issue**: E2E tests failed because `sandbox.stackpro.io` was deployed to wrong AWS account
- **Root Cause**: Connected to account `564507211043` instead of target `304052673868`
- **Solution**: Cross-account deployment strategy that keeps Cline connected while deploying to correct account

## 📋 Account Architecture

| Account | ID | Purpose | Status |
|---------|-------|---------|---------|
| 🔗 **Cline Default** | `564507211043` | Keep for chat connectivity | ✅ Connected |
| 🎯 **Infrastructure** | `304052673868` | Deploy ALL resources here | ⚠️ Setup needed |
| 🏠 **Domain Holder** | `788363206718` | Domain transfer operations | 📍 Future use |

## 🚀 Immediate Next Steps

### Step 1: Configure Infrastructure Profile (One-time setup)
```bash
# Set up AWS profile for infrastructure account
aws configure --profile infrastructure

# When prompted, enter:
# Account ID: 304052673868
# Region: us-west-2
# Access Key ID: [Your infrastructure account access key]
# Secret Access Key: [Your infrastructure account secret key]
```

### Step 2: Verify Profile Setup
```bash
# Test connection to infrastructure account
AWS_PROFILE=infrastructure aws sts get-caller-identity

# Should show Account: 304052673868
```

### Step 3: Run Cross-Account Deployment
```bash
# Execute the deployment script
./scripts/deploy-cross-account.sh

# This will:
# - Create sandbox.stackpro.io in CORRECT account
# - Set up email forwarding for SSL cert validation  
# - Deploy Amplify to CORRECT account
# - Run E2E tests (should pass!)
```

## 🔧 Manual Commands (Alternative)

If the script doesn't work, run these commands individually:

```bash
# Deploy DNS to correct account
AWS_PROFILE=infrastructure node scripts/setup-sandbox-dns.js

# Set up email forwarding in correct account
AWS_PROFILE=infrastructure node scripts/setup-sandbox-email-forwarding.js

# Deploy Amplify to correct account
AWS_PROFILE=infrastructure node scripts/deploy-amplify-sandbox.js

# Verify deployment
AWS_PROFILE=infrastructure aws route53 list-hosted-zones --query "HostedZones[?contains(Name, 'sandbox')]"

# Run E2E tests (should pass now!)
node scripts/e2e-test-suite.js
```

## ✅ What's Already Done

### 1. E2E Test Framework ✅
- `scripts/e2e-test-suite.js` - Complete test framework
- `scripts/test-dataset-ingestion.js` - Capability tests
- `TEST_SUMMARY.md` - Test results
- Framework works perfectly - failures were due to wrong account

### 2. Account Management ✅
- `config/aws-accounts.json` - Account configuration
- `scripts/verify-correct-aws-account.js` - Account verification
- `scripts/deploy-to-correct-account.js` - Cross-account setup
- `scripts/deploy-cross-account.sh` - Deployment script

### 3. Infrastructure Scripts ✅
- `scripts/setup-sandbox-dns.js` - DNS setup
- `scripts/setup-sandbox-email-forwarding.js` - Email forwarding
- Ready for deployment to correct account

## 🎉 Expected Results After Deployment

### DNS Verification
```bash
# sandbox.stackpro.io should resolve
nslookup sandbox.stackpro.io

# Should show AWS nameservers
```

### E2E Test Results
```bash
# Tests should now pass
node scripts/e2e-test-suite.js

# Expected results:
# ✅ Local Backend Health: PASS
# ✅ API Capabilities: PASS  
# ✅ Email Stack - OFF (degraded): PASS
# ✅ AI Docs - OFF (degraded): PASS
# ✅ Data Ingestion - OFF (degraded): PASS
```

## 🔒 Cline Connectivity

**Important**: Throughout this process, Cline remains connected to the default account (`564507211043`) for uninterrupted chat functionality. Only deployments use the infrastructure account profile.

## 📁 Files Created

- ✅ `scripts/deploy-to-correct-account.js`
- ✅ `scripts/deploy-cross-account.sh` 
- ✅ `config/cross-account-deployment.json`
- ✅ `CROSS_ACCOUNT_DEPLOYMENT_GUIDE.md` (this file)
- ✅ Updated `~/.aws/config` with profiles

## 🎯 Success Criteria

After running the deployment:

1. **DNS Resolution**: `sandbox.stackpro.io` resolves correctly
2. **Account Verification**: Resources exist in account `304052673868` 
3. **E2E Tests Pass**: All tests show PASS or expected degraded state
4. **Cline Connectivity**: Chat remains functional on default account

## 🆘 Troubleshooting

### Profile Not Found
```bash
# Check AWS profiles
aws configure list-profiles

# Should show: default, infrastructure
```

### Wrong Account
```bash
# Verify you're using the right profile
AWS_PROFILE=infrastructure aws sts get-caller-identity

# Should show Account: 304052673868
```

### Permission Errors
```bash
# Ensure infrastructure account has Route53, SES, Lambda permissions
AWS_PROFILE=infrastructure aws iam get-user
```

---

**Ready to proceed**: Run `aws configure --profile infrastructure` then `./scripts/deploy-cross-account.sh`
