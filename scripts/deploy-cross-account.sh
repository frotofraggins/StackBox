#!/bin/bash

# StackPro Cross-Account Deployment Script
# Deploys to infrastructure account while keeping Cline connection

echo "🔄 Deploying to Infrastructure Account (304052673868)..."
echo "🔗 Keeping default account (564507211043) for Cline"
echo ""

# Check if infrastructure profile is configured
if ! aws configure list --profile infrastructure >/dev/null 2>&1; then
    echo "❌ Infrastructure profile not configured"
    echo "Run: aws configure --profile infrastructure"
    echo "Account ID: 304052673868"
    echo "Region: us-west-2"
    exit 1
fi

# Verify infrastructure account
echo "📋 Verifying infrastructure account..."
INFRA_ACCOUNT=$(AWS_PROFILE=infrastructure aws sts get-caller-identity --query Account --output text)
if [ "$INFRA_ACCOUNT" != "304052673868" ]; then
    echo "❌ Wrong infrastructure account: $INFRA_ACCOUNT"
    echo "Expected: 304052673868"
    exit 1
fi
echo "✅ Connected to correct infrastructure account: $INFRA_ACCOUNT"

# Deploy sandbox DNS
echo ""
echo "🌐 Creating sandbox.stackpro.io in infrastructure account..."
AWS_PROFILE=infrastructure node scripts/setup-sandbox-dns.js

# Deploy email forwarding
echo ""
echo "📧 Setting up email forwarding in infrastructure account..."
AWS_PROFILE=infrastructure node scripts/setup-sandbox-email-forwarding.js

# Deploy Amplify
echo ""
echo "🚀 Deploying Amplify to infrastructure account..."
AWS_PROFILE=infrastructure node scripts/deploy-amplify-sandbox.js

# Run tests
echo ""
echo "🧪 Running E2E tests..."
node scripts/e2e-test-suite.js

echo ""
echo "✅ Cross-account deployment complete!"
echo "🔗 Cline remains connected to default account for chat continuity"
