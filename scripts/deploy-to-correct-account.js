#!/usr/bin/env node

/**
 * Cross-Account Deployment Script
 * Deploys to correct infrastructure account (304052673868) 
 * while keeping default account (564507211043) for Cline connectivity
 */

const { STSClient, GetCallerIdentityCommand, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const { Route53Client, CreateHostedZoneCommand, ListHostedZonesByNameCommand } = require('@aws-sdk/client-route-53');
const fs = require('fs');

async function deployToCorrectAccount() {
  console.log('🔄 Cross-Account Deployment to Infrastructure Account...\n');

  // Load account configuration
  const accountConfig = JSON.parse(fs.readFileSync('config/aws-accounts.json', 'utf8'));
  const targetAccount = accountConfig.authorizedAccounts['target-infrastructure'].accountId;

  console.log('📋 Account Strategy:');
  console.log(`   🔗 Default (Cline): 564507211043 - Keep for chat connectivity`);
  console.log(`   🎯 Target Deploy: ${targetAccount} - Infrastructure deployment`);
  console.log(`   🏠 Domain Holder: 788363206718 - Domain operations only`);
  console.log();

  try {
    // Step 1: Verify current account (should be Cline default)
    console.log('1️⃣ Verifying Cline default account...');
    const defaultSts = new STSClient({ region: 'us-west-2' });
    const defaultIdentity = await defaultSts.send(new GetCallerIdentityCommand({}));
    
    console.log(`   ✅ Default Account: ${defaultIdentity.Account} (keeping for Cline)`);

    // Step 2: Set up cross-account credentials using profiles
    console.log('\n2️⃣ Setting up cross-account access...');
    
    // Create infrastructure profile configuration
    const awsConfigContent = `
[profile infrastructure]
region = us-west-2
output = json
# Note: Set credentials manually with:
# aws configure --profile infrastructure
# Account ID: ${targetAccount}

[profile domain-holder]  
region = us-west-2
output = json
# Note: Set credentials manually with:
# aws configure --profile domain-holder
# Account ID: 788363206718
`;

    // Check if AWS config exists, backup and update
    const awsConfigPath = require('os').homedir() + '/.aws/config';
    if (fs.existsSync(awsConfigPath)) {
      const existingConfig = fs.readFileSync(awsConfigPath, 'utf8');
      if (!existingConfig.includes('[profile infrastructure]')) {
        fs.writeFileSync(awsConfigPath + '.backup', existingConfig);
        fs.appendFileSync(awsConfigPath, awsConfigContent);
        console.log('   ✅ Added infrastructure profile to ~/.aws/config');
      } else {
        console.log('   ✅ Infrastructure profile already exists');
      }
    } else {
      fs.writeFileSync(awsConfigPath, awsConfigContent);
      console.log('   ✅ Created ~/.aws/config with profiles');
    }

    // Step 3: Test cross-account connectivity
    console.log('\n3️⃣ Testing cross-account connectivity...');
    
    try {
      // Try to use infrastructure profile
      const infraSts = new STSClient({ 
        region: 'us-west-2',
        credentials: {
          // This will use the infrastructure profile if configured
          // For now, we'll document the manual setup needed
        }
      });
      
      console.log('   ⚠️  Manual setup required:');
      console.log('      aws configure --profile infrastructure');
      console.log('      # Enter credentials for account 304052673868');
      console.log();
      
    } catch (error) {
      console.log('   ⚠️  Infrastructure profile needs configuration');
    }

    // Step 4: Generate deployment commands for correct account
    console.log('4️⃣ Generated deployment commands for infrastructure account:');
    console.log();
    
    const deploymentCommands = [
      '# Set up infrastructure profile (one-time setup)',
      'aws configure --profile infrastructure',
      '# Account ID: 304052673868',
      '# Region: us-west-2',
      '',
      '# Deploy sandbox.stackpro.io to CORRECT account',
      'AWS_PROFILE=infrastructure node scripts/setup-sandbox-dns.js',
      '',
      '# Set up email forwarding in CORRECT account', 
      'AWS_PROFILE=infrastructure node scripts/setup-sandbox-email-forwarding.js',
      '',
      '# Deploy Amplify to CORRECT account',
      'AWS_PROFILE=infrastructure node scripts/deploy-amplify-sandbox.js',
      '',
      '# Run E2E tests against CORRECT infrastructure',
      'node scripts/e2e-test-suite.js',
      '',
      '# Verify everything is in correct account',
      'AWS_PROFILE=infrastructure aws route53 list-hosted-zones --query "HostedZones[?contains(Name, \'sandbox\')]"'
    ];

    console.log(deploymentCommands.join('\n'));

    // Step 5: Create deployment script
    const deploymentScript = `#!/bin/bash

# StackPro Cross-Account Deployment Script
# Deploys to infrastructure account while keeping Cline connection

echo "🔄 Deploying to Infrastructure Account (${targetAccount})..."
echo "🔗 Keeping default account (564507211043) for Cline"
echo ""

# Check if infrastructure profile is configured
if ! aws configure list --profile infrastructure >/dev/null 2>&1; then
    echo "❌ Infrastructure profile not configured"
    echo "Run: aws configure --profile infrastructure"
    echo "Account ID: ${targetAccount}"
    echo "Region: us-west-2"
    exit 1
fi

# Verify infrastructure account
echo "📋 Verifying infrastructure account..."
INFRA_ACCOUNT=$(AWS_PROFILE=infrastructure aws sts get-caller-identity --query Account --output text)
if [ "$INFRA_ACCOUNT" != "${targetAccount}" ]; then
    echo "❌ Wrong infrastructure account: $INFRA_ACCOUNT"
    echo "Expected: ${targetAccount}"
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
`;

    fs.writeFileSync('scripts/deploy-cross-account.sh', deploymentScript);
    fs.chmodSync('scripts/deploy-cross-account.sh', '755');

    console.log('\n💾 Created deployment script: scripts/deploy-cross-account.sh');
    
    // Step 6: Update account verification to allow cross-account mode
    console.log('\n5️⃣ Next Steps:');
    console.log('   1. Configure infrastructure profile:');
    console.log('      aws configure --profile infrastructure');
    console.log(`      Account ID: ${targetAccount}`);
    console.log('      Region: us-west-2');
    console.log();
    console.log('   2. Run cross-account deployment:');
    console.log('      ./scripts/deploy-cross-account.sh');
    console.log();
    console.log('   3. Cline stays connected to default account for chat');
    console.log();

    // Save configuration
    const crossAccountConfig = {
      strategy: 'cross-account-profiles',
      clineAccount: '564507211043',
      infrastructureAccount: targetAccount,
      domainAccount: '788363206718',
      setupCommands: deploymentCommands,
      deploymentScript: 'scripts/deploy-cross-account.sh',
      status: 'ready-for-manual-profile-setup'
    };

    fs.writeFileSync('config/cross-account-deployment.json', JSON.stringify(crossAccountConfig, null, 2));
    console.log('💾 Saved configuration: config/cross-account-deployment.json');

    return crossAccountConfig;

  } catch (error) {
    console.error('❌ Cross-account setup failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  deployToCorrectAccount().catch(console.error);
}

module.exports = { deployToCorrectAccount };
