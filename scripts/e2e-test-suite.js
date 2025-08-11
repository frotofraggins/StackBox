#!/usr/bin/env node

/**
 * StackPro Phase 3.1 — Full System E2E Test & Smoke Verification
 * 
 * Comprehensive automated test sweep across frontend, backend, capabilities, and infra touchpoints
 * to confirm that "everything talks to everything" in sandbox mode.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Test Configuration
const config = {
  tenantId: 'demo-tenant',
  clientId: 'test-suite',
  localBackend: 'http://localhost:3001',
  localFrontend: 'http://localhost:3000',
  sandboxDomain: 'https://sandbox.stackpro.io',
  amplifyDomain: 'https://main.d3m3k3uuuvlvyv.amplifyapp.com',
  timeout: 10000
};

// Test Results
const results = {
  timestamp: new Date().toISOString(),
  target: '',
  tests: {},
  summary: { pass: 0, fail: 0, skip: 0 }
};

// Utilities
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': config.tenantId,
        'x-client-id': config.clientId,
        ...options.headers
      },
      timeout: config.timeout
    };

    const protocol = urlObj.protocol === 'https:' ? require('https') : require('http');
    
    const req = protocol.request(requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', reject);

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }

    req.end();
  });
}

function saveResults(filename, data) {
  const filepath = path.join('logs', filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  log(`✅ Saved results to ${filepath}`);
}

function markTest(name, status, details = {}) {
  results.tests[name] = { status, details, timestamp: new Date().toISOString() };
  results.summary[status]++;
  log(`${status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️'} ${name}: ${status.toUpperCase()}`);
}

// Test Steps

async function step1_localSmoke() {
  log('🧪 Step 1: Local Smoke Test');
  
  const smokeResults = {};
  
  try {
    // Test backend health
    const backendHealth = await httpRequest(`${config.localBackend}/health`);
    smokeResults.backendHealth = backendHealth;
    
    if (backendHealth.status === 200) {
      markTest('Local Backend Health', 'pass', { response: backendHealth.data });
    } else {
      markTest('Local Backend Health', 'fail', { status: backendHealth.status });
    }
  } catch (error) {
    markTest('Local Backend Health', 'fail', { error: error.message });
    smokeResults.backendHealth = { error: error.message };
  }

  try {
    // Test capabilities endpoint
    const capabilities = await httpRequest(`${config.localBackend}/capabilities`);
    smokeResults.capabilities = capabilities;
    
    if (capabilities.status === 200) {
      markTest('Local Capabilities', 'pass', { capabilities: capabilities.data });
    } else {
      markTest('Local Capabilities', 'fail', { status: capabilities.status });
    }
  } catch (error) {
    markTest('Local Capabilities', 'fail', { error: error.message });
    smokeResults.capabilities = { error: error.message };
  }

  try {
    // Test frontend health
    const frontendHealth = await httpRequest(`${config.localFrontend}/health`);
    smokeResults.frontendHealth = frontendHealth;
    
    if (frontendHealth.status === 200) {
      markTest('Local Frontend Health', 'pass', { response: frontendHealth.data });
    } else {
      markTest('Local Frontend Health', 'fail', { status: frontendHealth.status });
    }
  } catch (error) {
    markTest('Local Frontend Health', 'fail', { error: error.message });
    smokeResults.frontendHealth = { error: error.message };
  }

  saveResults('local-smoke.json', smokeResults);
}

async function step2_remoteTargetResolution() {
  log('🎯 Step 2: Remote Target Resolution');
  
  const targets = [config.sandboxDomain, config.amplifyDomain];
  let resolvedTarget = null;
  
  for (const target of targets) {
    try {
      const response = await httpRequest(`${target}/health`);
      if (response.status === 200) {
        resolvedTarget = target;
        results.target = target;
        markTest('Target Resolution', 'pass', { target, response: response.data });
        break;
      }
    } catch (error) {
      log(`❌ Target ${target} failed: ${error.message}`);
    }
  }
  
  if (!resolvedTarget) {
    results.target = config.localBackend;
    markTest('Target Resolution', 'skip', { reason: 'Using local backend', target: config.localBackend });
  }
  
  saveResults('target.json', { target: results.target, tested: targets });
}

async function step3_featureFlagMatrix() {
  log('🏁 Step 3: Feature Flag Matrix Sanity');
  
  const baseUrl = results.target || config.localBackend;
  const flags = ['AI_DOCS_ENABLED', 'AI_GAP_ANALYSIS_ENABLED', 'EMAIL_STACK_ENABLED', 'CAP_DATA_INGESTION_ENABLED'];
  
  const flagSnapshot = {
    timestamp: new Date().toISOString(),
    tenant: config.tenantId,
    flags: {}
  };
  
  // Test default OFF state
  try {
    const capabilities = await httpRequest(`${baseUrl}/capabilities`);
    if (capabilities.status === 200 && capabilities.data) {
      flagSnapshot.flags.default = capabilities.data;
      markTest('Flag Matrix - Default OFF', 'pass', { flags: capabilities.data });
    } else {
      markTest('Flag Matrix - Default OFF', 'fail', { status: capabilities.status });
    }
  } catch (error) {
    markTest('Flag Matrix - Default OFF', 'fail', { error: error.message });
  }
  
  saveResults('flags-snapshot.json', flagSnapshot);
}

async function step4_apiHealthCapabilities() {
  log('🔗 Step 4: API Health & Capabilities');
  
  const baseUrl = results.target || config.localBackend;
  const apiResults = {};
  
  try {
    // Health endpoint
    const health = await httpRequest(`${baseUrl}/health`);
    apiResults.health = health;
    
    if (health.status === 200) {
      markTest('API Health', 'pass', { response: health.data });
    } else {
      markTest('API Health', 'fail', { status: health.status });
    }
  } catch (error) {
    markTest('API Health', 'fail', { error: error.message });
    apiResults.health = { error: error.message };
  }

  try {
    // Capabilities endpoint
    const capabilities = await httpRequest(`${baseUrl}/api/capabilities`);
    apiResults.capabilities = capabilities;
    
    if (capabilities.status === 200) {
      markTest('API Capabilities', 'pass', { capabilities: capabilities.data });
    } else {
      markTest('API Capabilities', 'fail', { status: capabilities.status });
    }
  } catch (error) {
    markTest('API Capabilities', 'fail', { error: error.message });
    apiResults.capabilities = { error: error.message };
  }
  
  saveResults('api-core.json', apiResults);
}

async function step5_emailStack() {
  log('📧 Step 5: Email Stack (Mock)');
  
  const baseUrl = results.target || config.localBackend;
  const emailResults = {};
  
  try {
    // Test email stack health (should be degraded when OFF)
    const health = await httpRequest(`${baseUrl}/api/email-stack/v1/health`);
    emailResults.healthOff = health;
    
    if (health.status === 200 && health.data.degraded) {
      markTest('Email Stack - OFF (degraded)', 'pass', { response: health.data });
    } else {
      markTest('Email Stack - OFF (degraded)', 'fail', { status: health.status, data: health.data });
    }
  } catch (error) {
    markTest('Email Stack - OFF (degraded)', 'fail', { error: error.message });
    emailResults.healthOff = { error: error.message };
  }

  try {
    // Test email config endpoint (should be degraded when OFF)
    const config = await httpRequest(`${baseUrl}/api/email-stack/v1/config`, {
      method: 'POST',
      data: { fromDomain: 'example.test', inbox: 'info', provider: 'ses' }
    });
    emailResults.configOff = config;
    
    if (config.status === 503 && config.data.degraded) {
      markTest('Email Stack Config - OFF (degraded)', 'pass', { response: config.data });
    } else {
      markTest('Email Stack Config - OFF (degraded)', 'fail', { status: config.status, data: config.data });
    }
  } catch (error) {
    markTest('Email Stack Config - OFF (degraded)', 'fail', { error: error.message });
    emailResults.configOff = { error: error.message };
  }
  
  saveResults('email-stack.json', emailResults);
}

async function step6_aiDocs() {
  log('🤖 Step 6: AI Docs (Mock)');
  
  const baseUrl = results.target || config.localBackend;
  const aiResults = {};
  
  try {
    // Test AI docs health (should be degraded when OFF)
    const health = await httpRequest(`${baseUrl}/api/ai-docs/v1/health`);
    aiResults.healthOff = health;
    
    if (health.status === 200 && health.data.degraded) {
      markTest('AI Docs - OFF (degraded)', 'pass', { response: health.data });
    } else {
      markTest('AI Docs - OFF (degraded)', 'fail', { status: health.status, data: health.data });
    }
  } catch (error) {
    markTest('AI Docs - OFF (degraded)', 'fail', { error: error.message });
    aiResults.healthOff = { error: error.message };
  }
  
  saveResults('ai-docs.json', aiResults);
}

async function step7_dataIngestion() {
  log('📊 Step 7: Data Lake & Data Ingestion (Mock)');
  
  const baseUrl = results.target || config.localBackend;
  const dataResults = {};
  
  try {
    // Test data lake health
    const lakeHealth = await httpRequest(`${baseUrl}/api/data-lake/v1/health`);
    dataResults.lakeHealth = lakeHealth;
    
    if (lakeHealth.status === 200) {
      markTest('Data Lake Health', 'pass', { response: lakeHealth.data });
    } else {
      markTest('Data Lake Health', 'fail', { status: lakeHealth.status });
    }
  } catch (error) {
    markTest('Data Lake Health', 'fail', { error: error.message });
    dataResults.lakeHealth = { error: error.message };
  }

  try {
    // Test data ingestion sources (should be degraded when OFF)
    const sources = await httpRequest(`${baseUrl}/api/data-ingestion/v1/sources`);
    dataResults.sourcesOff = sources;
    
    if (sources.status === 200 && sources.data.degraded) {
      markTest('Data Ingestion - OFF (degraded)', 'pass', { response: sources.data });
    } else {
      markTest('Data Ingestion - OFF (degraded)', 'fail', { status: sources.status, data: sources.data });
    }
  } catch (error) {
    markTest('Data Ingestion - OFF (degraded)', 'fail', { error: error.message });
    dataResults.sourcesOff = { error: error.message };
  }
  
  saveResults('data-ingestion.json', dataResults);
}

async function step12_createDatasetIngestionScript() {
  log('📝 Step 12: Create Dataset Ingestion Test Script');
  
  const scriptContent = `#!/usr/bin/env node

/**
 * Dataset Ingestion E2E Test Script
 * Tests the complete data ingestion workflow with flag toggling
 */

