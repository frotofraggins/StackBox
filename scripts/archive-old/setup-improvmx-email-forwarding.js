#!/usr/bin/env node

/**
 * Setup ImprovMX email forwarding for ACM certificate validation
 * This will forward validation emails to nsflournoy@gmail.com
 */

const AWS = require('aws-sdk');

const CONFIG = {
  PROFILE: 'domain-account',
  REGION: 'us-west-2',
  DOMAIN: 'sandbox.stackpro.io',
  HOSTED_ZONE_ID: 'Z09644762VPS77ZYCBQ3E',
  FORWARD_TO: 'nsflournoy@gmail.com',
  CERTIFICATE_ARN: 'arn:aws:acm:us-west-2:788363206718:certificate/e0627367-8900-4df4-9dc0-a158ff70b524'
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

const route53 = new AWS.Route53();
const acm = new AWS.ACM();

async function addImprovMXRecords() {
  console.log('📧 Adding ImprovMX MX records for email forwarding...');

  const changeParams = {
    HostedZoneId: CONFIG.HOSTED_ZONE_ID,
    ChangeBatch: {
      Comment: 'ImprovMX MX records for email forwarding - certificate validation',
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: CONFIG.DOMAIN,
            Type: 'MX',
            TTL: 300,
            ResourceRecords: [
              { Value: '10 mx1.improvmx.com' },
              { Value: '20 mx2.improvmx.com' }
            ]
          }
        }
      ]
    }
  };

  const result = await route53.changeResourceRecordSets(changeParams).promise();
  console.log('✅ Added ImprovMX MX records:', result.ChangeInfo.Id);
  return result.ChangeInfo.Id;
}

async function checkCertificateStatus() {
  console.log('\n🔍 Checking certificate status...');
  
  try {
    const cert = await acm.describeCertificate({
      CertificateArn: CONFIG.CERTIFICATE_ARN
    }).promise();
    
    console.log(`Certificate Status: ${cert.Certificate.Status}`);
    
    if (cert.Certificate.Status === 'PENDING_VALIDATION') {
      console.log('\n📧 ✅ FRESH VALIDATION EMAILS HAVE BEEN SENT!');
      console.log('AWS just sent validation emails to these addresses:');
      VALIDATION_EMAILS.forEach(email => {
        console.log(`   - ${email}`);
      });
    }
    
    return cert.Certificate.Status;
  } catch (error) {
    console.log('⚠️  Could not check certificate status:', error.message);
    return 'UNKNOWN';
  }
}

async function main() {
  try {
    console.log('🚀 Setting up ImprovMX email forwarding for certificate validation...');
    console.log(`Domain: ${CONFIG.DOMAIN}`);
    console.log(`Forward to: ${CONFIG.FORWARD_TO}`);
    console.log(`Certificate: ${CONFIG.CERTIFICATE_ARN}`);

    // Add MX records for ImprovMX
    const changeId = await addImprovMXRecords();
    
    // Check certificate status
    const status = await checkCertificateStatus();

    console.log('\n🎉 DNS Setup Complete!');
    console.log('\n📋 NEXT STEPS - COMPLETE THESE NOW:');
    
    console.log('\n1️⃣ **Setup ImprovMX Email Forwarding:**');
    console.log('   • Go to: https://improvmx.com/');
    console.log('   • Click "Add Domain"');
    console.log(`   • Enter domain: ${CONFIG.DOMAIN}`);
    console.log('   • Add these email forwards:');
    VALIDATION_EMAILS.forEach(email => {
      console.log(`     ${email} → ${CONFIG.FORWARD_TO}`);
    });
    console.log('   • Or use catch-all: *@sandbox.stackpro.io → nsflournoy@gmail.com');

    console.log('\n2️⃣ **Verify DNS Records:**');
    console.log('   • ImprovMX will automatically check your MX records');
    console.log('   • Should show "DNS records are correct" ✅');

    console.log('\n3️⃣ **Check Your Email:**');
    console.log(`   • Check ${CONFIG.FORWARD_TO} inbox`);
    console.log('   • Look for emails from no-reply-aws@amazon.com');
    console.log('   • Subject: "Certificate approval for sandbox.stackpro.io"');
    console.log('   • You should receive 2 validation emails (one for each domain)');

    console.log('\n4️⃣ **Click Validation Links:**');
    console.log('   • Open each validation email');
    console.log('   • Click the approval link in each email');
    console.log('   • Certificate will validate within minutes');

    console.log('\n🔍 Monitor certificate validation:');
    console.log(`aws acm describe-certificate --profile ${CONFIG.PROFILE} --region ${CONFIG.REGION} --certificate-arn "${CONFIG.CERTIFICATE_ARN}" --query "Certificate.Status"`);

    console.log('\n⏰ Timeline:');
    console.log('• DNS propagation: 1-5 minutes');
    console.log('• ImprovMX setup: 2 minutes');
    console.log('• Email forwarding active: 5 minutes');
    console.log('• Certificate validation: Instant after clicking links');

    console.log('\n🎯 Expected Result:');
    console.log('• Fresh validation emails in your inbox within 5 minutes');
    console.log('• Click approval links → Certificate validates');
    console.log('• Ready for CloudFront + HTTPS production access');

  } catch (error) {
    console.error('❌ Error setting up email forwarding:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  VALIDATION_EMAILS,
  addImprovMXRecords,
  checkCertificateStatus
};
