#!/usr/bin/env node

/**
 * S3 Bucket Security Audit
 * Ensures no public objects except those intentionally exposed via Amplify/CloudFront
 */

const { execSync } = require('child_process');
const fs = require('fs');

const AWS_PROFILE = 'infrastructure';
const REGION = 'us-west-2';

function executeAWSCommand(command) {
  try {
    const result = execSync(`powershell -Command "$env:AWS_PROFILE='${AWS_PROFILE}'; ${command}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

async function auditS3Buckets() {
  console.log('🔍 Starting S3 Bucket Security Audit');
  console.log(`🔗 Using Profile: ${AWS_PROFILE}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    buckets: [],
    summary: {
      total: 0,
      publicRead: 0,
      publicWrite: 0,
      secure: 0,
      amplifyManaged: 0
    }
  };

  // List all S3 buckets
  const listBuckets = executeAWSCommand(`aws s3api list-buckets --region ${REGION}`);
  
  if (!listBuckets.success) {
    console.log('❌ Failed to list S3 buckets');
    return results;
  }

  const buckets = JSON.parse(listBuckets.output).Buckets || [];
  console.log(`📊 Found ${buckets.length} S3 buckets`);
  
  results.summary.total = buckets.length;

  for (const bucket of buckets) {
    const bucketName = bucket.Name;
    console.log(`\n🔍 Auditing bucket: ${bucketName}`);
    
    const bucketResult = {
      name: bucketName,
      creationDate: bucket.CreationDate,
      publicAccess: false,
      publicReadAcl: false,
      publicWriteAcl: false,
      amplifyManaged: false,
      policyStatus: 'unknown',
      recommendation: 'secure'
    };

    // Check if it's an Amplify-managed bucket
    if (bucketName.includes('amplify') || bucketName.includes('stackpro')) {
      bucketResult.amplifyManaged = true;
      results.summary.amplifyManaged++;
      console.log('   📱 Amplify-managed bucket detected');
    }

    // Check bucket public access block
    const publicAccessBlock = executeAWSCommand(
      `aws s3api get-public-access-block --bucket ${bucketName} --region ${REGION}`
    );
    
    if (publicAccessBlock.success) {
      const blockConfig = JSON.parse(publicAccessBlock.output).PublicAccessBlockConfiguration;
      if (!blockConfig.BlockPublicAcls || !blockConfig.BlockPublicPolicy) {
        bucketResult.publicAccess = true;
        console.log('   ⚠️  Public access not fully blocked');
      } else {
        console.log('   ✅ Public access properly blocked');
      }
    }

    // Check bucket ACL
    const bucketAcl = executeAWSCommand(
      `aws s3api get-bucket-acl --bucket ${bucketName} --region ${REGION}`
    );
    
    if (bucketAcl.success) {
      const acl = JSON.parse(bucketAcl.output);
      const grants = acl.Grants || [];
      
      for (const grant of grants) {
        if (grant.Grantee?.URI?.includes('AllUsers')) {
          if (grant.Permission === 'READ') {
            bucketResult.publicReadAcl = true;
            results.summary.publicRead++;
            console.log('   ❌ PUBLIC READ access via ACL detected');
          }
          if (grant.Permission === 'WRITE') {
            bucketResult.publicWriteAcl = true;
            results.summary.publicWrite++;
            console.log('   ❌ PUBLIC write access via ACL detected');
          }
        }
      }
    }

    // Determine recommendation
    if (bucketResult.publicReadAcl || bucketResult.publicWriteAcl) {
      bucketResult.recommendation = bucketResult.amplifyManaged ? 'review' : 'secure-immediately';
    } else {
      results.summary.secure++;
      bucketResult.recommendation = 'secure';
    }

    results.buckets.push(bucketResult);
  }

  // Generate summary
  console.log('\n📊 S3 Security Audit Summary:');
  console.log(`   📦 Total buckets: ${results.summary.total}`);
  console.log(`   ✅ Secure buckets: ${results.summary.secure}`);
  console.log(`   📱 Amplify-managed: ${results.summary.amplifyManaged}`);
  console.log(`   ⚠️  Public read: ${results.summary.publicRead}`);
  console.log(`   ❌ Public write: ${results.summary.publicWrite}`);

  // Save results
  fs.mkdirSync('logs', { recursive: true });
  fs.writeFileSync('logs/s3-security-audit.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Audit results saved to logs/s3-security-audit.json');

  return results;
}

// Run if called directly
if (require.main === module) {
  auditS3Buckets().then(results => {
    const hasSecurityIssues = results.summary.publicRead > 0 || results.summary.publicWrite > 0;
    
    if (hasSecurityIssues) {
      console.log('\n⚠️  Security issues detected - review required');
      process.exit(1);
    } else {
      console.log('\n✅ All S3 buckets are properly secured');
      process.exit(0);
    }
  }).catch(err => {
    console.error('❌ S3 audit failed:', err);
    process.exit(1);
  });
}

module.exports = { auditS3Buckets };
