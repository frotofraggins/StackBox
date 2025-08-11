#!/usr/bin/env node

/**
 * Domain Transfer Script - StackPro.io
 * Transfer domain from stackpro profile (788363206718) to Stackbox profile (304052673868)
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

const DOMAIN_NAME = 'stackpro.io';
const SOURCE_PROFILE = 'stackpro';
const TARGET_PROFILE = 'Stackbox';
const SOURCE_ACCOUNT = '788363206718';
const TARGET_ACCOUNT = '304052673868';
const HOSTED_ZONE_ID = 'Z09644762VPS77ZYCBQ3E';

class DomainTransferManager {
  constructor() {
    // Source account clients
    this.sourceRoute53 = new AWS.Route53({ 
      region: 'us-west-2',
      credentials: new AWS.SharedIniFileCredentials({ profile: SOURCE_PROFILE })
    });
    this.sourceRoute53Domains = new AWS.Route53Domains({ 
      region: 'us-east-1',
      credentials: new AWS.SharedIniFileCredentials({ profile: SOURCE_PROFILE })
    });
    
    // Target account clients
    this.targetRoute53 = new AWS.Route53({ 
      region: 'us-west-2',
      credentials: new AWS.SharedIniFileCredentials({ profile: TARGET_PROFILE })
    });
    this.targetRoute53Domains = new AWS.Route53Domains({ 
      region: 'us-east-1',
      credentials: new AWS.SharedIniFileCredentials({ profile: TARGET_PROFILE })
    });
    
    this.backupData = {
      domain: null,
      hostedZone: null,
      records: null,
      timestamp: new Date().toISOString()
    };
  }

  async init() {
    log('🔄 StackPro Domain Transfer Manager', 'bold');
    log(`📍 Transferring ${DOMAIN_NAME} from account ${SOURCE_ACCOUNT} to ${TARGET_ACCOUNT}\n`, 'blue');
    
    try {
      await this.validateAccounts();
      await this.backupCurrentConfiguration();
      await this.initiateTransfer();
      await this.waitForTransferCompletion();
      await this.recreateHostedZone();
      await this.updateNameServers();
      await this.verifyTransfer();
      
      log('✅ Domain transfer completed successfully!', 'green');
    } catch (error) {
      log(`❌ Transfer failed: ${error.message}`, 'red');
      console.log('🔄 Running rollback...');
      await this.rollback();
      process.exit(1);
    }
  }

  async validateAccounts() {
    log('🔍 Validating AWS accounts and permissions...', 'bold');
    
    try {
      // Validate source account
      const sourceSTS = new AWS.STS({ 
        credentials: new AWS.SharedIniFileCredentials({ profile: SOURCE_PROFILE })
      });
      const sourceIdentity = await sourceSTS.getCallerIdentity().promise();
      
      if (sourceIdentity.Account !== SOURCE_ACCOUNT) {
        throw new Error(`Source profile points to wrong account: ${sourceIdentity.Account} (expected ${SOURCE_ACCOUNT})`);
      }
      
      // Validate target account
      const targetSTS = new AWS.STS({ 
        credentials: new AWS.SharedIniFileCredentials({ profile: TARGET_PROFILE })
      });
      const targetIdentity = await targetSTS.getCallerIdentity().promise();
      
      if (targetIdentity.Account !== TARGET_ACCOUNT) {
        throw new Error(`Target profile points to wrong account: ${targetIdentity.Account} (expected ${TARGET_ACCOUNT})`);
      }
      
      log(`✅ Source Account: ${sourceIdentity.Account} (${SOURCE_PROFILE})`, 'green');
      log(`✅ Target Account: ${targetIdentity.Account} (${TARGET_PROFILE})`, 'green');
      
    } catch (error) {
      throw new Error(`Account validation failed: ${error.message}`);
    }
  }

  async backupCurrentConfiguration() {
    log('💾 Backing up current domain configuration...', 'bold');
    
    try {
      // Get domain details
      const domainDetails = await this.sourceRoute53Domains.getDomainDetail({
        DomainName: DOMAIN_NAME
      }).promise();
      
      this.backupData.domain = domainDetails;
      
      // Get hosted zone details
      const hostedZone = await this.sourceRoute53.getHostedZone({
        Id: HOSTED_ZONE_ID
      }).promise();
      
      this.backupData.hostedZone = hostedZone;
      
      // Get all DNS records
      const records = await this.sourceRoute53.listResourceRecordSets({
        HostedZoneId: HOSTED_ZONE_ID
      }).promise();
      
      this.backupData.records = records;
      
      // Save backup to file
      const backupPath = path.join(__dirname, '..', 'logs', `domain-backup-${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(this.backupData, null, 2));
      
      log(`✅ Configuration backed up to: ${backupPath}`, 'green');
      log(`📄 Domain: ${domainDetails.DomainName}`, 'blue');
      log(`📄 Expiry: ${domainDetails.ExpirationDate}`, 'blue');
      log(`📄 Records: ${records.ResourceRecordSets.length} DNS records`, 'blue');
      
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async initiateTransfer() {
    log('🔄 Initiating domain transfer between AWS accounts...', 'bold');
    
    try {
      // Check if transfer lock is enabled
      const domain = this.backupData.domain;
      
      if (domain.TransferLock) {
        log('🔓 Disabling transfer lock...', 'yellow');
        await this.sourceRoute53Domains.updateDomainTransferLock({
          DomainName: DOMAIN_NAME,
          TransferLock: false
        }).promise();
        
        // Wait for lock to be disabled
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      
      log('⚠️  IMPORTANT: Cross-account domain transfer requires manual steps:', 'yellow');
      log('', 'reset');
      log('1. 📧 AWS will send transfer authorization emails to both accounts', 'blue');
      log('2. ✅ You must approve the transfer from BOTH accounts within 7 days', 'blue');
      log('3. 🔄 Transfer typically completes within 5-7 days after approval', 'blue');
      log('4. 💰 AWS charges $0.50 for the transfer (Route 53 fee)', 'blue');
      log('', 'reset');
      
      log('📋 Manual steps to complete:', 'bold');
      log('', 'reset');
      log('A. In SOURCE account (stackpro profile):', 'yellow');
      log(`   1. Go to Route 53 > Registered Domains`, 'blue');
      log(`   2. Select ${DOMAIN_NAME}`, 'blue');
      log(`   3. Choose "Transfer domain to another AWS account"`, 'blue');
      log(`   4. Enter target account ID: ${TARGET_ACCOUNT}`, 'blue');
      log(`   5. Click "Transfer domain"`, 'blue');
      log('', 'reset');
      log('B. In TARGET account (Stackbox profile):', 'yellow');
      log(`   1. Go to Route 53 > Pending requests`, 'blue');
      log(`   2. Find the transfer request for ${DOMAIN_NAME}`, 'blue');
      log(`   3. Click "Accept transfer"`, 'blue');
      log(`   4. Confirm the transfer`, 'blue');
      log('', 'reset');
      
      log('⚡ After manual transfer, run this script with --complete flag', 'green');
      
    } catch (error) {
      throw new Error(`Transfer initiation failed: ${error.message}`);
    }
  }

  async waitForTransferCompletion() {
    log('⏳ Checking if domain transfer is completed...', 'bold');
    
    try {
      // Check if domain exists in target account
      const domains = await this.targetRoute53Domains.listDomains().promise();
      const transferredDomain = domains.Domains.find(d => d.DomainName === DOMAIN_NAME);
      
      if (!transferredDomain) {
        log('❌ Domain transfer not yet completed.', 'red');
        log('', 'reset');
        log('📋 Please complete the manual transfer steps first:', 'yellow');
        log('1. Transfer domain from source account to target account', 'blue');
        log('2. Wait for transfer to complete (5-7 days)', 'blue');
        log('3. Run this script again with --complete flag', 'blue');
        log('', 'reset');
        log('Command to run after transfer: node scripts/transfer-domain-to-stackbox.js --complete', 'green');
        process.exit(0);
      }
      
      log(`✅ Domain ${DOMAIN_NAME} found in target account!`, 'green');
      log(`📅 Expiry: ${transferredDomain.Expiry}`, 'blue');
      
    } catch (error) {
      throw new Error(`Transfer completion check failed: ${error.message}`);
    }
  }

  async recreateHostedZone() {
    log('🏗️ Creating hosted zone in target account...', 'bold');
    
    try {
      // Check if hosted zone already exists
      const existingZones = await this.targetRoute53.listHostedZones().promise();
      const existingZone = existingZones.HostedZones.find(z => z.Name === `${DOMAIN_NAME}.`);
      
      if (existingZone) {
        log(`✅ Using existing hosted zone: ${existingZone.Id}`, 'green');
        this.newHostedZoneId = existingZone.Id.split('/')[2];
        return;
      }
      
      // Create new hosted zone
      const createZoneParams = {
        Name: DOMAIN_NAME,
        CallerReference: `stackpro-transfer-${Date.now()}`,
        HostedZoneConfig: {
          Comment: `Transferred from account ${SOURCE_ACCOUNT} on ${new Date().toISOString()}`,
          PrivateZone: false
        }
      };
      
      const newZone = await this.targetRoute53.createHostedZone(createZoneParams).promise();
      this.newHostedZoneId = newZone.HostedZone.Id.split('/')[2];
      
      log(`✅ Created new hosted zone: ${this.newHostedZoneId}`, 'green');
      
      // Migrate DNS records (excluding NS and SOA which are auto-created)
      const recordsToMigrate = this.backupData.records.ResourceRecordSets.filter(
        record => record.Type !== 'NS' && record.Type !== 'SOA'
      );
      
      if (recordsToMigrate.length > 0) {
        log(`🔄 Migrating ${recordsToMigrate.length} DNS records...`, 'blue');
        
        for (const record of recordsToMigrate) {
          const changeParams = {
            HostedZoneId: this.newHostedZoneId,
            ChangeBatch: {
              Changes: [{
                Action: 'CREATE',
                ResourceRecordSet: record
              }]
            }
          };
          
          await this.targetRoute53.changeResourceRecordSets(changeParams).promise();
          log(`✅ Migrated ${record.Type} record for ${record.Name}`, 'green');
        }
      }
      
    } catch (error) {
      throw new Error(`Hosted zone recreation failed: ${error.message}`);
    }
  }

  async updateNameServers() {
    log('🌐 Updating domain name servers...', 'bold');
    
    try {
      // Get new name servers from the hosted zone
      const hostedZone = await this.targetRoute53.getHostedZone({
        Id: this.newHostedZoneId
      }).promise();
      
      const nameServers = hostedZone.DelegationSet.NameServers;
      
      // Update domain name servers
      const updateParams = {
        DomainName: DOMAIN_NAME,
        Nameservers: nameServers.map(ns => ({ Name: ns }))
      };
      
      await this.targetRoute53Domains.updateDomainNameservers(updateParams).promise();
      
      log(`✅ Updated name servers:`, 'green');
      nameServers.forEach(ns => log(`   - ${ns}`, 'blue'));
      
      log('⏳ DNS propagation may take 24-48 hours to complete worldwide', 'yellow');
      
    } catch (error) {
      throw new Error(`Name server update failed: ${error.message}`);
    }
  }

  async verifyTransfer() {
    log('✅ Verifying domain transfer...', 'bold');
    
    try {
      // Verify domain is in target account
      const domain = await this.targetRoute53Domains.getDomainDetail({
        DomainName: DOMAIN_NAME
      }).promise();
      
      // Verify hosted zone is working
      const hostedZones = await this.targetRoute53.listHostedZones().promise();
      const targetZone = hostedZones.HostedZones.find(z => z.Name === `${DOMAIN_NAME}.`);
      
      if (!targetZone) {
        throw new Error('Hosted zone not found in target account');
      }
      
      log(`✅ Domain registration: ${domain.DomainName}`, 'green');
      log(`✅ Expiry date: ${domain.ExpirationDate}`, 'green');
      log(`✅ Auto-renew: ${domain.AutoRenew}`, 'green');
      log(`✅ Hosted zone: ${targetZone.Id}`, 'green');
      
      // Save completion summary
      const summary = {
        domain: DOMAIN_NAME,
        sourceAccount: SOURCE_ACCOUNT,
        targetAccount: TARGET_ACCOUNT,
        hostedZoneId: targetZone.Id,
        completedAt: new Date().toISOString(),
        nameServers: (await this.targetRoute53.getHostedZone({ Id: targetZone.Id }).promise()).DelegationSet.NameServers
      };
      
      const summaryPath = path.join(__dirname, '..', 'logs', 'domain-transfer-completed.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      log(`📄 Transfer summary saved: ${summaryPath}`, 'blue');
      
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  async rollback() {
    log('🔄 Attempting rollback...', 'yellow');
    
    try {
      if (this.newHostedZoneId) {
        log('🗑️ Removing created hosted zone...', 'blue');
        await this.targetRoute53.deleteHostedZone({
          Id: this.newHostedZoneId
        }).promise();
        log('✅ Hosted zone removed', 'green');
      }
      
      log('⚠️  Domain registration cannot be automatically rolled back', 'yellow');
      log('📞 Contact AWS support if you need to reverse the domain transfer', 'blue');
      
    } catch (error) {
      log(`❌ Rollback failed: ${error.message}`, 'red');
    }
  }

  // Manual transfer guidance
  async showTransferInstructions() {
    log('📋 StackPro Domain Transfer Instructions', 'bold');
    log('=' .repeat(50), 'blue');
    log('', 'reset');
    
    log('🎯 GOAL: Transfer stackpro.io from account 788363206718 to 304052673868', 'green');
    log('', 'reset');
    
    log('📌 STEP 1: Initiate transfer from SOURCE account', 'bold');
    log('', 'reset');
    log('1. Open AWS Console and switch to stackpro profile', 'blue');
    log('2. Go to Route 53 > Registered domains', 'blue');
    log('3. Select stackpro.io', 'blue');
    log('4. Click "Transfer domain to another AWS account"', 'blue');
    log('5. Enter target account ID: 304052673868', 'blue');
    log('6. Click "Transfer domain"', 'blue');
    log('', 'reset');
    
    log('📌 STEP 2: Accept transfer in TARGET account', 'bold');
    log('', 'reset');
    log('1. Switch to Stackbox profile (304052673868)', 'blue');
    log('2. Go to Route 53 > Pending requests', 'blue');
    log('3. Find transfer request for stackpro.io', 'blue');
    log('4. Click "Accept transfer"', 'blue');
    log('5. Confirm acceptance', 'blue');
    log('', 'reset');
    
    log('📌 STEP 3: Wait and complete setup', 'bold');
    log('', 'reset');
    log('1. Transfer takes 5-7 days to complete', 'blue');
    log('2. AWS will charge $0.50 for the transfer', 'blue');
    log('3. After transfer completes, run:', 'blue');
    log('   node scripts/transfer-domain-to-stackbox.js --complete', 'green');
    log('', 'reset');
    
    log('💡 Tips:', 'yellow');
    log('• Make sure transfer lock is disabled', 'blue');
    log('• Keep domain admin email accessible', 'blue');
    log('• Backup current DNS settings (this script does it)', 'blue');
    log('• Test everything after transfer completes', 'blue');
    log('', 'reset');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const transferManager = new DomainTransferManager();
  
  if (args.includes('--help')) {
    console.log('📖 StackPro Domain Transfer Script');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/transfer-domain-to-stackbox.js            # Show transfer instructions');
    console.log('  node scripts/transfer-domain-to-stackbox.js --backup   # Backup current config only');
    console.log('  node scripts/transfer-domain-to-stackbox.js --complete # Complete transfer after domain moved');
    console.log('  node scripts/transfer-domain-to-stackbox.js --help     # Show this help');
    return;
  }
  
  if (args.includes('--backup')) {
    await transferManager.validateAccounts();
    await transferManager.backupCurrentConfiguration();
    log('✅ Backup completed. Review the backup file before proceeding with transfer.', 'green');
    return;
  }
  
  if (args.includes('--complete')) {
    // Skip initiation steps, go straight to completion
    await transferManager.validateAccounts();
    await transferManager.waitForTransferCompletion();
    await transferManager.recreateHostedZone();
    await transferManager.updateNameServers();
    await transferManager.verifyTransfer();
    log('✅ Domain transfer setup completed!', 'green');
    return;
  }
  
  // Default: Show instructions
  await transferManager.showTransferInstructions();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { DomainTransferManager };
