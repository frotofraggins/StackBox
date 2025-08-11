#!/usr/bin/env node

/**
 * StackPro Deployment Pipeline Test Script
 * Tests the complete signup → AWS infrastructure deployment flow
 */

const axios = require('axios');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// Test configuration
const TEST_CONFIG = {
  apiUrl: 'http://localhost:3002',
  frontendUrl: 'http://localhost:3000',
  testClient: {
    firstName: 'John',
    lastName: 'Smith',
    email: `test+${Date.now()}@example.com`,
    businessName: 'Smith Real Estate',
    businessType: 'real-estate',
    phone: '(555) 123-4567',
    domain: `testclient${Date.now()}`,
    features: {
      website: true,
      crm: true,
      filePortal: true,
      aiAssistant: false,
      bookingSystem: false
    },
    plan: 'trial'
  }
};

async function waitForDeployment(clientId, timeout = 600000) { // 10 minutes
  const startTime = Date.now();
  let lastStatus = '';
  
  log(`⏳ Polling deployment status for client: ${clientId}`, 'blue');
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await axios.get(`${TEST_CONFIG.apiUrl}/api/deployment-status/${clientId}`);
      const deploymentData = response.data.status || response.data;
      
      // Parse status from the deployment data
      let status = 'in-progress';
      let currentStep = 'Starting deployment...';
      
      if (typeof deploymentData === 'object') {
        status = deploymentData.phase || deploymentData.status || 'in-progress';
        currentStep = deploymentData.currentStep || deploymentData.message || 'Deploying infrastructure...';
        
        // Check for completion or failure indicators
        if (deploymentData.completed === true || status === 'completed') {
          status = 'completed';
        } else if (deploymentData.failed === true || status === 'failed' || deploymentData.error) {
          status = 'failed';
        }
      }
      
      if (status !== lastStatus) {
        log(`📊 Status: ${status} - ${currentStep}`, 'blue');
        lastStatus = status;
      }
      
      if (status === 'completed') {
        log('✅ Deployment completed successfully!', 'green');
        return { success: true, data: response.data };
      }
      
      if (status === 'failed') {
        log('❌ Deployment failed!', 'red');
        return { success: false, error: deploymentData.error || 'Deployment failed' };
      }
      
      // Wait 15 seconds before next poll (reduced frequency to avoid rate limits)
      await new Promise(resolve => setTimeout(resolve, 15000));
      
    } catch (error) {
      log(`⚠️  Error polling status: ${error.message}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  log('⏰ Deployment timeout reached', 'red');
  return { success: false, error: 'Deployment timeout' };
}

async function testAPIHealth() {
  log('🔍 Testing API health...', 'blue');
  
  try {
    const response = await axios.get(`${TEST_CONFIG.apiUrl}/health`);
    
    if (response.data.status === 'healthy') {
      log('✅ API server is healthy', 'green');
      return true;
    } else {
      log('❌ API server unhealthy', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ API server not responding: ${error.message}`, 'red');
    log('💡 Make sure API server is running: npm run dev', 'yellow');
    return false;
  }
}

async function testSignupEndpoint() {
  log('📝 Testing signup endpoint...', 'blue');
  
  try {
    const signupData = {
      firstName: TEST_CONFIG.testClient.firstName,
      lastName: TEST_CONFIG.testClient.lastName,
      email: TEST_CONFIG.testClient.email,
      company: TEST_CONFIG.testClient.businessName,
      password: 'testpass123',
      plan: TEST_CONFIG.testClient.plan
    };
    
    const response = await axios.post(`${TEST_CONFIG.apiUrl}/api/auth/signup`, signupData);
    
    if (response.data.success) {
      const clientId = response.data.user?.clientId || response.data.clientId;
      log(`✅ Signup successful - Client ID: ${clientId}`, 'green');
      return { success: true, clientId: clientId };
    } else {
      log(`❌ Signup failed: ${response.data.message}`, 'red');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Signup request failed: ${error.message}`, 'red');
    if (error.response) {
      log(`📄 Response: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
    }
    return { success: false };
  }
}

async function testAWSCredentials() {
  log('☁️  Testing AWS credentials...', 'blue');
  
  try {
    const output = execSync('aws sts get-caller-identity', { encoding: 'utf-8' });
    const identity = JSON.parse(output);
    
    log(`✅ AWS credentials valid - Account: ${identity.Account}`, 'green');
    return true;
  } catch (error) {
    log('❌ AWS credentials not configured', 'red');
    log('💡 Run: aws configure', 'yellow');
    return false;
  }
}

