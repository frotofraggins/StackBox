#!/usr/bin/env node

/**
 * StackPro SSL Certificate Management
 * Request and validate ACM certificates for production deployment
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Production Configuration
const SSL_CONFIG = {
  domain: 'stackpro.io',
  profile: 'Stackbox',
  accountId: '304052673868',
  region: 'us-west-2',
  acmRegion: 'us-east-1', // ACM certificates for CloudFront must be in us-east-1
  tags: {
    Project: 'StackPro',
    Environment: 'Production',
    Purpose: 'SSL-Certificate',
    CostCenter: 'Infrastructure'
  }
};

class SSLCertificateManager {
  constructor() {
    // Route53 in main region
    this.route53 = new AWS.Route53({ 
      region: SSL_CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: SSL_CONFIG.profile })
    });
    
    // ACM in us-east-1 for CloudFront compatibility
    this.acm = new AWS.ACM({ 
      region: SSL_CONFIG.acmRegion,
      credentials: new AWS.SharedIniFileCredentials({ profile: SSL_CONFIG.profile })
    });
    
    // Route53 Domains in us-east-1
    this.route53Domains = new AWS.Route53Domains({
      region: 'us-east-1',
      credentials: new AWS.SharedIniFileCredentials({ profile: SSL_CONFIG.profile })
    });
    
    this.certificateArn = null;
    this.hostedZoneId = null;
    this.validationRecords = [];
  }

  async init() {
    log('🔒 StackPro SSL Certificate Manager', 'bold');
    log(`📍 Domain: ${SSL_CONFIG.domain}`, 'blue');
    log(`👤 Profile: ${SSL_CONFIG.profile} (${SSL_CONFIG.accountId})`, 'blue');
    log(`🌍 ACM Region: ${SSL_CONFIG.acmRegion}`, 'blue');
    
    try {
      await this.validatePrerequisites();
      await this.checkExistingCertificates();
      
      if (!this.certificateArn) {
        await this.requestCertificate();
        await this.createValidationRecords();
      }
      
      await this.waitForValidation();
      await this.verifyCertificate();
      
      log('✅ SSL certificate setup completed successfully!', 'green');
      
    } catch (error) {
      log(`❌ SSL certificate setup failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async validatePrerequisites() {
    log('🔍 Validating SSL certificate prerequisites...', 'bold');
    
    try {
      // Verify AWS account
      const sts = new AWS.STS({
        credentials: new AWS.SharedIniFileCredentials({ profile: SSL_CONFIG.profile })
      });
      const identity = await sts.getCallerIdentity().promise();
      
      if (identity.Account !== SSL_CONFIG.accountId) {
        throw new Error(`Wrong AWS account: ${identity.Account} (expected ${SSL_CONFIG.accountId})`);
      }
      
      log(`✅ AWS Account: ${identity.Account}`, 'green');
      
      // Verify domain ownership
      const domains = await this.route53Domains.listDomains().promise();
      const domain = domains.Domains.find(d => d.DomainName === SSL_CONFIG.domain);
      
      if (!domain) {
        throw new Error(`Domain ${SSL_CONFIG.domain} not found in account ${SSL_CONFIG.accountId}`);
      }
      
      log(`✅ Domain Ownership: ${domain.DomainName}`, 'green');
      
      // Find hosted zone
      const hostedZones = await this.route53.listHostedZones().promise();
      const hostedZone = hostedZones.HostedZones.find(z => z.Name === `${SSL_CONFIG.domain}.`);
      
      if (!hostedZone) {
        throw new Error(`Hosted zone for ${SSL_CONFIG.domain} not found`);
      }
      
      this.hostedZoneId = hostedZone.Id.split('/')[2];
      log(`✅ Hosted Zone: ${this.hostedZoneId}`, 'green');
      
    } catch (error) {
      throw new Error(`Prerequisites validation failed: ${error.message}`);
    }
  }

  async checkExistingCertificates() {
    log('🔍 Checking for existing SSL certificates...', 'bold');
    
    try {
      const certificates = await this.acm.listCertificates({
        CertificateStatuses: ['PENDING_VALIDATION', 'ISSUED', 'VALIDATION_TIMED_OUT', 'FAILED']
      }).promise();
      
      // Look for certificates matching our domain
      for (const certSummary of certificates.CertificateSummaryList) {
        if (certSummary.DomainName === SSL_CONFIG.domain || 
            certSummary.SubjectAlternativeNameSummary?.includes(`*.${SSL_CONFIG.domain}`)) {
          
          const certDetails = await this.acm.describeCertificate({
            CertificateArn: certSummary.CertificateArn
          }).promise();
          
          log(`📄 Found existing certificate: ${certSummary.CertificateArn}`, 'blue');
          log(`   Status: ${certDetails.Certificate.Status}`, 'blue');
          log(`   Domain: ${certDetails.Certificate.DomainName}`, 'blue');
          
          if (certDetails.Certificate.Status === 'ISSUED') {
            this.certificateArn = certSummary.CertificateArn;
            log(`✅ Using existing issued certificate`, 'green');
            return;
          } else if (certDetails.Certificate.Status === 'PENDING_VALIDATION') {
            this.certificateArn = certSummary.CertificateArn;
            log(`⏳ Certificate is pending validation`, 'yellow');
            
            // Get validation records for pending certificate
            if (certDetails.Certificate.DomainValidationOptions) {
              this.validationRecords = certDetails.Certificate.DomainValidationOptions.map(option => ({
                Name: option.ValidationDomain,
                Type: 'CNAME',
                TTL: 300,
                Value: option.ResourceRecord.Value,
                ResourceRecord: {
                  Name: option.ResourceRecord.Name,
                  Type: option.ResourceRecord.Type,
                  Value: option.ResourceRecord.Value
                }
              }));
            }
            return;
          } else if (certDetails.Certificate.Status === 'FAILED' || 
                     certDetails.Certificate.Status === 'VALIDATION_TIMED_OUT') {
            log(`⚠️ Certificate ${certSummary.CertificateArn} has failed, will request new one`, 'yellow');
            
            // Delete failed certificate
            try {
              await this.acm.deleteCertificate({
                CertificateArn: certSummary.CertificateArn
              }).promise();
              log(`🗑️ Deleted failed certificate`, 'blue');
            } catch (deleteError) {
              log(`⚠️ Could not delete failed certificate: ${deleteError.message}`, 'yellow');
            }
          }
        }
      }
      
      log('📄 No usable existing certificate found', 'blue');
      
    } catch (error) {
      throw new Error(`Certificate check failed: ${error.message}`);
    }
  }

  async requestCertificate() {
    log('📝 Requesting new SSL certificate...', 'bold');
    
    try {
      const params = {
        DomainName: SSL_CONFIG.domain,
        SubjectAlternativeNames: [`*.${SSL_CONFIG.domain}`],
        ValidationMethod: 'DNS',
        Tags: Object.entries(SSL_CONFIG.tags).map(([Key, Value]) => ({ Key, Value }))
      };

      const result = await this.acm.requestCertificate(params).promise();
      this.certificateArn = result.CertificateArn;
      
      log(`✅ Certificate requested: ${this.certificateArn}`, 'green');
      log(`   Domain: ${SSL_CONFIG.domain}`, 'blue');
      log(`   Wildcard: *.${SSL_CONFIG.domain}`, 'blue');
      log(`   Validation: DNS`, 'blue');
      
      // Wait a moment for AWS to populate validation options
      log('⏳ Waiting for validation options...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      throw new Error(`Certificate request failed: ${error.message}`);
    }
  }

  async createValidationRecords() {
    log('📋 Creating DNS validation records...', 'bold');
    
    try {
      // Get certificate details including validation options
      const certDetails = await this.acm.describeCertificate({
        CertificateArn: this.certificateArn
      }).promise();
      
      if (!certDetails.Certificate.DomainValidationOptions || 
          certDetails.Certificate.DomainValidationOptions.length === 0) {
        throw new Error('No domain validation options found');
      }
      
      const changes = [];
      
      for (const validationOption of certDetails.Certificate.DomainValidationOptions) {
        if (validationOption.ResourceRecord) {
          log(`📝 Adding validation record for ${validationOption.ValidationDomain}`, 'blue');
          log(`   Name: ${validationOption.ResourceRecord.Name}`, 'blue');
          log(`   Value: ${validationOption.ResourceRecord.Value}`, 'blue');
          
          changes.push({
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: validationOption.ResourceRecord.Name,
              Type: validationOption.ResourceRecord.Type,
              TTL: 300,
              ResourceRecords: [
                {
                  Value: validationOption.ResourceRecord.Value
                }
              ]
            }
          });
        }
      }
      
      if (changes.length === 0) {
        throw new Error('No validation records to create');
      }
      
      // Apply DNS changes
      const changeBatch = {
        Comment: 'SSL certificate validation records for StackPro production',
        Changes: changes
      };
      
      const changeResult = await this.route53.changeResourceRecordSets({
        HostedZoneId: this.hostedZoneId,
        ChangeBatch: changeBatch
      }).promise();
      
      log(`✅ DNS validation records created`, 'green');
      log(`   Change ID: ${changeResult.ChangeInfo.Id}`, 'blue');
      log(`   Status: ${changeResult.ChangeInfo.Status}`, 'blue');
      
      // Wait for DNS propagation
      if (changeResult.ChangeInfo.Status === 'PENDING') {
        log('⏳ Waiting for DNS propagation...', 'yellow');
        
        await this.route53.waitFor('resourceRecordSetsChanged', {
          Id: changeResult.ChangeInfo.Id
        }).promise();
        
        log('✅ DNS records propagated', 'green');
      }
      
      // Store validation records for reference
      this.validationRecords = changes.map(change => ({
        Name: change.ResourceRecordSet.Name,
        Type: change.ResourceRecordSet.Type,
        Value: change.ResourceRecordSet.ResourceRecords[0].Value
      }));
      
    } catch (error) {
      throw new Error(`DNS validation record creation failed: ${error.message}`);
    }
  }

  async waitForValidation() {
    log('⏳ Waiting for certificate validation...', 'bold');
    
    try {
      let attempts = 0;
      const maxAttempts = 60; // 30 minutes max
      
      while (attempts < maxAttempts) {
        const certDetails = await this.acm.describeCertificate({
          CertificateArn: this.certificateArn
        }).promise();
        
        log(`🔄 Certificate status: ${certDetails.Certificate.Status} (${Math.floor(attempts/2)} minutes)`, 'blue');
        
        if (certDetails.Certificate.Status === 'ISSUED') {
          log('✅ Certificate validation completed!', 'green');
          return;
        } else if (certDetails.Certificate.Status === 'FAILED') {
          // Show validation failure reasons
          if (certDetails.Certificate.DomainValidationOptions) {
            certDetails.Certificate.DomainValidationOptions.forEach(option => {
              if (option.ValidationStatus && option.ValidationStatus === 'FAILED') {
                log(`❌ Validation failed for ${option.ValidationDomain}`, 'red');
                if (option.ValidationEmails) {
                  log(`   Validation emails sent to: ${option.ValidationEmails.join(', ')}`, 'blue');
                }
              }
            });
          }
          throw new Error('Certificate validation failed');
        }
        
        // Wait 30 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 30000));
        attempts++;
      }
      
      throw new Error('Certificate validation timed out after 30 minutes');
      
    } catch (error) {
      throw new Error(`Certificate validation failed: ${error.message}`);
    }
  }

  async verifyCertificate() {
    log('✅ Verifying certificate details...', 'bold');
    
    try {
      const certDetails = await this.acm.describeCertificate({
        CertificateArn: this.certificateArn
      }).promise();
      
      log('🎉 Certificate Summary:', 'bold');
      log(`📄 ARN: ${this.certificateArn}`, 'blue');
      log(`🌐 Domain: ${certDetails.Certificate.DomainName}`, 'green');
      log(`🔒 Status: ${certDetails.Certificate.Status}`, 'green');
      log(`📅 Issued: ${certDetails.Certificate.IssuedAt}`, 'blue');
      log(`⏰ Expires: ${certDetails.Certificate.NotAfter}`, 'blue');
      log(`🏷️ Subject: ${certDetails.Certificate.Subject}`, 'blue');
      log(`🔑 Key Algorithm: ${certDetails.Certificate.KeyAlgorithm}`, 'blue');
      
      if (certDetails.Certificate.SubjectAlternativeNames) {
        log(`🌟 Alternative Names:`, 'blue');
        certDetails.Certificate.SubjectAlternativeNames.forEach(name => {
          log(`   - ${name}`, 'blue');
        });
      }
      
      // Save certificate details
      const summary = {
        certificateArn: this.certificateArn,
        domain: SSL_CONFIG.domain,
        status: certDetails.Certificate.Status,
        issuedAt: certDetails.Certificate.IssuedAt,
        expiresAt: certDetails.Certificate.NotAfter,
        hostedZoneId: this.hostedZoneId,
        validationRecords: this.validationRecords,
        createdAt: new Date().toISOString(),
        region: SSL_CONFIG.acmRegion
      };
      
      const summaryPath = path.join(__dirname, '..', 'logs', 'ssl-certificate-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      log(`📄 Certificate summary saved: ${summaryPath}`, 'blue');
      
      return summary;
      
    } catch (error) {
      throw new Error(`Certificate verification failed: ${error.message}`);
    }
  }

  // Certificate renewal check
  async checkRenewal() {
    log('🔄 Checking certificate renewal status...', 'bold');
    
    try {
      if (!this.certificateArn) {
        throw new Error('No certificate ARN available');
      }
      
      const certDetails = await this.acm.describeCertificate({
        CertificateArn: this.certificateArn
      }).promise();
      
      const expiryDate = new Date(certDetails.Certificate.NotAfter);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      log(`📅 Certificate expires in ${daysUntilExpiry} days`, 'blue');
      
      if (daysUntilExpiry <= 30) {
        log('⚠️ Certificate expires within 30 days', 'yellow');
        log('📧 AWS should automatically renew this certificate', 'blue');
      } else if (daysUntilExpiry <= 7) {
        log('🚨 Certificate expires within 7 days!', 'red');
        log('📞 Check AWS console or contact support if not renewed', 'yellow');
      } else {
        log('✅ Certificate renewal status is healthy', 'green');
      }
      
      return {
        daysUntilExpiry,
        expiryDate,
        renewalNeeded: daysUntilExpiry <= 30
      };
      
    } catch (error) {
      throw new Error(`Renewal check failed: ${error.message}`);
    }
  }
}

// Cleanup function for development
async function cleanupFailedCertificates() {
  log('🧹 Cleaning up failed certificates...', 'bold');
  
  const manager = new SSLCertificateManager();
  
  try {
    const certificates = await manager.acm.listCertificates({
      CertificateStatuses: ['FAILED', 'VALIDATION_TIMED_OUT']
    }).promise();
    
    for (const cert of certificates.CertificateSummaryList) {
      if (cert.DomainName === SSL_CONFIG.domain) {
        log(`🗑️ Deleting failed certificate: ${cert.CertificateArn}`, 'yellow');
        
        try {
          await manager.acm.deleteCertificate({
            CertificateArn: cert.CertificateArn
          }).promise();
          log(`✅ Deleted certificate`, 'green');
        } catch (deleteError) {
          log(`⚠️ Could not delete: ${deleteError.message}`, 'yellow');
        }
      }
    }
    
    log('✅ Cleanup completed', 'green');
    
  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
  }
}

// Monitor certificate status
async function monitorCertificate() {
  log('📊 Monitoring certificate status...', 'bold');
  
  const manager = new SSLCertificateManager();
  
  try {
    // Load certificate ARN from saved summary
    const summaryPath = path.join(__dirname, '..', 'logs', 'ssl-certificate-summary.json');
    
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      manager.certificateArn = summary.certificateArn;
      
      await manager.verifyCertificate();
      await manager.checkRenewal();
    } else {
      log('❌ No certificate summary found. Run main script first.', 'red');
    }
    
  } catch (error) {
    log(`❌ Monitoring failed: ${error.message}`, 'red');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('📖 StackPro SSL Certificate Manager');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/request-production-ssl.js           # Request/setup SSL certificate');
    console.log('  node scripts/request-production-ssl.js --monitor # Monitor existing certificate');
    console.log('  node scripts/request-production-ssl.js --cleanup # Clean up failed certificates');
    console.log('  node scripts/request-production-ssl.js --help    # Show this help');
    return;
  }
  
  if (args.includes('--monitor')) {
    await monitorCertificate();
    return;
  }
  
  if (args.includes('--cleanup')) {
    await cleanupFailedCertificates();
    return;
  }
  
  // Main SSL setup
  const manager = new SSLCertificateManager();
  await manager.init();
  
  log('\n🎉 SSL Certificate Setup Complete!', 'green');
  log('🚀 You can now proceed with production deployment:', 'blue');
  log('   node scripts/deploy-amplify-production.js', 'green');
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ SSL certificate setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { SSLCertificateManager, cleanupFailedCertificates, monitorCertificate };
