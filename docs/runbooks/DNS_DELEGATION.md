# DNS Delegation Runbook

## Problem: NS Chain Broken / DNS Resolution Issues

### Quick Diagnosis
```bash
# Run DNS precheck
node scripts/dns-precheck.js

# Check specific domain
nslookup sandbox.stackpro.io
dig NS sandbox.stackpro.io
```

### Common Issues & Fixes

#### 1. Subdomain Not Resolving
**Symptoms**: `ENOTFOUND sandbox.stackpro.io`

**Check**: Verify Route53 hosted zone exists
```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='sandbox.stackpro.io.']"
```

**Fix**: Create subdomain records in parent zone
```bash
# Get subdomain NS records
aws route53 list-resource-record-sets --hosted-zone-id Z0102907XGKTL09TFV38 --query "ResourceRecordSets[?Type=='NS']"

# Add to parent zone (stackpro.io)
aws route53 change-resource-record-sets --hosted-zone-id Z0293767219852CNS3KMT --change-batch file://ns-delegation.json
```

#### 2. Duplicate Hosted Zones
**Symptoms**: Intermittent resolution, conflicting responses

**Check**: Search for duplicate zones
```bash
aws route53 list-hosted-zones --query "HostedZones[?contains(Name, 'stackpro')]"
```

**Fix**: Delete duplicates from wrong accounts
```bash
# Identify correct vs wrong account zones
# Delete duplicates (requires admin permissions)
aws route53 delete-hosted-zone --id /hostedzone/WRONG_ZONE_ID
```

#### 3. DNS Propagation Delays
**Symptoms**: Works from some locations, not others

**Check**: Test from multiple locations
```bash
# Check propagation status
dig @8.8.8.8 sandbox.stackpro.io
dig @1.1.1.1 sandbox.stackpro.io
```

**Fix**: Wait 15-30 minutes, verify TTL settings

### Emergency Contacts
- **Infrastructure Team**: Check #infrastructure Slack
- **DNS Provider**: AWS Route53 Console
- **Domain Registrar**: Domain holder account (788363206718)

### Prevention
- Always use `scripts/dns-precheck.js` before major changes
- Monitor Route53 hosted zones across all accounts
- Set up DNS monitoring alerts
