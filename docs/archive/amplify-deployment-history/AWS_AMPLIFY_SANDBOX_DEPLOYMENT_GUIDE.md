# AWS Amplify Sandbox Deployment Guide

## 📋 Summary

This guide covers the deployment of StackPro frontend to AWS Amplify in a free-tier sandbox environment at `sandbox.stackpro.io`.

### ✅ Completed Improvements

1. **Fixed Color Contrast Issues**
   - Features page dashboard numbers ("+24%", "12 files") now use high-contrast colors
   - Pricing page comparison table uses consistent dark theme styling

2. **Enhanced Terms of Service**
   - Added modern dark theme header
   - Created helpful "Quick Summary" section with visual icons
   - Organized content in readable cards with proper spacing
   - Improved typography and list formatting

3. **Created AWS Amplify Deployment Script**
   - Automated sandbox deployment to `sandbox.stackpro.io`
   - Free-tier optimized configuration
   - Built-in rollback and cost monitoring

## 🚀 Deployment Overview

### Architecture
```
GitHub Repo → AWS Amplify → CloudFront → sandbox.stackpro.io
                ↓
        Free-tier Environment Variables
        AI_ENABLED=false
        Sandbox Backend APIs
```

### Key Features
- **Free-tier optimized**: Stays within AWS free tier limits
- **Sandbox mode**: AI disabled, limited features for demos
- **Auto-deploy**: Connected to GitHub main branch
- **SSL included**: ACM certificate for HTTPS
- **Cost monitoring**: Built-in cost tracking

## 📋 Prerequisites

### 1. AWS Account Setup
```bash
# Install AWS CLI
aws configure

# Required permissions:
# - AWS Amplify (full access)
# - Route 53 (domain management)
# - ACM (certificate management)
# - CloudFront (CDN)
# - Cost Explorer (optional, for cost monitoring)
```

### 2. Environment Verification
```bash
# Check Node.js version
node --version  # Should be >= 16

# Check npm
npm --version

# Verify AWS credentials
aws sts get-caller-identity
```

### 3. Domain Prerequisites
- `sandbox.stackpro.io` must be configured in Route 53
- Domain verification for ACM certificate
- DNS management access

## 🛠️ Deployment Steps

### Step 1: Run Deployment Script
```bash
# Navigate to project directory
cd /path/to/StackBox

# Deploy to sandbox
node scripts/deploy-amplify-sandbox.js

# Monitor progress (30-45 minutes typical)
```

### Step 2: Manual DNS Configuration
After deployment, configure DNS records:

```
# Add CNAME record in Route 53
Name: sandbox.stackpro.io
Type: CNAME
Value: [provided by Amplify console]
TTL: 300
```

### Step 3: SSL Certificate Verification
```bash
# Check certificate status
aws acm list-certificates --region us-east-1

# Verify DNS validation records are added
# (Usually handled automatically by Route 53)
```

### Step 4: Verify Deployment
```bash
# Check deployment status
curl -I https://sandbox.stackpro.io

# Test free-tier mode
curl https://sandbox.stackpro.io/api/health
```

## ⚙️ Configuration Details

### Environment Variables (Sandbox)
```javascript
NEXT_PUBLIC_ENV=sandbox
NEXT_PUBLIC_API_URL=https://api-sandbox.stackpro.io
NEXT_PUBLIC_BACKEND_URL=https://api-sandbox.stackpro.io
NEXT_PUBLIC_WEBSOCKET_URL=wss://api-sandbox.stackpro.io
NEXT_PUBLIC_FREE_TIER=true
AI_ENABLED=false
NEXT_PUBLIC_AI_ENABLED=false
NEXT_PUBLIC_MESSAGING_ENABLED=true
NEXT_PUBLIC_SITE_BUILDER_ENABLED=true
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sandbox
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Free-tier limits
NEXT_PUBLIC_MAX_USERS=10
NEXT_PUBLIC_MAX_STORAGE_MB=100
NEXT_PUBLIC_MAX_EMAILS_PER_MONTH=100
NEXT_PUBLIC_FEATURES_CRM=basic
NEXT_PUBLIC_FEATURES_FILES=basic
NEXT_PUBLIC_FEATURES_WEBSITE=basic
```

### Build Specification
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - echo "Installing dependencies for sandbox deployment"
            - cd frontend
            - npm ci --only=production
        build:
          commands:
            - echo "Building Next.js app for sandbox"
            - echo "Free tier mode: $NEXT_PUBLIC_FREE_TIER"
            - echo "AI disabled: $AI_ENABLED"
            - npm run build
      artifacts:
        baseDirectory: frontend/.next
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
    appRoot: ./
```

## 📊 Cost Monitoring

### Check Free Tier Usage
```bash
# Monitor current month costs
node scripts/deploy-amplify-sandbox.js --cost-check

# Expected costs (free tier):
# - AWS Amplify: $0 (first 1000 build minutes free)
# - CloudFront: $0 (first 50GB free)
# - Route 53: ~$0.50/month (hosted zone)
# - ACM: $0 (free certificates)
```

### Free Tier Limits
| Service | Free Tier Limit | Expected Usage |
|---------|----------------|----------------|
| Amplify | 1000 build minutes | ~10 builds/month |
| CloudFront | 50GB transfer | <1GB for demo |
| Route 53 | 50 hosted zones | 1 zone |
| ACM | Unlimited certs | 1 certificate |

## 🔄 Rollback Procedures

### Automatic Rollback
```bash
# Rollback deployment
node scripts/deploy-amplify-sandbox.js --rollback