async function testDeploymentResources(clientId) {
  log('🔧 Testing deployed resources...', 'blue');
  
  const checks = [];
  
  // Check EC2 instances
  try {
    const ec2Output = execSync(
      `aws ec2 describe-instances --filters "Name=tag:ClientId,Values=${clientId}" --query 'Reservations[*].Instances[*].[InstanceId,State.Name]' --output json`,
      { encoding: 'utf-8' }
    );
    
    const instances = JSON.parse(ec2Output);
    const runningInstances = instances.flat().filter(([id, state]) => state === 'running');
    
    if (runningInstances.length > 0) {
      log(`✅ EC2 instances running: ${runningInstances.length}`, 'green');
      checks.push(true);
    } else {
      log('❌ No running EC2 instances found', 'red');
      checks.push(false);
    }
  } catch (error) {
    log(`⚠️  Could not check EC2 instances: ${error.message}`, 'yellow');
    checks.push(false);
  }
  
  // Check S3 buckets
  try {
    const s3Output = execSync('aws s3 ls', { encoding: 'utf-8' });
    const clientBuckets = s3Output.split('\n').filter(line => line.includes(clientId.toLowerCase()));
    
    if (clientBuckets.length > 0) {
      log(`✅ S3 buckets created: ${clientBuckets.length}`, 'green');
      checks.push(true);
    } else {
      log('❌ No client S3 buckets found', 'red');
      checks.push(false);
    }
  } catch (error) {
    log(`⚠️  Could not check S3 buckets: ${error.message}`, 'yellow');
    checks.push(false);
  }
  
  return checks.every(check => check);
}

async function runFullDeploymentTest() {
  log('🚀 STACKPRO DEPLOYMENT PIPELINE TEST', 'bold');
  log('=' .repeat(50), 'blue');
  
  const startTime = Date.now();
  
  // Step 1: Test prerequisites
  log('\n🔧 Step 1: Testing prerequisites...', 'bold');
  
  const apiHealthy = await testAPIHealth();
  if (!apiHealthy) {
    log('❌ Test failed - API server not available', 'red');
    process.exit(1);
  }
  
  const awsConfigured = await testAWSCredentials();
  if (!awsConfigured) {
    log('❌ Test failed - AWS not configured', 'red');
    process.exit(1);
  }
  
  // Step 2: Test signup
  log('\n📝 Step 2: Testing signup...', 'bold');
  
  const signupResult = await testSignupEndpoint();
  if (!signupResult.success) {
    log('❌ Test failed - Signup endpoint failed', 'red');
    process.exit(1);
  }
  
  const clientId = signupResult.clientId;
  log(`📋 Test client created: ${clientId}`, 'blue');
  
  // Step 3: Wait for deployment
  log('\n⏳ Step 3: Waiting for deployment to complete...', 'bold');
  
  const deploymentResult = await waitForDeployment(clientId);
  if (!deploymentResult.success) {
    log('❌ Test failed - Deployment did not complete', 'red');
    log(`💡 Check deployment logs for client: ${clientId}`, 'yellow');
    process.exit(1);
  }
  
  // Step 4: Test deployed resources
  log('\n🔍 Step 4: Verifying deployed resources...', 'bold');
  
  const resourcesOk = await testDeploymentResources(clientId);
  if (!resourcesOk) {
    log('⚠️  Some resources may not be properly deployed', 'yellow');
  }
  
  // Step 5: Test dashboard access
  log('\n🎯 Step 5: Testing dashboard access...', 'bold');
  
  const dashboardUrl = `${TEST_CONFIG.frontendUrl}/dashboard?client=${clientId}`;
  log(`📊 Dashboard URL: ${dashboardUrl}`, 'blue');
  
  try {
    const dashboardResponse = await axios.get(dashboardUrl);
    if (dashboardResponse.status === 200) {
      log('✅ Dashboard accessible', 'green');
    } else {
      log('⚠️  Dashboard may have issues', 'yellow');
    }
  } catch (error) {
    log('⚠️  Could not verify dashboard access', 'yellow');
  }
  
  // Final results
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  
  log('\n' + '=' .repeat(50), 'blue');
  log('🎉 DEPLOYMENT TEST COMPLETED!', 'green');
  log(`⏱️  Total time: ${totalTime} seconds`, 'blue');
  log(`👤 Test client: ${TEST_CONFIG.testClient.email}`, 'blue');
  log(`🆔 Client ID: ${clientId}`, 'blue');
  log(`📊 Dashboard: ${dashboardUrl}`, 'blue');
  
  log('\n🎯 Next steps:', 'bold');
  log('1. Open the dashboard URL in your browser', 'yellow');
  log('2. Test login with the credentials', 'yellow');
  log('3. Verify CRM and file portal access', 'yellow');
  log('4. Check business website deployment', 'yellow');
  
  log('\n🗑️  Cleanup:', 'bold');
  log(`To remove test resources, run: npm run cleanup-client ${clientId}`, 'yellow');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧪 StackPro Deployment Test Script

Usage:
  node scripts/test-deployment.js                 # Run full deployment test
  node scripts/test-deployment.js --api-only     # Test API endpoints only  
  node scripts/test-deployment.js --aws-only     # Test AWS resources only

Options:
  --help, -h                                     # Show this help
  --api-only                                     # Test API endpoints only
  --aws-only                                     # Test AWS connectivity only

Before running:
  1. Start API server: npm run dev
  2. Start frontend: cd frontend && npm run dev
  3. Configure AWS credentials: aws configure
  `);
  process.exit(0);
}

if (args.includes('--api-only')) {
  log('🧪 Testing API endpoints only...', 'blue');
  Promise.all([
    testAPIHealth(),
    testSignupEndpoint()
  ]).then(() => {
    log('✅ API tests completed', 'green');
  }).catch(console.error);
} else if (args.includes('--aws-only')) {
  log('☁️  Testing AWS connectivity only...', 'blue');
  testAWSCredentials().then(() => {
    log('✅ AWS tests completed', 'green');
  }).catch(console.error);
} else {
  // Run full test
  runFullDeploymentTest().catch(console.error);
}
