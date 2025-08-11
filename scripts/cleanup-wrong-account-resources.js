#!/usr/bin/env node

/**
 * Cleanup Script for Wrong Account Resources
 * Removes infrastructure deployed to incorrect AWS account to prevent confusion
 */

const { Route53Client, DeleteHostedZoneCommand, ListHostedZonesCommand, ListResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');
const { SESClient, ListIdentitiesCommand, DeleteIdentityCommand } = require('@aws-sdk/client-ses');
const { LambdaClient, ListFunctionsCommand, DeleteFunctionCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');

// Load account configuration
const accountConfig = JSON.parse(fs.readFileSync('config/aws-accounts.json', 'utf8'));
const wrongAccountId = accountConfig.authorizedAccounts['WRONG-ACCOUNT'].accountId;

async function cleanupWrongAccountResources() {
  console.log('🧹 Cleaning Up Wrong Account Resources');
  console.log(`❌ Target: Account ${wrongAccountId} (INCORRECT DEPLOYMENT)`);
  console.log('🔗 Preserving: Default account for Cline connectivity\n');

  const cleanupResults = {
    account: wrongAccountId,
    timestamp: new Date().toISOString(),
    resources: {
      route53: [],
      ses: [],
      lambda: [],
      errors: []
    }
  };

  try {
    // Initialize AWS clients (default profile - wrong account)
    const route53 = new Route53Client({ region: 'us-west-2' });
    const ses = new SESClient({ region: 'us-west-2' });
    const lambda = new LambdaClient({ region: 'us-west-2' });

    // Step 1: Clean up Route53 hosted zones
    console.log('1️⃣ Cleaning up Route53 hosted zones...');
    try {
      const hostedZones = await route53.send(new ListHostedZonesCommand({}));
      
      for (const zone of hostedZones.HostedZones) {
        if (zone.Name.includes('sandbox.stackpro') || zone.Name.includes('stackpro.io')) {
          console.log(`   🗑️  Found hosted zone: ${zone.Name} (${zone.Id})`);
          
          try {
            // List records first to document what we're deleting
            const records = await route53.send(new ListResourceRecordSetsCommand({
              HostedZoneId: zone.Id
            }));
            
            // Delete the hosted zone (this will fail if there are non-default records)
            console.log(`   ⚠️  WARNING: Would delete hosted zone ${zone.Name}`);
            console.log(`      Records in zone: ${records.ResourceRecordSets.length}`);
            
            // For safety, we'll document but not actually delete yet
            cleanupResults.resources.route53.push({
              name: zone.Name,
              id: zone.Id,
              recordCount: records.ResourceRecordSets.length,
              action: 'MARKED_FOR_DELETION',
              manualCleanupRequired: true
            });
            
          } catch (error) {
            console.log(`   ❌ Error with zone ${zone.Name}: ${error.message}`);
            cleanupResults.resources.errors.push({
              service: 'route53',
              resource: zone.Name,
              error: error.message
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Route53 cleanup failed: ${error.message}`);
      cleanupResults.resources.errors.push({
        service: 'route53',
        error: error.message
      });
    }

    // Step 2: Clean up SES identities
    console.log('\n2️⃣ Cleaning up SES identities...');
    try {
      const identities = await ses.send(new ListIdentitiesCommand({}));
      
      for (const identity of identities.Identities) {
        if (identity.includes('stackpro.io') || identity.includes('sandbox.stackpro')) {
          console.log(`   🗑️  Found SES identity: ${identity}`);
          
          try {
            // Document but don't delete yet for safety
            console.log(`   ⚠️  WARNING: Would delete SES identity ${identity}`);
            
            cleanupResults.resources.ses.push({
              identity: identity,
              action: 'MARKED_FOR_DELETION',
              manualCleanupRequired: true
            });
            
          } catch (error) {
            console.log(`   ❌ Error with identity ${identity}: ${error.message}`);
            cleanupResults.resources.errors.push({
              service: 'ses',
              resource: identity,
              error: error.message
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ SES cleanup failed: ${error.message}`);
      cleanupResults.resources.errors.push({
        service: 'ses',
        error: error.message
      });
    }

    // Step 3: Clean up Lambda functions
    console.log('\n3️⃣ Cleaning up Lambda functions...');
    try {
      const functions = await lambda.send(new ListFunctionsCommand({}));
      
      for (const func of functions.Functions) {
        if (func.FunctionName.includes('stackpro') || func.FunctionName.includes('email-forwarder')) {
          console.log(`   🗑️  Found Lambda function: ${func.FunctionName}`);
          
          try {
            // Document but don't delete yet for safety
            console.log(`   ⚠️  WARNING: Would delete Lambda function ${func.FunctionName}`);
            
            cleanupResults.resources.lambda.push({
              functionName: func.FunctionName,
              runtime: func.Runtime,
              action: 'MARKED_FOR_DELETION',
              manualCleanupRequired: true
            });
            
          } catch (error) {
            console.log(`   ❌ Error with function ${func.FunctionName}: ${error.message}`);
            cleanupResults.resources.errors.push({
              service: 'lambda',
              resource: func.FunctionName,
              error: error.message
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Lambda cleanup failed: ${error.message}`);
      cleanupResults.resources.errors.push({
        service: 'lambda',
        error: error.message
      });
    }

    // Step 4: Generate cleanup summary
    console.log('\n📋 Cleanup Summary:');
    console.log(`   Route53 zones marked: ${cleanupResults.resources.route53.length}`);
    console.log(`   SES identities marked: ${cleanupResults.resources.ses.length}`);
    console.log(`   Lambda functions marked: ${cleanupResults.resources.lambda.length}`);
    console.log(`   Errors encountered: ${cleanupResults.resources.errors.length}`);

    // Save cleanup results
    fs.writeFileSync('config/wrong-account-cleanup-results.json', JSON.stringify(cleanupResults, null, 2));
    console.log('\n💾 Saved cleanup results to: config/wrong-account-cleanup-results.json');

    // Generate manual cleanup commands
    const cleanupCommands = generateCleanupCommands(cleanupResults);
    fs.writeFileSync('scripts/manual-cleanup-commands.sh', cleanupCommands);
    console.log('💾 Saved manual cleanup commands to: scripts/manual-cleanup-commands.sh');

    console.log('\n⚠️  IMPORTANT: Resources were MARKED for deletion but NOT actually deleted for safety.');
    console.log('   Review the cleanup results and run manual commands if you want to proceed.');

    return cleanupResults;

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return false;
  }
}

function generateCleanupCommands(results) {
  let commands = `#!/bin/bash

# Manual Cleanup Commands for Wrong Account Resources
# Account: ${wrongAccountId} 
# Generated: ${results.timestamp}

echo "🧹 Cleaning up resources from wrong account..."
echo "⚠️  WARNING: This will PERMANENTLY DELETE resources!"
read -p "Are you sure you want to proceed? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

`;

  // Route53 cleanup commands
  if (results.resources.route53.length > 0) {
    commands += `
# Clean up Route53 hosted zones
echo "Deleting Route53 hosted zones..."
`;
    for (const zone of results.resources.route53) {
      commands += `echo "Deleting hosted zone: ${zone.name}"
aws route53 delete-hosted-zone --id ${zone.id}
`;
    }
  }

  // SES cleanup commands  
  if (results.resources.ses.length > 0) {
    commands += `
# Clean up SES identities
echo "Deleting SES identities..."
`;
    for (const identity of results.resources.ses) {
      commands += `echo "Deleting SES identity: ${identity.identity}"
aws ses delete-identity --identity ${identity.identity}
`;
    }
  }

  // Lambda cleanup commands
  if (results.resources.lambda.length > 0) {
    commands += `
# Clean up Lambda functions
echo "Deleting Lambda functions..."
`;
    for (const func of results.resources.lambda) {
      commands += `echo "Deleting Lambda function: ${func.functionName}"
aws lambda delete-function --function-name ${func.functionName}
`;
    }
  }

  commands += `
echo "✅ Cleanup complete!"
echo "🔍 Verify resources are gone:"
echo "   aws route53 list-hosted-zones"
echo "   aws ses list-identities"  
echo "   aws lambda list-functions"
`;

  return commands;
}

// Run if called directly
if (require.main === module) {
  cleanupWrongAccountResources().catch(console.error);
}

module.exports = { cleanupWrongAccountResources };
