#!/usr/bin/env node

const { ACMClient, ListCertificatesCommand, DescribeCertificateCommand } = require('@aws-sdk/client-acm');
const { Route53Client, ListHostedZonesCommand, GetHostedZoneCommand } = require('@aws-sdk/client-route-53');

async function checkSSLAndDNS() {
  try {
    console.log('🔍 Checking SSL certificates and DNS configuration...');
    
    const acmClient = new ACMClient({ region: 'us-west-2' });
    const route53Client = new Route53Client({ region: 'us-west-2' });
    
    // Check ACM certificates
    console.log('\n📜 Checking ACM certificates:');
    const listCertsCommand = new ListCertificatesCommand({});
    const certsList = await acmClient.send(listCertsCommand);
    
    const stackproCerts = certsList.CertificateSummaryList.filter(cert => 
      cert.DomainName.includes('stackpro.io')
    );
    
    for (const cert of stackproCerts) {
      const describeCertCommand = new DescribeCertificateCommand({
        CertificateArn: cert.CertificateArn
      });
      const certDetails = await acmClient.send(describeCertCommand);
      
      console.log(`  Domain: ${cert.DomainName}`);
      console.log(`  Status: ${certDetails.Certificate.Status}`);
      console.log(`  ARN: ${cert.CertificateArn}`);
      
      if (certDetails.Certificate.Status !== 'ISSUED') {
        console.log(`  ❌ Certificate not issued for ${cert.DomainName}`);
        return false;
      } else {
        console.log(`  ✅ Certificate issued for ${cert.DomainName}`);
      }
    }
    
    // Check Route53 hosted zones
    console.log('\n🌐 Checking Route53 hosted zones:');
    const listZonesCommand = new ListHostedZonesCommand({});
    const zonesList = await route53Client.send(listZonesCommand);
    
    const stackproZones = zonesList.HostedZones.filter(zone => 
      zone.Name.includes('stackpro.io')
    );
    
    for (const zone of stackproZones) {
      const getZoneCommand = new GetHostedZoneCommand({
        Id: zone.Id
      });
      const zoneDetails = await route53Client.send(getZoneCommand);
      
      console.log(`  Zone: ${zone.Name}`);
      console.log(`  ID: ${zone.Id}`);
      console.log(`  Records: ${zone.ResourceRecordSetCount}`);
      console.log(`  ✅ Zone configured`);
    }
    
    if (stackproCerts.length === 0) {
      console.log('❌ No stackpro.io certificates found');
      return false;
    }
    
    if (stackproZones.length === 0) {
      console.log('❌ No stackpro.io hosted zones found');
      return false;
    }
    
    console.log('\n✅ SSL certificates and DNS configuration verified');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to check SSL/DNS:', error.message);
    return false;
  }
}

if (require.main === module) {
  checkSSLAndDNS().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkSSLAndDNS };