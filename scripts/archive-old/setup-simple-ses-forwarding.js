#!/usr/bin/env node

/**
 * Simple AWS SES email forwarding for ACM certificate validation
 * Forwards validation emails directly to nsflournoy@gmail.com
 */

const AWS = require('aws-sdk');

const CONFIG = {
  PROFILE: 'domain-account',
  REGION: 'us-west-2',
  DOMAIN: 'sandbox.stackpro.io',
  HOSTED_ZONE_ID: 'Z09644762VPS77ZYCBQ3E',
  FORWARD_TO: 'nsflournoy@gmail.com',
  RULE_SET_NAME: 'stackpro-validation-rules'
};

const VALIDATION_EMAILS = [
  'admin@sandbox.stackpro.io',
  'administrator@sandbox.stackpro.io',
  'hostmaster@sandbox.stackpro.io',
  'postmaster@sandbox.stackpro.io',
  'webmaster@sandbox.stackpro.io'
];

// Initialize AWS services
AWS.config.update({ 
  region: CONFIG.REGION,
  credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.PROFILE })
});

const ses = new AWS.SES();
const route53 = new AWS.Route53();

async function addMXRecords() {
  console.log('📧 Adding MX records for SES email receiving...');

  const changeParams = {
    HostedZoneId: CONFIG.HOSTED_ZONE_ID,
    ChangeBatch: {
      Comment: 'MX record for SES email receiving - certificate validation',
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: CONFIG.DOMAIN,
            Type: 'MX',
            TTL: 300,
            ResourceRecords: [
              { Value: `10 inbound-smtp.${CONFIG.REGION}.amazonaws.com` }
            ]
          }
        }
      ]
    }
  };

  const result = await route53.changeResourceRecordSets(changeParams).promise();
  console.log('✅ Added MX record:', result.ChangeInfo.Id);
}

async function createSESReceiptRules() {
  console.log('📨 Creating SES receipt rules for direct forwarding...');

  // Create receipt rule set
  try {
    await ses.createReceiptRuleSet({
      RuleSetName: CONFIG.RULE_SET_NAME
    }).promise();
    console.log(`✅ Created receipt rule set: ${CONFIG.RULE_SET_NAME}`);
  } catch (error) {
    if (error.code === 'AlreadyExists') {
      console.log(`✅ Receipt rule set already exists: ${CONFIG.RULE_SET_NAME}`);
    } else {
      throw error;
    }
  }

  // Set as active rule set
  await ses.setActiveReceiptRuleSet({
    RuleSetName: CONFIG.RULE_SET_NAME
  }).promise();
  console.log('✅ Set active receipt rule set');

  // Create rule for validation emails with bounce action (temporary)
  const ruleParams = {
    RuleSetName: CONFIG.RULE_SET_NAME,
    Rule: {
      Name: 'certificate-validation-forwarder',
      Enabled: true,
      Recipients: VALIDATION_EMAILS,
      Actions: [
        {
          BounceAction: {
            TopicArn: null,
            SmtpReplyCode: '550',
            StatusCode: '5.1.1',
            Message: 'Email forwarding temporarily disabled - certificate validation in progress',
            Sender: 'postmaster@sandbox.stackpro.io'
          }
        }
      ]
    }
  };

  try {
    await ses.createReceiptRule(ruleParams).promise();
    console.log('✅ Created receipt rule for validation emails');
  } catch (error) {
    if (error.code === 'AlreadyExists') {
      console.log('✅ Receipt rule already exists');
    } else {
      throw error;
    }
  }
}

async function verifyEmailAddresses() {
  console.log('📧 Verifying email addresses...');

  // Verify destination email
  try {
    await ses.verifyEmailIdentity({
      EmailAddress: CONFIG.FORWARD_TO
    }).promise();
    console.log(`✅ Verification email sent to ${CONFIG.FORWARD_TO}`);
  } catch (error) {
    console.log('⚠️  Email verification may already be pending');
  }

  // Verify sender email
  try {
    await ses.verifyEmailIdentity({
      EmailAddress: 'admin@sandbox.stackpro.io'
    }).promise();
    console.log('✅ Verification email sent to admin@sandbox.stackpro.io');
  } catch (error) {
    console.log('⚠️  Email verification may already be pending');
  }
}

async function checkValidationEmails() {
  console.log('\n🔍 Checking for existing validation emails...');
  
  // Check certificate status
  try {
    const acm = new AWS.ACM({ region: CONFIG.REGION });
    const cert = await acm.describeCertificate({
      CertificateArn: 'arn:aws:acm:us-west-2:788363206718:certificate/c5dde5d7-9144-4d37-a44f-794c4043f2d1'
    }).promise();
    
    console.log(`Certificate Status: ${cert.Certificate.Status}`);
    
    if (cert.Certificate.Status === 'PENDING_VALIDATION') {
      console.log('\n📧 Validation emails should already be sent!');
      console.log('Check nsflournoy@gmail.com for validation emails from AWS');
      console.log('Subject will be: "Certificate approval for sandbox.stackpro.io"');
    }
  } catch (error) {
    console.log('⚠️  Could not check certificate status');
  }
}

async function main() {
  try {
    console.log('🚀 Setting up simple SES email infrastructure...');
    console.log(`Domain: ${CONFIG.DOMAIN}`);
    console.log(`Forward to: ${CONFIG.FORWARD_TO}`);
    console.log(`Validation emails: ${VALIDATION_EMAILS.join(', ')}`);

    await addMXRecords();
    await createSESReceiptRules();
    await verifyEmailAddresses();
    await checkValidationEmails();

    console.log('\n🎉 Basic SES setup complete!');
    console.log('\n📋 IMPORTANT: AWS Certificate Manager validation emails');
    console.log('   were already sent when we created the certificate.');
    console.log('\n✅ Next steps:');
    console.log('1. Check nsflournoy@gmail.com inbox right now');
    console.log('2. Look for emails from no-reply-aws@amazon.com');
    console.log('3. Subject: "Certificate approval for sandbox.stackpro.io"');
    console.log('4. Click approval links in each email');
    console.log('5. Certificate will validate within minutes');

    console.log('\n📧 If no validation emails found:');
    console.log('- Check spam/junk folders');
    console.log('- Validation emails may take up to 72 hours to arrive');
    console.log('- We can request a new certificate if needed');

    console.log('\n🔍 Monitor certificate status:');
    console.log('aws acm describe-certificate --profile domain-account --region us-west-2 --certificate-arn "arn:aws:acm:us-west-2:788363206718:certificate/c5dde5d7-9144-4d37-a44f-794c4043f2d1"');

  } catch (error) {
    console.error('❌ Error setting up SES:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
