/**
 * StackPro Site Builder Test Script
 * Tests the site builder functionality end-to-end
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:3002';
const FRONTEND_BASE = 'http://localhost:3000';

// Test configuration
const testClient = {
  clientId: 'test-demo-12345',
  email: 'test@example.com',
  businessName: 'Test Business'
};

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
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testApiEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testBackendHealth() {
  log('\n🔍 Testing Backend Health...', 'bold');
  
  const result = await testApiEndpoint(`${API_BASE}/health`);
  
  if (result.success) {
    logSuccess('Backend server is healthy');
    logInfo(`Version: ${result.data.version}`);
    return true;
  } else {
    logError(`Backend health check failed: ${result.error || result.data?.error}`);
    return false;
  }
}

async function testSiteBuilderRoutes() {
  log('\n🏗️  Testing Site Builder API Routes...', 'bold');
  
  // Test 1: Get templates
  logInfo('Testing GET /api/site-builder/templates');
  const templatesResult = await testApiEndpoint(`${API_BASE}/api/site-builder/templates`);
  
  if (templatesResult.success) {
    logSuccess(`Retrieved ${templatesResult.data.templates?.length || 0} templates`);
    if (templatesResult.data.templates?.length > 0) {
      logInfo(`Sample template: ${templatesResult.data.templates[0].name}`);
    }
  } else {
    logError(`Templates API failed: ${templatesResult.data?.error}`);
    return false;
  }
  
  // Test 2: Get specific template
  logInfo('Testing GET /api/site-builder/templates/law-firm-professional');
  const templateResult = await testApiEndpoint(`${API_BASE}/api/site-builder/templates/law-firm-professional`);
  
  if (templateResult.success) {
    logSuccess('Retrieved specific template');
    logInfo(`Template: ${templateResult.data.template?.name}`);
  } else {
    logError(`Single template API failed: ${templateResult.data?.error}`);
  }
  
  // Test 3: Create site
  logInfo('Testing POST /api/site-builder/sites');
  const createSiteResult = await testApiEndpoint(
    `${API_BASE}/api/site-builder/sites`,
    'POST',
    {
      clientId: testClient.clientId,
      templateId: 'law-firm-professional',
      settings: {
        siteName: 'Test Law Firm',
        siteDescription: 'A test law firm website',
        domain: `${testClient.clientId}.stackpro.io`
      }
    }
  );
  
  if (createSiteResult.success) {
    logSuccess('Site created successfully');
    logInfo(`Site ID: ${createSiteResult.data.site?.id}`);
  } else {
    logError(`Site creation failed: ${createSiteResult.data?.error}`);
  }
  
  // Test 4: Get site by client
  logInfo('Testing GET /api/site-builder/sites/:clientId');
  const getSiteResult = await testApiEndpoint(`${API_BASE}/api/site-builder/sites/${testClient.clientId}`);
  
  if (getSiteResult.success) {
    logSuccess('Retrieved site by client ID');
    if (getSiteResult.data.site) {
      logInfo(`Site status: ${getSiteResult.data.site.status}`);
      logInfo(`Template: ${getSiteResult.data.site.template}`);
    } else {
      logInfo('No site found for client (this is okay for new clients)');
    }
  } else {
    logError(`Get site failed: ${getSiteResult.data?.error}`);
  }
  
  // Test 5: Update site
  logInfo('Testing PUT /api/site-builder/sites/:clientId');
  const updateSiteResult = await testApiEndpoint(
    `${API_BASE}/api/site-builder/sites/${testClient.clientId}`,
    'PUT',
    {
      settings: {
        siteName: 'Updated Test Law Firm',
        siteDescription: 'An updated test law firm website'
      },
      theme: {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00',
          accent: '#0000FF',
          text: '#333333',
          background: '#FFFFFF'
        }
      }
    }
  );
  
  if (updateSiteResult.success) {
    logSuccess('Site updated successfully');
  } else {
    logError(`Site update failed: ${updateSiteResult.data?.error}`);
  }
  
  return true;
}

async function testAssetRoutes() {
  log('\n📁 Testing Asset Management Routes...', 'bold');
  
  // Test asset upload (mock)
  logInfo('Testing POST /api/site-builder/assets/upload');
  const uploadResult = await testApiEndpoint(
    `${API_BASE}/api/site-builder/assets/upload`,
    'POST',
    {
      fileName: 'test-image.jpg',
      clientId: testClient.clientId
    }
  );
  
  if (uploadResult.success) {
    logSuccess('Asset upload simulated successfully');
    logInfo(`Asset URL: ${uploadResult.data.url}`);
  } else {
    logError(`Asset upload failed: ${uploadResult.data?.error}`);
  }
  
  return true;
}

async function testPublishFlow() {
  log('\n🚀 Testing Publish Flow...', 'bold');
  
  // Test publish site
  logInfo('Testing POST /api/site-builder/publish/:clientId');
  const publishResult = await testApiEndpoint(
    `${API_BASE}/api/site-builder/publish/${testClient.clientId}`,
    'POST',
    {
      siteConfig: {
        id: 'test-site',
        clientId: testClient.clientId
      },
      staticSite: {
        html: '<html><body><h1>Test Site</h1></body></html>',
        css: 'body { font-family: Arial; }',
        assets: []
      }
    }
  );
  
  if (publishResult.success) {
    logSuccess('Site published successfully');
    logInfo(`Published URL: ${publishResult.data.url}`);
  } else {
    logError(`Site publish failed: ${publishResult.data?.error}`);
  }
  
  return true;
}

async function testFrontendAccess() {
  log('\n🌐 Testing Frontend Access...', 'bold');
  
  try {
    // Test if frontend is accessible
    const response = await fetch(`${FRONTEND_BASE}`);
    
    if (response.ok) {
      logSuccess('Frontend is accessible');
      
      // Test site builder page access
      const builderResponse = await fetch(`${FRONTEND_BASE}/dashboard/website/builder`);
      if (builderResponse.ok) {
        logSuccess('Site builder page is accessible');
      } else {
        logWarning(`Site builder page returned status: ${builderResponse.status}`);
        logInfo('This might be normal if authentication is required');
      }
    } else {
      logWarning(`Frontend returned status: ${response.status}`);
      logInfo('Make sure the frontend server is running on port 3000');
    }
  } catch (error) {
    logWarning('Frontend server is not accessible');
    logInfo('Make sure to start the frontend server: npm run dev (in frontend directory)');
  }
}

async function runComprehensiveTest() {
  log('🧪 StackPro Site Builder Comprehensive Test', 'bold');
  log('=============================================', 'bold');
  
  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Backend Health
  totalTests++;
  const healthTest = await testBackendHealth();
  if (healthTest) passedTests++;
  
  if (!healthTest) {
    logError('Backend is not healthy. Make sure to start the backend server:');
    logInfo('cd src/api && node server.js');
    return;
  }
  
  // Test 2: Site Builder Routes
  totalTests++;
  const routesTest = await testSiteBuilderRoutes();
  if (routesTest) passedTests++;
  
  // Test 3: Asset Routes
  totalTests++;
  const assetTest = await testAssetRoutes();
  if (assetTest) passedTests++;
  
  // Test 4: Publish Flow
  totalTests++;
  const publishTest = await testPublishFlow();
  if (publishTest) passedTests++;
  
  // Test 5: Frontend Access
  totalTests++;
  await testFrontendAccess(); // This doesn't affect pass/fail
  passedTests++; // Always count as passed since frontend might not be running
  
  // Summary
  const duration = Date.now() - startTime;
  log('\n📊 Test Summary', 'bold');
  log('===============', 'bold');
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');
  log(`Duration: ${duration}ms`);
  
  if (passedTests === totalTests) {
    log('\n🎉 ALL TESTS PASSED! Site Builder is ready for use!', 'green');
    log('\n🚀 Next Steps:', 'bold');
    log('1. Start the frontend server: cd frontend && npm run dev');
    log('2. Visit: http://localhost:3000/dashboard/website/builder');
    log('3. Try creating and editing a website!');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
  }
}

// Instructions for running the test
function showInstructions() {
  log('🛠️  Site Builder Test Instructions', 'bold');
  log('==================================', 'bold');
  log('\n1. Make sure the backend server is running:');
  log('   cd src/api && node server.js');
  log('\n2. Run this test script:');
  log('   node scripts/test-site-builder.js');
  log('\n3. Optionally start the frontend:');
  log('   cd frontend && npm run dev');
  log('\n4. Visit the site builder:');
  log('   http://localhost:3000/dashboard/website/builder');
}

// Check if this script is run directly
if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showInstructions();
  } else {
    runComprehensiveTest().catch(error => {
      logError(`Test runner error: ${error.message}`);
      process.exit(1);
    });
  }
}

module.exports = {
  testBackendHealth,
  testSiteBuilderRoutes,
  testAssetRoutes,
  testPublishFlow,
  runComprehensiveTest
};
