#!/usr/bin/env node

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
    const sources = await httpRequest(`${baseUrl}/api/data-ingestion/v1/sources`);
    if (sources.status === 200 && sources.data.degraded === true) {
      console.log('✅ PASS: Degraded mode (flag OFF)');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected degraded mode when flag OFF');
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Sources request failed - ${error.message}`);
    testsFailed++;
  }
  
  // Test 2: Register mock dataset
  try {
    const dataset = await httpRequest(`${baseUrl}/api/data-ingestion/v1/datasets`, {
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
    console.log(`❌ FAIL: Dataset registration failed - ${error.message}`);
    testsFailed++;
  }
  
  // Test 3: Ingest workflow
  try {
    const initResult = await httpRequest(`${baseUrl}/api/data-ingestion/v1/ingest/init`, {
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
    console.log(`❌ FAIL: Ingest init failed - ${error.message}`);
    testsFailed++;
  }
  
  // Test 4: Job status
  try {
    const jobStatus = await httpRequest(`${baseUrl}/api/data-ingestion/v1/jobs/test-job`);
    
    if (jobStatus.status === 200 && jobStatus.data.degraded === true) {
      console.log('✅ PASS: Job status degraded (flag OFF)');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Expected degraded job status');
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: Job status failed - ${error.message}`);
    testsFailed++;
  }
  
  // Final Summary
  console.log(`\n🎯 Dataset Ingestion Test Results:`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📊 Total: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All Dataset Ingestion tests PASSED!');
    process.exit(0);
  } else {
    console.log('\n💥 Some Dataset Ingestion tests FAILED!');
    process.exit(1);
  }
}

testDatasetIngestion().catch(console.error);
