#!/usr/bin/env node

/**
 * Phase 2.6A - Cross-Account DNS Setup
 * Creates Route53 hosted zone for sandbox.stackpro.io in TARGET account
 * Requests ACM certificate with DNS validation
 */

const { Route53Client, CreateHostedZoneCommand, ListHostedZonesByNameCommand } = require('@aws-sdk/client-route-53');
const { ACMClient, RequestCertificateCommand, DescribeCertificateCommand } = require('@aws-sdk/client-acm');

async function setupSandboxDNS() {
  console.log('🌐 Phase 2.6A - Setting up sandbox.stackpro.io DNS delegation...\n');

  const route53 = new Route53Client({ region: 'us-west-2' });
  const acm = new ACMClient({ region: 'us-west-2' });

  try {
    // Step 1: Check if hosted zone already exists
    console.log('1️⃣ Checking for existing sandbox.stackpro.io hosted zone...');
    
    const listCommand = new ListHostedZonesByNameCommand({
      DNSName: 'sandbox.stackpro.io'
    });
    
    const existingZones = await route53.send(listCommand);
    let hostedZone = null;
    
    if (existingZones.HostedZones?.length > 0) {
      const existing = existingZones.HostedZones.find(z => z.Name === 'sandbox.stackpro.io.');
      if (existing) {
        console.log(`✅ Found existing hosted zone: ${existing.Id}`);
        hostedZone = existing;
      }
    }

    // Step 2: Create hosted zone if needed
    if (!hostedZone) {
      console.log('📝 Creating new hosted zone for sandbox.stackpro.io...');
      
      const createCommand = new CreateHostedZoneCommand({
        Name: 'sandbox.stackpro.io',
        CallerReference: `sandbox-stackpro-${Date.now()}`,
        HostedZoneConfig: {
          Comment: 'StackPro Sandbox - Cross-account subdomain delegation',
          PrivateZone: false
        }
      });

      const createResult = await route53.send(createCommand);
      hostedZone = createResult.HostedZone;
      console.log(`✅ Created hosted zone: ${hostedZone.Id}`);
    }

    // Step 3: Get NS records from hosted zone details
    console.log('\n2️⃣ Extracting NS records...');
    
    // Get full hosted zone details which includes NS records
    const getZoneCommand = new GetHostedZoneCommand({
      Id: hostedZone.Id
    });
    
    const zoneDetails = await route53.send(getZoneCommand);
    const nsRecords = zoneDetails.DelegationSet?.NameServers || [];
    
    if (nsRecords.length === 0) {
      throw new Error('No NS records found in hosted zone');
    }

    console.log('✅ NS Records for sandbox.stackpro.io:');
    nsRecords.forEach((ns, i) => console.log(`   ${i + 1}. ${ns}`));

    // Step 4: Request ACM certificate
    console.log('\n3️⃣ Requesting ACM certificate...');
    
    const certCommand = new RequestCertificateCommand({
      DomainName: 'sandbox.stackpro.io',
      SubjectAlternativeNames: ['*.sandbox.stackpro.io'],
      ValidationMethod: 'DNS',
      Options: {
        CertificateTransparencyLoggingPreference: 'ENABLED'
      },
      Tags: [
        { Key: 'Name', Value: 'StackPro Sandbox SSL' },
        { Key: 'Environment', Value: 'sandbox' },
        { Key: 'Project', Value: 'stackpro' }
      ]
    });

    const certResult = await acm.send(certCommand);
    const certificateArn = certResult.CertificateArn;
    
    console.log(`✅ Certificate requested: ${certificateArn}`);
    console.log('⏳ Certificate validation in progress...');

    // Step 5: Output delegation instructions
    console.log('\n' + '='.repeat(80));
    console.log('📋 DNS DELEGATION SETUP REQUIRED');
    console.log('='.repeat(80));
    console.log();
    console.log('🎯 STOP POINT 1: Manual NS Record Creation Required');
    console.log();
    console.log('Please add this NS record to the CURRENT account stackpro.io hosted zone:');
    console.log();
    console.log('━━━ COPY-PASTE NS RECORD ━━━');
    console.log(`Name: sandbox.stackpro.io`);
    console.log(`Type: NS`);
    console.log(`TTL: 300`);
    console.log(`Values:`);
    nsRecords.forEach(ns => console.log(`  ${ns}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log();
    console.log('📝 Steps to complete:');
    console.log('1. Log into AWS Console for the CURRENT account (where stackpro.io is registered)');
    console.log('2. Go to Route53 → Hosted Zones → stackpro.io');
    console.log('3. Create Record → NS → sandbox.stackpro.io → Add the 4 NS values above');
    console.log('4. Save the record');
    console.log('5. Wait 1-2 minutes for DNS propagation');
    console.log('6. Confirm with: dig NS sandbox.stackpro.io');
    console.log();
    console.log('💾 Saved configuration:');
    console.log(`   Hosted Zone ID: ${hostedZone.Id}`);
    console.log(`   Certificate ARN: ${certificateArn}`);
    console.log();
    console.log('🔄 After NS record is added, run: node scripts/validate-sandbox-dns.js');
    console.log();

    // Step 6: Save configuration for next steps
    const config = {
      hostedZoneId: hostedZone.Id.replace('/hostedzone/', ''),
      domainName: 'sandbox.stackpro.io',
      certificateArn,
      nsRecords,
      createdAt: new Date().toISOString(),
      status: 'awaiting_ns_delegation'
    };

    const fs = require('fs');
    fs.writeFileSync('sandbox-dns-config.json', JSON.stringify(config, null, 2));
    console.log('💾 Configuration saved to sandbox-dns-config.json');

    return config;

  } catch (error) {
    console.error('❌ DNS setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupSandboxDNS().catch(console.error);
}

module.exports = { setupSandboxDNS };
