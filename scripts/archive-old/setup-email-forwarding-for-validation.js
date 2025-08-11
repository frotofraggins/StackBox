#!/usr/bin/env node

const { SESv2Client, CreateConfigurationSetCommand, CreateDeliveryOptionsCommand } = require('@aws-sdk/client-sesv2');
const { Route53Client, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route53');
const { LambdaClient, CreateFunctionCommand, AddPermissionCommand } = require('@aws-sdk/client-lambda');
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand } = require('@aws-sdk/client-iam');

/**
 * Setup email forwarding for ACM certificate validation
 * This will forward validation emails from AWS to your personal email
 */

const CONFIG = {
  DOMAIN: 'sandbox.stackpro.io',
  HOSTED_ZONE_ID: 'Z09644762VPS77ZYCBQ3E',
  FORWARD_TO_EMAIL: process.env.FORWARD_TO_EMAIL || 'your-email@gmail.com', // Replace with your email
  AWS_PROFILE: 'domain-account',
  AWS_REGION: 'us-west-2'
};

const VALIDATION_EMAILS = [
  'admin@sandbox.stackpro.io',
  'administrator@sandbox.stackpro.io', 
  'hostmaster@sandbox.stackpro.io',
  'postmaster@sandbox.stackpro.io',
  'webmaster@sandbox.stackpro.io'
];

console.log('🚀 Setting up email forwarding for ACM certificate validation...');
console.log(`Domain: ${CONFIG.DOMAIN}`);
console.log(`Forward to: ${CONFIG.FORWARD_TO_EMAIL}`);

async function setupEmailForwarding() {
  try {
    // Step 1: Add MX record for email receiving
    console.log('\n📧 Step 1: Adding MX record for email receiving...');
    
    const route53 = new Route53Client({ 
      region: CONFIG.AWS_REGION,
      credentials: {
        profile: CONFIG.AWS_PROFILE
      }
    });

    const mxRecord = {
      Comment: 'MX record for SES email receiving - ACM validation',
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: CONFIG.DOMAIN,
            Type: 'MX',
            TTL: 300,
            ResourceRecords: [
              { Value: '10 inbound-smtp.us-west-2.amazonaws.com' }
            ]
          }
        }
      ]
    };

    const mxResponse = await route53.send(new ChangeResourceRecordSetsCommand({
      HostedZoneId: CONFIG.HOSTED_ZONE_ID,
      ChangeBatch: mxRecord
    }));

    console.log('✅ MX record added:', mxResponse.ChangeInfo.Id);

    // Step 2: Create SES configuration
    console.log('\n📨 Step 2: Setting up SES email receiving...');
    
    const ses = new SESv2Client({ 
      region: CONFIG.AWS_REGION,
      credentials: {
        profile: CONFIG.AWS_PROFILE
      }
    });

    // Note: SES email receiving setup requires additional manual steps
    console.log('\n⚠️  MANUAL STEPS REQUIRED:');
    console.log('\n1. Go to AWS SES Console → Email receiving');
    console.log('2. Add rule set for domain:', CONFIG.DOMAIN);
    console.log('3. Create forwarding rules for validation emails:');
    
    VALIDATION_EMAILS.forEach(email => {
      console.log(`   - Forward ${email} → ${CONFIG.FORWARD_TO_EMAIL}`);
    });

    console.log('\n4. Or use the simpler approach below...');

  } catch (error) {
    console.error('❌ Error setting up email forwarding:', error);
  }
}

// Simpler approach: Use a mail service like ImprovMX
function showSimpleEmailForwardingSetup() {
  console.log('\n🎯 RECOMMENDED: Simple Email Forwarding Setup');
  console.log('\nOption 1: Use ImprovMX (Free)');
  console.log('1. Go to https://improvmx.com/');
  console.log('2. Add domain:', CONFIG.DOMAIN);
  console.log('3. Set up forwarding rules:');
  
  VALIDATION_EMAILS.forEach(email => {
    console.log(`   - ${email} → ${CONFIG.FORWARD_TO_EMAIL}`);
  });

  console.log('\n4. Add these DNS records:');
  console.log(`   MX Record: ${CONFIG.DOMAIN} → mx1.improvmx.com (Priority: 10)`);
  console.log(`   MX Record: ${CONFIG.DOMAIN} → mx2.improvmx.com (Priority: 20)`);

  console.log('\nOption 2: Use your domain registrar\'s email forwarding');
  console.log('1. Log into your domain registrar (GoDaddy, Namecheap, etc.)');
  console.log('2. Find "Email Forwarding" or "Email Aliases"');
  console.log('3. Set up forwarding for validation emails');

  console.log('\nOption 3: Manual DNS + AWS SES');
  console.log('- More complex but free with AWS');
  console.log('- Requires Lambda function for forwarding');
  console.log('- See setup-lambda-email-forwarder.js for details');
}

async function checkCertificateStatus() {
  console.log('\n📋 Certificate Status Check');
  console.log('\nEmail validation certificate:');
  console.log('ARN: arn:aws:acm:us-west-2:788363206718:certificate/c5dde5d7-9144-4d37-a44f-794c4043f2d1');
  
  console.log('\nOnce email forwarding is set up:');
  console.log('1. Check your email for validation messages');
  console.log('2. Click the validation links in each email');
  console.log('3. Certificate will be issued within minutes');
}

async function main() {
  if (!CONFIG.FORWARD_TO_EMAIL || CONFIG.FORWARD_TO_EMAIL === 'your-email@gmail.com') {
    console.log('❌ Please set FORWARD_TO_EMAIL environment variable');
    console.log('Example: FORWARD_TO_EMAIL=you@gmail.com node setup-email-forwarding-for-validation.js');
    return;
  }

  await setupEmailForwarding();
  showSimpleEmailForwardingSetup();
  await checkCertificateStatus();

  console.log('\n🎉 Email forwarding setup guide complete!');
  console.log('\nNext steps:');
  console.log('1. Set up email forwarding using one of the options above');
  console.log('2. Wait for validation emails (should arrive within 5 minutes)');
  console.log('3. Click validation links to approve certificate');
  console.log('4. Certificate will be issued and ready for CloudFront');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupEmailForwarding,
  showSimpleEmailForwardingSetup,
  checkCertificateStatus,
  CONFIG,
  VALIDATION_EMAILS
};
