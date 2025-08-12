#!/usr/bin/env node

const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

const TARGET_ACCOUNT_ID = '304052673868';

async function checkAwsAccount() {
  try {
    console.log('🔎 Checking AWS account identity...');
    
    const stsClient = new STSClient({});
    const command = new GetCallerIdentityCommand({});
    const response = await stsClient.send(command);
    
    const { Account: accountId, Arn: arn } = response;
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';
    
    console.log(`Current AWS Account: ${accountId}`);
    console.log(`Current AWS Region: ${region}`);
    console.log(`Current AWS Role: ${arn}`);
    
    if (accountId !== TARGET_ACCOUNT_ID) {
      console.error(`❌ ACCOUNT MISMATCH!`);
      console.error(`Expected account: ${TARGET_ACCOUNT_ID} (Infrastructure Account)`);
      console.error(`Current account: ${accountId}`);
      console.error(`This deployment is BLOCKED for security.`);
      console.error(`Please ensure you're deploying to the correct AWS account.`);
      process.exit(2);
    }
    
    // Also check environment variable if set
    const envGuard = process.env.ACCOUNT_GUARD;
    if (envGuard && envGuard !== accountId) {
      console.error(`❌ ACCOUNT_GUARD MISMATCH!`);
      console.error(`ACCOUNT_GUARD env var: ${envGuard}`);
      console.error(`Current account: ${accountId}`);
      process.exit(2);
    }
    
    console.log(`✅ AWS Account verified: ${accountId} (Infrastructure Account)`);
    console.log(`✅ Deployment authorized to proceed`);
    
  } catch (error) {
    console.error('❌ Failed to verify AWS account:', error.message);
    console.error('This could indicate missing AWS credentials or permissions.');
    process.exit(2);
  }
}

checkAwsAccount();
