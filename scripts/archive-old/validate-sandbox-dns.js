#!/usr/bin/env node

/**
 * Phase 2.6A - DNS Validation & Amplify Domain Setup
 * Validates NS delegation and sets up Amplify custom domain
 */

const { Route53Client, GetHostedZoneCommand, ListResourceRecordSetsCommand, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');
const { ACMClient, DescribeCertificateCommand, ListCertificatesCommand } = require('@aws-sdk/client-acm');
const { AmplifyClient, CreateDomainAssociationCommand, GetDomainAssociationCommand } = require('@aws-sdk/client-amplify');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function validateSandboxDNS() {
  console.log('🔍 Phase 2.6A - Validating sandbox.stackpro.io DNS delegation...\n');

  try {
    // Load configuration
    const fs = require('fs');
    if (!fs.existsSync('sandbox-dns-config.json')) {
      console.error('❌ sandbox-dns-config.json not found. Run setup-sandbox-dns.js first.');
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync('sandbox-dns-config.json', 'utf8'));
    console.log('📋 Loaded configuration:');
    console.log(`   Domain: ${config.domainName}`);
    console.log(`   Hosted Zone: ${config.hostedZoneId}`);
    console.log(`   Certificate: ${config.certificateArn}`);

    const route53 = new Route53Client({ region: 'us-west-2' });
    const acm = new ACMClient({ region: 'us-west-2' });

    // Step 1: Validate NS delegation
    console.log('\n1️⃣ Validating NS delegation...');
    
    try {
      const { stdout } = await execAsync('dig +short NS sandbox.stackpro.io');
      const resolvedNS = stdout.trim().split('\n').filter(line => line.length > 0);
      
      if (resolvedNS.length === 0) {
        throw new Error('No NS records resolved for sandbox.stackpro.io');
      }

      console.log('✅ NS delegation working! Resolved NS records:');
      resolvedNS.forEach((ns, i) => console.log(`   ${i + 1}. ${ns}`));

      // Check if they match our expected NS records
      const expectedNS = config.nsRecords.map(ns => ns.endsWith('.') ? ns : ns + '.');
      const resolvedNSSet = new Set(resolvedNS.map(ns => ns.endsWith('.') ? ns : ns + '.'));
      const expectedNSSet = new Set(expectedNS);
      
      const matches = expectedNS.every(ns => resolvedNSSet.has(ns));
      if (matches) {
        console.log('✅ NS records match expected values - delegation successful!');
      } else {
        console.log('⚠️  NS records don\'t match expected values, but delegation is working');
      }

    } catch (error) {
      console.error('❌ NS delegation validation failed:', error.message);
      console.log('\nPlease ensure you have added the NS record to the parent stackpro.io zone:');
      console.log('━━━ NS RECORD NEEDED ━━━');
      console.log(`Name: sandbox.stackpro.io`);
      console.log(`Type: NS`);
      console.log(`Values: ${config.nsRecords.join(', ')}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
      process.exit(1);
    }

    // Step 2: Check certificate status
    console.log('\n2️⃣ Checking ACM certificate status...');
    
    const certCommand = new DescribeCertificateCommand({
      CertificateArn: config.certificateArn
    });
    
    const certResponse = await acm.send(certCommand);
    const certificate = certResponse.Certificate;
    
    console.log(`Certificate Status: ${certificate.Status}`);
    
    if (certificate.Status === 'PENDING_VALIDATION') {
      console.log('⏳ Certificate still pending validation...');
      
      // Add DNS validation records if they don't exist
      const validationOptions = certificate.DomainValidationOptions || [];
      
      for (const validation of validationOptions) {
        if (validation.ValidationStatus === 'PENDING_VALIDATION' && validation.ResourceRecord) {
          console.log(`📝 Adding DNS validation record for ${validation.DomainName}...`);
          
          const changeParams = {
            HostedZoneId: config.hostedZoneId,
            ChangeBatch: {
              Changes: [{
                Action: 'UPSERT',
                ResourceRecordSet: {
                  Name: validation.ResourceRecord.Name,
                  Type: validation.ResourceRecord.Type,
                  TTL: 300,
                  ResourceRecords: [{
                    Value: validation.ResourceRecord.Value
                  }]
                }
              }]
            }
          };

          try {
            await route53.send(new ChangeResourceRecordSetsCommand(changeParams));
            console.log(`✅ DNS validation record added for ${validation.DomainName}`);
          } catch (error) {
            console.log(`⚠️  DNS validation record may already exist for ${validation.DomainName}`);
          }
        }
      }

      console.log('⏳ Waiting for certificate validation... (this may take 5-10 minutes)');
      console.log('🔄 Run this script again in a few minutes to check status');
      
    } else if (certificate.Status === 'ISSUED') {
      console.log('✅ Certificate is issued and ready!');
      
      // Step 3: Set up Amplify domain
      console.log('\n3️⃣ Setting up Amplify custom domain...');
      await setupAmplifyDomain(config);
      
    } else {
      console.log(`❌ Certificate status: ${certificate.Status}`);
      if (certificate.FailureReason) {
        console.log(`Failure reason: ${certificate.FailureReason}`);
      }
    }

    // Step 4: Update configuration
    config.lastValidated = new Date().toISOString();
    config.certificateStatus = certificate.Status;
    config.status = certificate.Status === 'ISSUED' ? 'ready' : 'validating';

    fs.writeFileSync('sandbox-dns-config.json', JSON.stringify(config, null, 2));
    console.log('\n💾 Configuration updated');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

async function setupAmplifyDomain(config) {
  try {
    const amplify = new AmplifyClient({ region: 'us-west-2' });
    
    // Get Amplify app ID from existing config or environment
    const amplifyAppId = process.env.AMPLIFY_APP_ID || 'djvpykzwo8dqs'; // From previous docs
    
    if (!amplifyAppId) {
      console.log('⚠️  AMPLIFY_APP_ID not found - skipping Amplify domain setup');
      console.log('Please set AMPLIFY_APP_ID environment variable and run again');
      return;
    }

    console.log(`Setting up domain for Amplify app: ${amplifyAppId}`);

    // Create domain association
    const domainCommand = new CreateDomainAssociationCommand({
      appId: amplifyAppId,
      domainName: config.domainName,
      certificateSettings: {
        type: 'AMPLIFY_MANAGED',
        certificateVerificationDNSRecord: config.certificateArn
      },
      subDomainSettings: [
        {
          prefix: '',
          branchName: 'main'
        },
        {
          prefix: 'www',
          branchName: 'main'
        }
      ],
      autoSubDomainCreationPatterns: ['*'],
      autoSubDomainIAMRole: 'arn:aws:iam::' + await getAccountId() + ':role/AmplifyServiceRole'
    });

    try {
      const domainResult = await amplify.send(domainCommand);
      console.log('✅ Amplify domain association created');
      console.log(`   Domain ARN: ${domainResult.domainAssociation.domainAssociationArn}`);
      
      // The domain association will provide DNS targets
      const dnsTargets = domainResult.domainAssociation.subDomains || [];
      
      if (dnsTargets.length > 0) {
        console.log('\n📝 DNS Records to create in Route53:');
        dnsTargets.forEach(subdomain => {
          if (subdomain.dnsRecord) {
            console.log(`   ${subdomain.prefix || '@'}: CNAME → ${subdomain.dnsRecord}`);
          }
        });
      }

    } catch (error) {
      if (error.name === 'BadRequestException' && error.message.includes('already exists')) {
        console.log('✅ Amplify domain association already exists');
        
        // Get existing domain association
        const getCommand = new GetDomainAssociationCommand({
          appId: amplifyAppId,
          domainName: config.domainName
        });
        
        const existing = await amplify.send(getCommand);
        console.log(`   Status: ${existing.domainAssociation.domainStatus}`);
        
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Amplify domain setup failed:', error.message);
    console.log('Manual steps may be required in Amplify Console');
  }
}

async function getAccountId() {
  const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
  const sts = new STSClient({ region: 'us-west-2' });
  const result = await sts.send(new GetCallerIdentityCommand({}));
  return result.Account;
}

// Run if called directly
if (require.main === module) {
  validateSandboxDNS().catch(console.error);
}

module.exports = { validateSandboxDNS };
