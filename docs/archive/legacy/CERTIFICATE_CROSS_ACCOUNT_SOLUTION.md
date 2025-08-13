# 🔐 CERTIFICATE CROSS-ACCOUNT SOLUTION

**Generated:** August 10, 2025  
**Status:** ✅ **DOMAIN ACCOUNT CERTIFICATE CREATED** | 🔄 **VALIDATION PENDING**

---

## 📊 CURRENT SITUATION

### ✅ **Certificate Created in Domain Account**
- **Domain Account ARN:** `arn:aws:acm:us-west-2:788363206718:certificate/6a47dbaf-5e9f-4c85-a67c-18a16cd63309`
- **Domains:** `sandbox.stackpro.io` + `*.sandbox.stackpro.io`
- **Status:** `PENDING_VALIDATION` (DNS validation added)
- **Validation Record:** Added to Route53 hosted zone

### 🔄 **Original Certificate in Stackbox Account**
- **Stackbox Account ARN:** `arn:aws:acm:us-west-2:304052673868:certificate/7436438f-a12a-4d0b-820f-a2b3b59986db`
- **Status:** `PENDING_VALIDATION` (awaiting DNS propagation)

---

## 🎯 **SOLUTION OPTIONS**

### **Option 1: Use Domain Account Certificate (RECOMMENDED)**

**✅ Advantages:**
- Certificate validates faster (same account as DNS)
- No cross-account DNS complexity
- More reliable validation process

**Architecture:**
```
Domain Account (788363206718):
├── Route53 Hosted Zone (stackpro.io)
├── ACM Certificate (validated)
└── CloudFront Distribution
    └── Origin: Amplify in Stackbox Account
```

**Implementation:**
1. **Wait for certificate validation** (typically 5-30 minutes)
2. **Create CloudFront distribution** in domain account
3. **Configure origin** to point to Amplify app in Stackbox account
4. **Associate certificate** with CloudFront distribution
5. **Update DNS** to point to CloudFront

### **Option 2: Cross-Account DNS Delegation**

**Architecture:**
```
Domain Account: Route53 + DNS Records
Stackbox Account: ACM Certificate + Validation
```

**Status:** Currently in progress, awaiting propagation

### **Option 3: Third-Party Certificate Import**

**Process:**
1. Purchase SSL certificate from external CA
2. Import into both AWS accounts as needed
3. Higher cost but maximum flexibility

---

## 🚀 **RECOMMENDED IMPLEMENTATION**

### **Phase 1: CloudFront + Domain Account Certificate**

```bash
# 1. Wait for certificate validation
aws acm describe-certificate \
  --profile domain-account \
  --region us-west-2 \
  --certificate-arn "arn:aws:acm:us-west-2:788363206718:certificate/6a47dbaf-5e9f-4c85-a67c-18a16cd63309"

# 2. Create CloudFront distribution
aws cloudfront create-distribution \
  --profile domain-account \
  --distribution-config file://cloudfront-config.json

# 3. Update DNS to point to CloudFront
aws route53 change-resource-record-sets \
  --profile domain-account \
  --hosted-zone-id "Z09644762VPS77ZYCBQ3E" \
  --change-batch file://cloudfront-dns.json
```

### **CloudFront Configuration Template**

```json
{
  "CallerReference": "stackpro-sandbox-cf-2025-08-10",
  "Comment": "StackPro Sandbox CloudFront Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "amplify-origin",
        "DomainName": "d3m3k3uuuvlvyv.amplifyapp.com",
        "CustomOriginConfig": {
          "HTTPPort": 443,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          }
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "amplify-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "all"
      },
      "Headers": {
        "Quantity": 1,
        "Items": ["Host"]
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-west-2:788363206718:certificate/6a47dbaf-5e9f-4c85-a67c-18a16cd63309",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Aliases": {
    "Quantity": 1,
    "Items": ["sandbox.stackpro.io"]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

---

## 📋 **VALIDATION STATUS MONITORING**

### **Check Certificate Status**
```bash
# Domain account certificate
aws acm describe-certificate \
  --profile domain-account \
  --region us-west-2 \
  --certificate-arn "arn:aws:acm:us-west-2:788363206718:certificate/6a47dbaf-5e9f-4c85-a67c-18a16cd63309" \
  --query "Certificate.Status"

# Stackbox account certificate  
aws acm describe-certificate \
  --profile Stackbox \
  --region us-west-2 \
  --certificate-arn "arn:aws:acm:us-west-2:304052673868:certificate/7436438f-a12a-4d0b-820f-a2b3b59986db" \
  --query "Certificate.Status"
```

### **DNS Validation Check**
```bash
# Verify DNS records are propagated
dig _f4ad551d4d50bb12b7f47fc064e3c360.sandbox.stackpro.io CNAME
nslookup _f4ad551d4d50bb12b7f47fc064e3c360.sandbox.stackpro.io
```

---

## 🔄 **TIMELINE EXPECTATIONS**

### **Next 30 Minutes**
- DNS validation record propagation
- ACM certificate validation completion
- Ready to create CloudFront distribution

### **Next 1-2 Hours**
- CloudFront distribution deployment
- DNS update to point to CloudFront
- HTTPS access via `https://sandbox.stackpro.io`

### **Fallback Timeline**
- If domain account cert validates first → Use CloudFront approach
- If Stackbox account cert validates first → Direct Amplify association
- Both approaches lead to same end result

---

## 💡 **ADVANTAGES OF CLOUDFRONT APPROACH**

### **Performance**
- **Global CDN** with edge locations worldwide
- **Automatic caching** of static assets
- **Faster load times** for global users

### **Security** 
- **AWS Shield Standard** DDoS protection included
- **SSL/TLS termination** at edge locations
- **Origin access control** for enhanced security

### **Operational**
- **Single domain account** manages all DNS + certificates
- **Simplified certificate renewals** (automatic)
- **Better monitoring** and logging capabilities

### **Cost**
- **No additional cost** for CloudFront with low traffic
- **Reduced data transfer costs** due to caching
- **Free SSL certificate** management

---

## 🎯 **IMMEDIATE NEXT STEPS**

1. **Monitor certificate validation** (check every 5 minutes)
2. **Prepare CloudFront configuration** (template ready above)
3. **Test Amplify app accessibility** via direct URL
4. **Create CloudFront distribution** once certificate validates
5. **Update DNS records** to point to CloudFront
6. **Verify HTTPS access** via `sandbox.stackpro.io`

---

## 📊 **SUCCESS METRICS**

### **Technical**
- ✅ Certificate validates in domain account
- ✅ CloudFront distribution deployed
- ✅ HTTPS access via custom domain
- ✅ SSL Labs A+ rating

### **Business**
- 🚀 Production-ready domain setup
- 🌍 Global CDN performance
- 🔒 Enterprise-grade security
- 📈 Scalable architecture foundation

---

**Status:** 🔄 **AWAITING CERTIFICATE VALIDATION**  
**ETA:** ⏰ **5-30 minutes**  
**Next Action:** 🎯 **Create CloudFront distribution**

---

*This approach provides the most reliable and performant solution for cross-account certificate management.*
