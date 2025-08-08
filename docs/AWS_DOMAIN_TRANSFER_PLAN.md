# 🔄 AWS Domain Transfer Plan: StackPro.io Transfer

## 📋 **TRANSFER OVERVIEW**

**From:** StackPro Account (788363206718)  
**To:** Stackbox Account (304052673868) ✅ **Target Account**

**Current Status:**
- ✅ **Domain hosted zone exists** in stackpro account
- ✅ **Target account verified** - Stackbox account ready
- ⚠️ **60-day transfer lock** may apply if recently registered

---

## 🎯 **TRANSFER STRATEGY**

### **Option 1: AWS-to-AWS Domain Transfer (If Domain is Registered via AWS)**

#### **Step 1: Verify Domain Registration**
```bash
# Check if domain is registered in stackpro account
aws route53domains list-domains --region us-east-1 --profile stackpro

# If empty, domain was registered elsewhere
```

#### **Step 2: Initiate AWS Transfer** (If domain found)
```bash
# From stackpro account - initiate transfer
aws route53domains transfer-domain-to-another-aws-account \
    --domain-name stackpro.io \
    --account-id 304052673868 \
    --region us-east-1 \
    --profile stackpro
```

#### **Step 3: Accept Transfer** (In Stackbox account)
```bash
# In Stackbox account - accept the transfer
aws route53domains accept-domain-transfer-from-another-aws-account \
    --domain-name stackpro.io \
    --password [TRANSFER-PASSWORD-FROM-STEP-2] \
    --region us-east-1 \
    --profile Stackbox
```

### **Option 2: External Registrar + Hosted Zone Transfer (If Domain Registered Elsewhere)**

#### **Step 1: Transfer Hosted Zone**
```bash
# Export zone from stackpro account
aws route53 list-resource-record-sets \
    --hosted-zone-id Z09644762VPS77ZYCBQ3E \
    --profile stackpro \
    --output json > stackpro-zone-export.json

# Create new hosted zone in Stackbox account
aws route53 create-hosted-zone \
    --name stackpro.io \
    --caller-reference stackpro-transfer-$(date +%s) \
    --profile Stackbox
```

#### **Step 2: Update Nameservers at External Registrar**
Update registrar to point to new Stackbox account nameservers.

---

## 🔍 **PRE-TRANSFER CHECKLIST**

### **1. Check Domain Registration Status**
```bash
# Verify where domain is actually registered
whois stackpro.io

# Check Route 53 domains in both accounts
aws route53domains list-domains --region us-east-1 --profile stackpro
aws route53domains list-domains --region us-east-1 --profile Stackbox
```

### **2. Verify Transfer Eligibility**
```bash
# Check domain status
aws route53domains get-domain-detail \
    --domain-name stackpro.io \
    --region us-east-1 \
    --profile stackpro
```

### **3. Backup Current Configuration**
```bash
# Export current DNS records
aws route53 list-resource-record-sets \
    --hosted-zone-id Z09644762VPS77ZYCBQ3E \
    --profile stackpro > stackpro-dns-backup.json
```

---

## ⏰ **TRANSFER TIMELINES**

### **AWS-to-AWS Transfer:**
- **Day 1:** Initiate transfer (if domain registered via AWS)
- **Day 1-5:** Transfer processing
- **Day 5:** Domain fully transferred to Stackbox account

### **External Registrar Method:**
- **Day 1:** Create new hosted zone in Stackbox account
- **Day 1:** Update nameservers at registrar
- **Day 1-2:** DNS propagation complete
- **Immediate:** Full control in Stackbox account

### **Transfer Restrictions:**
- **60-day lock:** If domain was registered <60 days ago
- **Pending operations:** Any pending changes must complete first
- **Contact verification:** May require email confirmation

---

## 🔧 **DETAILED TRANSFER STEPS**

### **Phase 1: Pre-Transfer Verification**

#### **Check Current Domain Status:**
```bash
# Check if domain shows in stackpro account
aws route53domains list-domains --region us-east-1 --profile stackpro

# If found, get domain details
aws route53domains get-domain-detail \
    --domain-name stackpro.io \
    --region us-east-1 \
    --profile stackpro

# If not found, check external registration
whois stackpro.io
```

### **Phase 2A: AWS Domain Transfer (If Registered via AWS)**

#### **Initiate Transfer:**
```bash
# From stackpro account
aws route53domains transfer-domain-to-another-aws-account \
    --domain-name stackpro.io \
    --account-id 304052673868 \
    --region us-east-1 \
    --profile stackpro
```

**Expected Response:**
```json
{
    "OperationId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "Password": "transfer-password-here"
}
```

