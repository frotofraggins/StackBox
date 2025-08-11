#!/usr/bin/env node

/**
 * Performance Baseline Script
 * Captures latency/p95 metrics before feature rollout
 */

const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');

class PerformanceBaseline {
  constructor(baseUrl = 'https://sandbox.stackpro.io') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl,
      tests: []
    };
  }

  async measureRequest(path, samples = 10) {
    const latencies = [];
    const endpoint = `${this.baseUrl}${path}`;
    
    console.log(`🔍 Testing ${endpoint} (${samples} samples)`);
    
    for (let i = 0; i < samples; i++) {
      try {
        const start = performance.now();
        
        await new Promise((resolve, reject) => {
          const req = https.get(endpoint, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
          });
          
          req.on('error', reject);
          req.setTimeout(5000, () => reject(new Error('Timeout')));
        });
        
        const end = performance.now();
        const latency = end - start;
        latencies.push(latency);
        
        process.stdout.write(`.`);
      } catch (error) {
        console.log(`❌ Sample ${i + 1} failed: ${error.message}`);
        latencies.push(null);
      }
    }
    
    console.log(''); // New line after dots
    
    const validLatencies = latencies.filter(l => l !== null);
    if (validLatencies.length === 0) {
      return { endpoint, error: 'All samples failed' };
    }
    
    const sorted = validLatencies.sort((a, b) => a - b);
    const avg = validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    return {
      endpoint,
      samples: validLatencies.length,
      metrics: {
        avg: Math.round(avg * 100) / 100,
        p50: Math.round(p50 * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
        p99: Math.round(p99 * 100) / 100,
        min: Math.round(Math.min(...validLatencies) * 100) / 100,
        max: Math.round(Math.max(...validLatencies) * 100) / 100
      }
    };
  }

  async runBaseline() {
    console.log('🚀 Starting Performance Baseline');
    console.log(`📊 Target: ${this.baseUrl}`);
    
    const endpoints = [
      '/health',
      '/api/capabilities',
      '/',
      '/features',
      '/pricing'
    ];
    
    for (const endpoint of endpoints) {
      const result = await this.measureRequest(endpoint, 10);
      this.results.tests.push(result);
      
      if (result.error) {
        console.log(`❌ ${endpoint}: ${result.error}`);
      } else {
        console.log(`✅ ${endpoint}: avg=${result.metrics.avg}ms, p95=${result.metrics.p95}ms`);
      }
    }
    
    // Save results
    fs.mkdirSync('logs', { recursive: true });
    const filename = `logs/performance-baseline-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📊 Performance Baseline Complete`);
    console.log(`💾 Results saved to: ${filename}`);
    
    return this.results;
  }
}

// Run if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'https://sandbox.stackpro.io';
  const baseline = new PerformanceBaseline(baseUrl);
  
  baseline.runBaseline().then(results => {
    const allSuccess = results.tests.every(test => !test.error);
    process.exit(allSuccess ? 0 : 1);
  }).catch(err => {
    console.error('❌ Performance baseline failed:', err);
    process.exit(1);
  });
}

module.exports = { PerformanceBaseline };
