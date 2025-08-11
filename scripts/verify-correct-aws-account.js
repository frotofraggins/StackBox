#!/usr/bin/env node

/**
 * AWS Account Verification Script
 * Ensures we're connected to the correct AWS account before any deployments
 */

const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const fs = require('fs');
const path = require('path');

// Load account configuration
const accountConfig = JSON.parse(fs.readFileSync('config/aws-accounts.json', 'utf8'));

async function verifyAccount() {
  console.log('🔍 Verifying AWS Account Configuration...\n');

  try {
    // Get current AWS account
    const sts = new STSClient({ region: 'us-west-2' });
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    
    const currentAccountId = identity.Account;
    const currentUser = identity.Arn;
    
    console.log('📋 Current AWS Identity:');
    console.log(`   Account ID: ${currentAccountId}`);
    console.log(`   User ARN: ${currentUser}`);
    console.log(`   User ID: ${identity.UserId}\n`);

    // Check against authorized accounts
    const targetAccount = accountConfig.authorizedAccounts['target-infrastructure'];
    const domainAccount = accountConfig.authorizedAccounts['domain-holder'];
    const wrongAccount = accountConfig.authorizedAccounts['WRONG-ACCOUNT'];

    let status = 'UNKNOWN';
    let recommendation = '';

    if (currentAccountId === targetAccount.accountId) {
      status = '✅ CORRECT - Infrastructure Account';
      recommendation = 'Perfect! This is the correct account for all deployments.';
    } else if (currentAccountId === domainAccount.accountId) {
      status = '⚠️  DOMAIN HOLDER - Use for domain transfer only';
      recommendation = 'This account holds the stackpro.io domain. Use only for domain transfer operations.';
    } else if (currentAccountId === wrongAccount.accountId) {
      status = '❌ WRONG ACCOUNT - DO NOT DEPLOY';
      recommendation = 'This is the WRONG account. Switch to infrastructure account immediately.';
    } else {
      status = '❓ UNKNOWN ACCOUNT';
      recommendation = 'This account is not in our authorized list. Please verify.';
    }

    console.log('🎯 Account Status:', status);
    console.log('💡 Recommendation:', recommendation);
    console.log();

    // Display account mapping
    console.log('📊 Account Mapping:');
    console.log(`   🏠 Domain Holder: ${domainAccount.accountId} (${domainAccount.alias})`);
    console.log(`   🎯 Infrastructure: ${targetAccount.accountId} (${targetAccount.alias})`);
    console.log(`   ❌ Wrong Account: ${wrongAccount.accountId} (${wrongAccount.alias})`);
    console.log();

    // Check if we're in wrong account
    if (currentAccountId === wrongAccount.accountId) {
      console.log('🚨 CRITICAL WARNING:');
      console.log('   You are connected to the WRONG AWS account!');
      console.log('   Resources were incorrectly deployed here.');
      console.log();
      console.log('🔧 Required Actions:');
      console.log('   1. Switch to infrastructure account: 304052673868');
      console.log('   2. Clean up resources from wrong account');
      console.log('   3. Re-deploy everything to correct account');
      console.log();
      console.log('📝 Switch Commands:');
      console.log('   aws configure set profile.infrastructure.account_id 304052673868');
      console.log('   aws configure --profile infrastructure');
      console.log('   export AWS_PROFILE=infrastructure');
      console.log();
      return false;
    }

    // Check if we're in correct account
    if (currentAccountId === targetAccount.accountId) {
      console.log('🎉 Ready for deployments!');
      console.log('   All infrastructure should be deployed to this account.');
      console.log();
      return true;
    }

    // Domain holder account
    if (currentAccountId === domainAccount.accountId) {
      console.log('📧 Domain Transfer Mode');
      console.log('   Use this account only for domain transfer operations.');
      console.log('   Switch to infrastructure account for deployments.');
      console.log();
      return 'domain-mode';
    }

    console.log('❓ Account not recognized. Please verify configuration.');
    return false;

  } catch (error) {
    console.error('❌ Failed to verify AWS account:', error.message);
    console.log();
    console.log('🔧 Troubleshooting:');
    console.log('   1. Ensure AWS CLI is configured: aws configure');
    console.log('   2. Check credentials: aws sts get-caller-identity');
    console.log('   3. Verify permissions: aws iam get-user');
    return false;
  }
}

// Export for use in other scripts
async function enforceCorrectAccount() {
  const result = await verifyAccount();
  
  if (result !== true) {
    console.log('🛑 Stopping execution - wrong AWS account');
    process.exit(1);
  }
  
  return true;
}

// Run if called directly
if (require.main === module) {
  verifyAccount().then(result => {
    if (result === true) {
      console.log('✅ Account verification passed');
      process.exit(0);
    } else {
      console.log('❌ Account verification failed');
      process.exit(1);
    }
  }).catch(console.error);
}

module.exports = { verifyAccount, enforceCorrectAccount };