# This will:
# 1. Remove domain associations
# 2. Delete Amplify app
# 3. Clean up resources
# 4. Remove deployment summary
```

### Manual Rollback (if script fails)
```bash
# 1. Delete Amplify app
aws amplify delete-app --app-id [APP_ID] --region us-west-2

# 2. Remove domain association
aws amplify delete-domain-association \
  --app-id [APP_ID] \
  --domain-name sandbox.stackpro.io \
  --region us-west-2

# 3. Delete ACM certificate (optional)
aws acm delete-certificate --certificate-arn [CERT_ARN] --region us-east-1

# 4. Remove DNS records
aws route53 change-resource-record-sets \
  --hosted-zone-id [ZONE_ID] \
  --change-batch file://delete-records.json
```

## 🧪 Testing Procedures

### 1. Deployment Verification
```bash
# Test homepage
curl -s https://sandbox.stackpro.io | grep -o "<title>[^<]*"

# Test API connectivity
curl https://sandbox.stackpro.io/api/health

# Test free-tier mode
curl https://sandbox.stackpro.io/api/features | jq '.freetier'
```

### 2. Feature Testing
```bash
# Test color contrast fixes
# Visit: https://sandbox.stackpro.io/features
# Verify: Dashboard numbers are clearly visible

# Test pricing table
# Visit: https://sandbox.stackpro.io/pricing
# Verify: Comparison table has consistent dark theme

# Test improved terms
# Visit: https://sandbox.stackpro.io/terms
# Verify: Quick summary section and card layout
```

### 3. Performance Testing
```bash
# Test page load times
curl -w "@curl-format.txt" -o /dev/null -s https://sandbox.stackpro.io

# Test mobile responsiveness
# Use browser dev tools or online testing tools
```

### 4. Free-tier Verification
```bash
# Verify AI is disabled
curl https://sandbox.stackpro.io/api/ai/status
# Should return: {"enabled": false, "mode": "sandbox"}

# Verify feature limits
curl https://sandbox.stackpro.io/api/limits
# Should return sandbox limits
```

## 📈 Monitoring & Maintenance

### Daily Checks
- [ ] Site accessibility at https://sandbox.stackpro.io
- [ ] SSL certificate validity
- [ ] Build status in Amplify console

### Weekly Checks
- [ ] Free-tier usage monitoring
- [ ] Performance metrics review
- [ ] Error log analysis

### Monthly Tasks
- [ ] Cost analysis and optimization
- [ ] Security updates
- [ ] Feature testing
- [ ] Backup verification

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
aws amplify get-job \
  --app-id [APP_ID] \
  --branch-name main \
  --job-id [JOB_ID] \
  --region us-west-2

# Common fixes:
# 1. Check environment variables
# 2. Verify build specification
# 3. Update dependencies
# 4. Clear build cache
```

#### Domain Issues
```bash
# Verify DNS records
nslookup sandbox.stackpro.io

# Check SSL certificate
openssl s_client -connect sandbox.stackpro.io:443 -servername sandbox.stackpro.io

# Verify domain association
aws amplify get-domain-association \
  --app-id [APP_ID] \
  --domain-name sandbox.stackpro.io \
  --region us-west-2
```

#### Performance Issues
```bash
# Clear CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --paths "/*"

# Check build optimization
# Review bundle size in build logs
```

### Support Contacts
- AWS Support: Premium support plan required
- Amplify Documentation: https://docs.aws.amazon.com/amplify/
- StackPro Issues: GitHub Issues tab

## 📚 Additional Resources

### AWS Documentation
- [Amplify Hosting Guide](https://docs.aws.amazon.com/amplify/latest/userguide/getting-started.html)
- [Custom Domain Setup](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
- [SSL Certificates](https://docs.aws.amazon.com/acm/latest/userguide/gs.html)

### StackPro Resources
- [Frontend Development Guide](./FRONTEND_PRODUCTION_READINESS_AUDIT.md)
- [Backend Integration](./BACKEND_DEPLOYMENT_GUIDE.md)
- [Security Documentation](./SECURITY_ISOLATION_ENFORCEMENT.md)

### Useful Commands
```bash
# Quick status check
aws amplify list-apps --region us-west-2

# Get app details
aws amplify get-app --app-id [APP_ID] --region us-west-2

# List builds
aws amplify list-jobs --app-id [APP_ID] --branch-name main --region us-west-2

# Check cost
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## 🎯 Next Steps

After successful deployment:

1. **Verify all features work in sandbox mode**
2. **Test messaging system integration**
3. **Test site builder functionality**
4. **Configure monitoring alerts**
5. **Document any custom configurations**
6. **Plan production deployment strategy**

## ✅ Deployment Checklist

- [ ] AWS credentials configured
- [ ] Domain DNS configured
- [ ] Deployment script executed successfully
- [ ] SSL certificate validated
- [ ] Site accessible at sandbox.stackpro.io
- [ ] Free-tier mode verified
- [ ] Color contrast fixes confirmed
- [ ] Terms of service improvements verified
- [ ] Performance testing completed
- [ ] Rollback procedure tested
- [ ] Monitoring configured
- [ ] Documentation updated

---

**Last Updated**: January 8, 2025  
**Version**: 1.0  
**Environment**: Free-tier Sandbox  
**Domain**: sandbox.stackpro.io