#### **Accept in Stackbox Account:**
```bash
# Use the password from above
aws route53domains accept-domain-transfer-from-another-aws-account \
    --domain-name stackpro.io \
    --password "transfer-password-here" \
    --region us-east-1 \
    --profile Stackbox
```

### **Phase 2B: Hosted Zone Recreation (If External Registration)**

#### **Create New Hosted Zone:**
```bash
# In Stackbox account
aws route53 create-hosted-zone \
    --name stackpro.io \
    --caller-reference stackpro-main-$(date +%s) \
    --profile Stackbox
```

#### **Copy DNS Records:**
```bash
# Export from stackpro account
aws route53 list-resource-record-sets \
    --hosted-zone-id Z09644762VPS77ZYCBQ3E \
    --profile stackpro \
    --query 'ResourceRecordSets[?Type!=`NS` && Type!=`SOA`]' > records-to-copy.json

# Import to Stackbox account (manual process)
# Create change batch file and apply records
```

---

## 🎯 **POST-TRANSFER CONFIGURATION**

### **Update Environment Variables:**
```bash
# Update .env file
DOMAIN_PRIMARY=stackpro.io
AWS_PROFILE=Stackbox
HOSTED_ZONE_ID=[NEW-HOSTED-ZONE-ID]
```

### **Configure DNS Records:**
```bash
# Add your infrastructure records
aws route53 change-resource-record-sets \
    --hosted-zone-id [NEW-HOSTED-ZONE-ID] \
    --change-batch file://infrastructure-records.json \
    --profile Stackbox
```

### **infrastructure-records.json:**
```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "stackpro.io",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "your-stackbox-alb.us-west-2.elb.amazonaws.com",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z1D633PJN98FT9"
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.stackpro.io",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {"Value": "your-api-alb.us-west-2.elb.amazonaws.com"}
        ]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "*.stackpro.io",
        "Type": "CNAME", 
        "TTL": 300,
        "ResourceRecords": [
          {"Value": "your-wildcard-alb.us-west-2.elb.amazonaws.com"}
        ]
      }
    }
  ]
}
```

---

## 🚨 **IMMEDIATE ACTION PLAN**

### **Step 1: Verify Domain Status (Now)**
```bash
# Run this to check domain registration location
aws route53domains list-domains --region us-east-1 --profile stackpro
```

### **Step 2: Choose Transfer Method**
- **If domain found in AWS:** Use AWS-to-AWS transfer
- **If domain not found:** Use hosted zone transfer method

### **Step 3: Execute Transfer**
Follow the appropriate method above based on Step 1 results.

### **Step 4: Update Project Configuration**
- Update AWS profile references
- Update environment variables  
- Test DNS resolution
- Update deployment scripts

---

## ⚠️ **POTENTIAL ISSUES & SOLUTIONS**

### **Issue: 60-Day Transfer Lock**
```bash
# Check domain age
aws route53domains get-domain-detail \
    --domain-name stackpro.io \
    --region us-east-1 \
    --profile stackpro \
    --query 'CreationDate'
```

**Solution:** If <60 days old, use hosted zone transfer instead.

### **Issue: Transfer Authorization**
Some transfers require contact email verification.

**Solution:** Check email for authorization requests.

### **Issue: DNS Downtime**
Brief DNS resolution gaps during transfer.

**Solution:** Use lower TTL values (300s) before transfer.

---

## 💰 **TRANSFER COSTS**

### **AWS-to-AWS Domain Transfer:**
- **Transfer fee:** FREE
- **Domain renewal:** May add 1 year ($45-50)
- **DNS hosting:** ~$0.50/month per zone

### **Hosted Zone Transfer:**
- **New hosted zone:** ~$0.50/month
- **Domain renewal:** No change
- **Total impact:** Minimal

---

## 🎉 **SUCCESS VERIFICATION**

### **Transfer Complete When:**
```bash
# Domain shows in Stackbox account
aws route53domains list-domains --region us-east-1 --profile Stackbox

# Hosted zone exists in Stackbox account
aws route53 list-hosted-zones --profile Stackbox

# Domain resolves correctly
nslookup stackpro.io

# Website loads
curl -I https://stackpro.io
```

---

## 🚀 **NEXT STEPS AFTER TRANSFER**

1. **✅ Verify domain ownership** in Stackbox account
2. **✅ Configure infrastructure DNS** records
3. **✅ Request SSL certificates** via ACM
4. **✅ Update project references** to use Stackbox profile
5. **✅ Test complete website functionality**
6. **✅ Update documentation** with new configuration

## 📞 **READY TO EXECUTE**

**Which verification step would you like to run first?**

```bash
# Check domain registration status
aws route53domains list-domains --region us-east-1 --profile stackpro
```

**This will tell us the exact transfer method to use!** 🎯
