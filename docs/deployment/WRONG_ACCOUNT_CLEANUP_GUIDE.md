# Wrong Account Cleanup Guide 🧹

## 🎯 **Purpose**
Clean up resources incorrectly deployed to account `564507211043` to prevent future confusion and ensure all infrastructure exists only in the correct target account `304052673868`.

## ⚠️ **CRITICAL**: This Will Delete Resources Permanently

**What This Does**: Removes ALL StackPro resources from the wrong AWS account  
**Why**: Prevents confusion, reduces costs, ensures single-source-of-truth infrastructure  
**Risk**: Resources will be permanently deleted from wrong account  

## 📋 **Known Resources to Clean Up**

Based on our analysis, these resources exist in the wrong account (`564507211043`):

### 1. Route53 Hosted Zone ✅ CONFIRMED
```
Domain: sandbox.stackpro.io
Zone ID: Z03003622XXIRS6PI6W6W  
Comment: "StackPro Sandbox - Cross-account subdomain delegation"
Records: 2 (likely NS and SOA)
```

### 2. Potential SES Identities (Unknown)
- May include email addresses or domains related to stackpro.io
- Used for SSL certificate validation

### 3. Potential Lambda Functions (Unknown)  
- May include email forwarding functions
- Functions named like "stackpro-*" or "*email-forwarder*"

## 🚀 **Manual Cleanup Process**

### Step 1: Connect to Wrong Account
```bash
# Ensure you're connected to the wrong account (564507211043)
aws sts get-caller-identity
# Should show: "Account": "564507211043"

# If not, you may need to switch profiles or configure credentials
```

### Step 2: Audit Resources Before Deletion
```bash
echo "🔍 Auditing resources in wrong account before deletion..."

# List Route53 hosted zones
echo "Route53 Hosted Zones:"
aws route53 list-hosted-zones --query "HostedZones[?contains(Name, 'stackpro')]"

# List SES identities  
echo "SES Identities:"
aws ses list-identities --query "Identities[?contains(@, 'stackpro')]"

# List Lambda functions
echo "Lambda Functions:"  
aws lambda list-functions --query "Functions[?contains(FunctionName, 'stackpro') || contains(FunctionName, 'email')]"

# Save audit results
aws route53 list-hosted-zones > wrong-account-audit-route53.json
aws ses list-identities > wrong-account-audit-ses.json  
aws lambda list-functions > wrong-account-audit-lambda.json
```

### Step 3: Delete Resources (⚠️ PERMANENT)
```bash
echo "🗑️ DELETING resources from wrong account..."
echo "⚠️ This is PERMANENT and cannot be undone!"
read -p "Type 'DELETE-PERMANENTLY' to confirm: " confirm
if [[ "$confirm" != "DELETE-PERMANENTLY" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Delete Route53 hosted zone (CONFIRMED TO EXIST)
echo "Deleting Route53 hosted zone: sandbox.stackpro.io"
aws route53 delete-hosted-zone --id Z03003622XXIRS6PI6W6W

# Delete any SES identities (if they exist)
echo "Checking for SES identities to delete..."
aws ses list-identities --output text | grep stackpro | while read identity; do
    echo "Deleting SES identity: $identity"
    aws ses delete-identity --identity "$identity"
done

# Delete any Lambda functions (if they exist)  
echo "Checking for Lambda functions to delete..."
aws lambda list-functions --query "Functions[?contains(FunctionName, 'stackpro') || contains(FunctionName, 'email')].FunctionName" --output text | tr '\t' '\n' | while read func; do
    if [[ -n "$func" ]]; then
        echo "Deleting Lambda function: $func"
        aws lambda delete-function --function-name "$func"
    fi
done
```

### Step 4: Verification
```bash
echo "✅ Verifying cleanup completed..."

# Verify Route53 zone is gone
echo "Remaining Route53 zones:"
aws route53 list-hosted-zones --query "HostedZones[?contains(Name, 'stackpro')]"

# Verify SES identities are gone  
echo "Remaining SES identities:"
aws ses list-identities --query "Identities[?contains(@, 'stackpro')]"

# Verify Lambda functions are gone
echo "Remaining Lambda functions:"
aws lambda list-functions --query "Functions[?contains(FunctionName, 'stackpro') || contains(FunctionName, 'email')]"

echo "🎉 Wrong account cleanup complete!"
```

## 📊 **Cost Impact**

**Savings After Cleanup**:
- Route53 Hosted Zone: ~$0.50/month per zone
- SES: No charge for identities, but prevents accidental usage
- Lambda: No charge if unused, prevents accidental invocations

**Total Monthly Savings**: ~$0.50-$2.00 (small but prevents confusion)

## 🔄 **After Cleanup: Next Steps**

Once wrong account resources are deleted:

1. **Deploy to Correct Account**:
   ```bash
   # Switch to infrastructure account (304052673868)
   AWS_PROFILE=infrastructure aws sts get-caller-identity
   
   # Deploy everything to correct account
   ./scripts/deploy-cross-account.sh
   ```

2. **Verify E2E Tests Pass**:
   ```bash
   # Should now pass since infrastructure is in correct account
   node scripts/e2e-test-suite.js
   ```

3. **Update Documentation**:
   - Update any references to old hosted zone ID
   - Confirm all scripts point to correct account

## 🛡️ **Safety Notes**

- **Backup Important Data**: If any of these resources contain important data, export it first
- **DNS Propagation**: After deleting Route53 zones, DNS changes may take 24-48 hours to fully propagate
- **No Rollback**: Once deleted, resources cannot be recovered from AWS
- **Test in Correct Account**: Ensure the infrastructure deployment to the correct account works before cleanup

## 📞 **If Something Goes Wrong**

1. **Resources Still Exist**: Re-run the deletion commands
2. **DNS Still Resolves**: Wait 24-48 hours for DNS propagation  
3. **Can't Access Account**: Verify AWS credentials and permissions
4. **Unsure About Resource**: Don't delete it - document it instead

---

**Ready to proceed?** Follow the steps above to clean up the wrong account and prevent future confusion! 🚀