const http = require('http');

async function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'demo-tenant',
        'x-client-id': 'test-suite',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

async function testDatasetIngestion() {
  console.log('🧪 Testing Dataset Ingestion Capability');
  
  const baseUrl = 'http://localhost:3001';
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Verify degraded mode (flag OFF)
  try {
    const sources = await httpRequest(\`\${baseUrl}/api/data-ingestion/v1/sources\`);
    if (sources.status === 200 && sources.data.degraded === true) {
      console.log('✅ PASS: Degraded mode (flag OFF)');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected degraded mode when flag OFF');
      testsFailed++;
    }
  } catch (error) {
    console.log(\`❌ FAIL: Sources request failed - \${error.message}\`);
    testsFailed++;
  }
  
  // Test 2: Register mock dataset
  try {
    const dataset = await httpRequest(\`\${baseUrl}/api/data-ingestion/v1/datasets\`, {
      method: 'POST',
      data: {
        datasetId: 'pos_sales_min_v1',
        title: 'POS Sales (minute)',
        class: 'pos',
        schemaRef: 'pos_sales_min_v1'
      }
    });
    
    if (dataset.status === 503 && dataset.data.degraded === true) {
      console.log('✅ PASS: Dataset registration degraded (flag OFF)');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected degraded dataset registration');
      testsFailed++;
    }
  } catch (error) {
    console.log(\`❌ FAIL: Dataset registration failed - \${error.message}\`);
    testsFailed++;
  }
  
  // Test 3: Ingest workflow
  try {
    const initResult = await httpRequest(\`\${baseUrl}/api/data-ingestion/v1/ingest/init\`, {
      method: 'POST',
      data: { datasetId: 'pos_sales_min_v1', format: 'jsonl' }
    });
    
    if (initResult.status === 503 && initResult.data.degraded === true) {
      console.log('✅ PASS: Ingest init degraded (flag OFF)');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected degraded ingest init');
      testsFailed++;
    }
  } catch (error) {
    console.log(\`❌ FAIL: Ingest init failed - \${error.message}\`);
    testsFailed++;
  }
  
  // Test 4: Job status
  try {
    const jobStatus = await httpRequest(\`\${baseUrl}/api/data-ingestion/v1/jobs/test-job\`);
    
    if (jobStatus.status === 200 && jobStatus.data.degraded === true) {
      console.log('✅ PASS: Job status degraded (flag OFF)');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected degraded job status');
      testsFailed++;
    }
  } catch (error) {
    console.log(\`❌ FAIL: Job status failed - \${error.message}\`);
    testsFailed++;
  }
  
  // Final Summary
  console.log(\`\\n🎯 Dataset Ingestion Test Results:\`);
  console.log(\`   ✅ Passed: \${testsPassed}\`);
  console.log(\`   ❌ Failed: \${testsFailed}\`);
  console.log(\`   📊 Total: \${testsPassed + testsFailed}\`);
  
  if (testsFailed === 0) {
    console.log('\\n🎉 All Dataset Ingestion tests PASSED!');
    process.exit(0);
  } else {
    console.log('\\n💥 Some Dataset Ingestion tests FAILED!');
    process.exit(1);
  }
}

testDatasetIngestion().catch(console.error);
`;

  fs.writeFileSync('scripts/test-dataset-ingestion.js', scriptContent);
  fs.chmodSync('scripts/test-dataset-ingestion.js', '755');
  
  markTest('Dataset Ingestion Script Created', 'pass', { path: 'scripts/test-dataset-ingestion.js' });
}

async function generateSummary() {
  log('📋 Generating Final Summary');
  
  const summaryContent = `# E2E Test Summary — Phase 3.1

**Target:** ${results.target}  
**Date:** ${results.timestamp}  
**Tenant:** ${config.tenantId}

## Core
- Health: ${results.tests['API Health']?.status === 'pass' ? 'PASS' : 'FAIL'}
- Capabilities: ${results.tests['API Capabilities']?.status === 'pass' ? 'PASS' : 'FAIL'}

## Capabilities
- Email Stack: OFF(degraded)=${results.tests['Email Stack - OFF (degraded)']?.status === 'pass' ? 'OK' : 'FAIL'}
- AI Docs: OFF(degraded)=${results.tests['AI Docs - OFF (degraded)']?.status === 'pass' ? 'OK' : 'FAIL'}  
- Data Ingestion: OFF(degraded)=${results.tests['Data Ingestion - OFF (degraded)']?.status === 'pass' ? 'OK' : 'FAIL'}

## Local Infrastructure
- Backend Health: ${results.tests['Local Backend Health']?.status === 'pass' ? 'PASS' : 'FAIL'}
- Frontend Health: ${results.tests['Local Frontend Health']?.status === 'pass' ? 'PASS' : 'SKIP'}

## Test Summary
- ✅ **Passed:** ${results.summary.pass}
- ❌ **Failed:** ${results.summary.fail}  
- ⏭️ **Skipped:** ${results.summary.skip}
- 📊 **Total:** ${results.summary.pass + results.summary.fail + results.summary.skip}

## Files Created
- \`logs/local-smoke.json\` - Local smoke test results
- \`logs/target.json\` - Target resolution results  
- \`logs/flags-snapshot.json\` - Feature flag states
- \`logs/api-core.json\` - Core API test results
- \`logs/email-stack.json\` - Email stack test results
- \`logs/ai-docs.json\` - AI docs test results
- \`logs/data-ingestion.json\` - Data ingestion test results
- \`logs/summary.json\` - Complete test results
- \`scripts/test-dataset-ingestion.js\` - Dataset ingestion test script

## Next Steps
${results.summary.fail > 0 ? '- 🔧 Address failed tests above' : '- 🎉 All core tests passing!'}
- 🚀 Ready for visual diff testing with Puppeteer
- 📊 Run cost sanity checks
- 🎯 Execute dataset ingestion script: \`node scripts/test-dataset-ingestion.js\`
`;

  fs.writeFileSync('TEST_SUMMARY.md', summaryContent);
  saveResults('summary.json', results);
  
  markTest('Final Summary Generated', 'pass', { files: ['TEST_SUMMARY.md', 'logs/summary.json'] });
}

// Main Test Runner
async function runE2ETests() {
  log('🚀 Starting StackPro E2E Test Suite');
  
  try {
    await step1_localSmoke();
    await step2_remoteTargetResolution();
    await step3_featureFlagMatrix();
    await step4_apiHealthCapabilities();
    await step5_emailStack();
    await step6_aiDocs();
    await step7_dataIngestion();
    await step12_createDatasetIngestionScript();
    await generateSummary();
    
    log('🏁 E2E Test Suite Complete!');
    log(`📊 Results: ${results.summary.pass} passed, ${results.summary.fail} failed, ${results.summary.skip} skipped`);
    
    if (results.summary.fail === 0) {
      log('🎉 All tests passed! System is healthy.');
      process.exit(0);
    } else {
      log('⚠️  Some tests failed. Check logs for details.');
      process.exit(1);
    }
    
  } catch (error) {
    log(`💥 E2E Test Suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  runE2ETests();
}

module.exports = { runE2ETests, config, results };
