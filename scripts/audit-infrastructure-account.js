#!/usr/bin/env node

/**
 * Infrastructure Account Audit Script
 * Audits what's already deployed in account 304052673868
 */

const { execSync } = require('child_process');

const TARGET_ACCOUNT = '304052673868';
const AWS_PROFILE = 'infrastructure';

function executeAWSCommand(command) {
  try {
    // Use PowerShell syntax for Windows
    const result = execSync(`powershell -Command "$env:AWS_PROFILE='${AWS_PROFILE}'; ${command}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

function auditInfrastructureAccount() {
  console.log('🔍 Auditing Infrastructure Account');
  console.log(`📋 Target Account: ${TARGET_ACCOUNT}`);
  console.log(`🔗 Using Profile: ${AWS_PROFILE}\n`);

  const auditResults = {
    timestamp: new Date().toISOString(),
    account: TARGET_ACCOUNT,
    services: {}
  };

  // Verify we're connected to the right account
  console.log('1️⃣ Verifying account connection...');
  const identity = executeAWSCommand('aws sts get-caller-identity');
  if (identity.success) {
    const identityData = JSON.parse(identity.output);
    console.log(`   ✅ Connected to account: ${identityData.Account}`);
    console.log(`   👤 User: ${identityData.Arn}`);
    
    if (identityData.Account !== TARGET_ACCOUNT) {
      console.log(`   ❌ ERROR: Connected to wrong account! Expected ${TARGET_ACCOUNT}, got ${identityData.Account}`);
      return;
    }
  } else {
    console.log(`   ❌ Failed to verify account: ${identity.error}`);
    return;
  }

  // Check Route53 Hosted Zones
  console.log('\n2️⃣ Checking Route53 hosted zones...');
  const r53zones = executeAWSCommand('aws route53 list-hosted-zones');
  if (r53zones.success) {
    const zones = JSON.parse(r53zones.output);
    const stackproZones = zones.HostedZones.filter(zone => 
      zone.Name.includes('stackpro')
    );
    
    auditResults.services.route53 = stackproZones;
    
    if (stackproZones.length > 0) {
      console.log(`   📋 Found ${stackproZones.length} StackPro hosted zones:`);
      stackproZones.forEach(zone => {
        console.log(`      🌐 ${zone.Name} (${zone.Id})`);
        console.log(`         Records: ${zone.ResourceRecordSetCount}`);
      });
    } else {
      console.log('   ✅ No StackPro hosted zones found');
    }
  } else {
    console.log(`   ❌ Route53 check failed: ${r53zones.error}`);
    auditResults.services.route53 = { error: r53zones.error };
  }

  // Check SES Identities
  console.log('\n3️⃣ Checking SES identities...');
  const sesIdentities = executeAWSCommand('aws ses list-identities');
  if (sesIdentities.success) {
    const identities = JSON.parse(sesIdentities.output);
    const stackproIdentities = identities.Identities.filter(identity => 
      identity.includes('stackpro')
    );
    
    auditResults.services.ses = stackproIdentities;
    
    if (stackproIdentities.length > 0) {
      console.log(`   📧 Found ${stackproIdentities.length} StackPro SES identities:`);
      stackproIdentities.forEach(identity => {
        console.log(`      📮 ${identity}`);
      });
    } else {
      console.log('   ✅ No StackPro SES identities found');
    }
  } else {
    console.log(`   ❌ SES check failed: ${sesIdentities.error}`);
    auditResults.services.ses = { error: sesIdentities.error };
  }

  // Check Lambda Functions
  console.log('\n4️⃣ Checking Lambda functions...');
  const lambdaFunctions = executeAWSCommand('aws lambda list-functions');
  if (lambdaFunctions.success) {
    const functions = JSON.parse(lambdaFunctions.output);
    const stackproFunctions = functions.Functions.filter(func => 
      func.FunctionName.includes('stackpro') || func.FunctionName.includes('email')
    );
    
    auditResults.services.lambda = stackproFunctions;
    
    if (stackproFunctions.length > 0) {
      console.log(`   ⚡ Found ${stackproFunctions.length} relevant Lambda functions:`);
      stackproFunctions.forEach(func => {
        console.log(`      🔧 ${func.FunctionName} (${func.Runtime})`);
        console.log(`         Last Modified: ${func.LastModified}`);
      });
    } else {
      console.log('   ✅ No relevant Lambda functions found');
    }
  } else {
    console.log(`   ❌ Lambda check failed: ${lambdaFunctions.error}`);
    auditResults.services.lambda = { error: lambdaFunctions.error };
  }

  // Check ACM Certificates
  console.log('\n5️⃣ Checking ACM certificates...');
  const acmCerts = executeAWSCommand('aws acm list-certificates');
  if (acmCerts.success) {
    const certs = JSON.parse(acmCerts.output);
    const stackproCerts = certs.CertificateSummaryList.filter(cert => 
      cert.DomainName.includes('stackpro')
    );
    
    auditResults.services.acm = stackproCerts;
    
    if (stackproCerts.length > 0) {
      console.log(`   🔒 Found ${stackproCerts.length} StackPro SSL certificates:`);
      stackproCerts.forEach(cert => {
        console.log(`      📜 ${cert.DomainName} (${cert.Status})`);
        console.log(`         ARN: ${cert.CertificateArn}`);
      });
    } else {
      console.log('   ✅ No StackPro SSL certificates found');
    }
  } else {
    console.log(`   ❌ ACM check failed: ${acmCerts.error}`);
    auditResults.services.acm = { error: acmCerts.error };
  }

  // Check Amplify Apps
  console.log('\n6️⃣ Checking Amplify applications...');
  const amplifyApps = executeAWSCommand('aws amplify list-apps');
  if (amplifyApps.success) {
    const apps = JSON.parse(amplifyApps.output);
    const stackproApps = apps.apps.filter(app => 
      app.name.includes('stackpro') || app.name.includes('StackPro')
    );
    
    auditResults.services.amplify = stackproApps;
    
    if (stackproApps.length > 0) {
      console.log(`   📱 Found ${stackproApps.length} StackPro Amplify apps:`);
      stackproApps.forEach(app => {
        console.log(`      🚀 ${app.name} (${app.platform})`);
        console.log(`         Status: ${app.enableBranchAutoBuild ? 'Auto-build enabled' : 'Manual deploy'}`);
        console.log(`         Default Domain: ${app.defaultDomain}`);
      });
    } else {
      console.log('   ✅ No StackPro Amplify apps found');
    }
  } else {
    console.log(`   ❌ Amplify check failed: ${amplifyApps.error}`);
    auditResults.services.amplify = { error: amplifyApps.error };
  }

  // Summary
  console.log('\n📋 Infrastructure Audit Summary:');
  const hasRoute53 = auditResults.services.route53 && auditResults.services.route53.length > 0;
  const hasSES = auditResults.services.ses && auditResults.services.ses.length > 0;
  const hasLambda = auditResults.services.lambda && auditResults.services.lambda.length > 0;
  const hasACM = auditResults.services.acm && auditResults.services.acm.length > 0;
  const hasAmplify = auditResults.services.amplify && auditResults.services.amplify.length > 0;

  console.log(`   🌐 Route53 Zones: ${hasRoute53 ? '✅ FOUND' : '✅ CLEAN'}`);
  console.log(`   📧 SES Identities: ${hasSES ? '✅ FOUND' : '✅ CLEAN'}`);
  console.log(`   ⚡ Lambda Functions: ${hasLambda ? '✅ FOUND' : '✅ CLEAN'}`);
  console.log(`   🔒 SSL Certificates: ${hasACM ? '✅ FOUND' : '✅ CLEAN'}`);
  console.log(`   📱 Amplify Apps: ${hasAmplify ? '✅ FOUND' : '✅ CLEAN'}`);

  const totalResources = (hasRoute53 ? auditResults.services.route53.length : 0) +
                         (hasSES ? auditResults.services.ses.length : 0) +
                         (hasLambda ? auditResults.services.lambda.length : 0) +
                         (hasACM ? auditResults.services.acm.length : 0) +
                         (hasAmplify ? auditResults.services.amplify.length : 0);

  console.log(`\n🎯 Total StackPro Resources: ${totalResources}`);

  if (totalResources === 0) {
    console.log('✅ Account is CLEAN - ready for fresh deployment');
  } else {
    console.log('⚠️  Account has existing resources - review before deployment');
  }

  // Save results
  const fs = require('fs');
  const resultsFile = 'infrastructure-account-audit.json';
  fs.writeFileSync(resultsFile, JSON.stringify(auditResults, null, 2));
  console.log(`\n💾 Detailed results saved to: ${resultsFile}`);

  return auditResults;
}

// Run audit
if (require.main === module) {
  auditInfrastructureAccount();
}

module.exports = { auditInfrastructureAccount };
