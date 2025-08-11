#!/bin/bash

# Manual Cleanup Commands for Wrong Account Resources
# Account: 564507211043 
# Generated: 2025-08-11T17:49:17.590Z

echo "🧹 Cleaning up resources from wrong account..."
echo "⚠️  WARNING: This will PERMANENTLY DELETE resources!"
read -p "Are you sure you want to proceed? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Cleanup cancelled."
    exit 0
fi


# Clean up Route53 hosted zones
echo "Deleting Route53 hosted zones..."
echo "Deleting hosted zone: sandbox.stackpro.io."
aws route53 delete-hosted-zone --id /hostedzone/Z0102907XGKTL09TFV38
echo "Deleting hosted zone: stackpro.io."
aws route53 delete-hosted-zone --id /hostedzone/Z0293767219852CNS3KMT

# Clean up SES identities
echo "Deleting SES identities..."
echo "Deleting SES identity: stackpro.io"
aws ses delete-identity --identity stackpro.io

# Clean up Lambda functions
echo "Deleting Lambda functions..."
echo "Deleting Lambda function: stackpro-sandbox-tenant-lock"
aws lambda delete-function --function-name stackpro-sandbox-tenant-lock
echo "Deleting Lambda function: stackpro-email-forwarder"
aws lambda delete-function --function-name stackpro-email-forwarder

echo "✅ Cleanup complete!"
echo "🔍 Verify resources are gone:"
echo "   aws route53 list-hosted-zones"
echo "   aws ses list-identities"  
echo "   aws lambda list-functions"
