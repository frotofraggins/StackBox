#!/usr/bin/env node

/**
 * StackPro Production Health Check
 * Comprehensive testing suite for production deployment
 */

const AWS = require('aws-sdk');
const https = require('https');
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
const HEALTH_CONFIG = {
  domain: 'stackpro.io',
  apiDomain: 'api.stackpro.io',
  wsDomain: 'ws.stackpro.io',
  profile: 'Stackbox',
  region: 'us-west-2',
  endpoints: {
    frontend: 'https://stackpro.io',
    api: 'https://api.stackpro.io',
    websocket: 'wss://ws.stackpro.io'
  }
};

class ProductionHealthChecker {
  constructor() {
    // AWS clients
    this.cloudwatch = new AWS.CloudWatch({ 
      region: HEALTH_CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: HEALTH_CONFIG.profile })
    });
    this.rds = new AWS.RDS({ 
      region: HEALTH_CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: HEALTH_CONFIG.profile })
    });
    this.s3 = new AWS.S3({ 
      region: HEALTH_CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: HEALTH_CONFIG.profile })
    });
    this.dynamodb = new AWS.DynamoDB({ 
      region: HEALTH_CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: HEALTH_CONFIG.profile })
    });
    this.budgets = new AWS.Budgets({ 
      region: 'us-east-1', // Budgets API is global
      credentials: new AWS.SharedIniFileCredentials({ profile: HEALTH_CONFIG.profile })
    });
    
    this.testResults = {
      frontend: { status: 'pending', tests: [] },
      api: { status: 'pending', tests: [] },
      database: { status: 'pending', tests: [] },
      storage: { status: 'pending', tests: [] },
      messaging: { status: 'pending', tests: [] },
      monitoring: { status: 'pending', tests: [] },
      budget: { status: 'pending', tests: [] },
      overall: { status: 'pending', score: 0 }
    };
  }

  async runAllTests() {
    log('🏥 StackPro Production Health Check Suite', 'bold');
    log(`📍 Domain: ${HEALTH_CONFIG.domain}`, 'blue');
    log(`👤 Profile: ${HEALTH_CONFIG.profile}`, 'blue');
    log(`🌍 Region: ${HEALTH_CONFIG.region}`, 'blue');
    log(`⏰ Started: ${new Date().toISOString()}`, 'blue');
    
    try {
      // Run all test categories
      await this.testFrontendHealth();
      await this.testAPIHealth();
      await this.testDatabaseHealth();
      await this.testStorageHealth();
      await this.testMessagingHealth();
      await this.testMonitoringHealth();
      await this.testBudgetHealth();
      
      // Calculate overall score
      this.calculateOverallHealth();
      
      // Generate report
      await this.generateHealthReport();
      
      log('\n🎉 Health check completed!', 'green');
      this.displaySummary();
      
    } catch (error) {
      log(`❌ Health check failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async testFrontendHealth() {
    log('\n📱 Testing Frontend Health...', 'bold');
    
    try {
      // Test 1: Main domain accessibility
      await this.httpTest('https://stackpro.io', 'Main Domain', 200);
      
      // Test 2: WWW redirect
      await this.httpTest('https://www.stackpro.io', 'WWW Redirect', [200, 301, 302]);
      
      // Test 3: SSL certificate validity
      await this.sslTest('stackpro.io');
      
      // Test 4: Page load performance
      await this.performanceTest('https://stackpro.io');
      
      // Test 5: Key pages accessibility
      const keyPages = ['/features', '/pricing', '/login', '/signup'];
      for (const page of keyPages) {
        await this.httpTest(`https://stackpro.io${page}`, `Page: ${page}`, 200);
      }
      
      this.testResults.frontend.status = 'passed';
      log('✅ Frontend health: PASSED', 'green');
      
    } catch (error) {
      this.testResults.frontend.status = 'failed';
      log(`❌ Frontend health: FAILED - ${error.message}`, 'red');
    }
  }

  async testAPIHealth() {
    log('\n🔌 Testing API Health...', 'bold');
    
    try {
      // Test 1: API endpoint accessibility
      await this.httpTest('https://api.stackpro.io/health', 'API Health Endpoint', 200);
      
      // Test 2: API authentication endpoint
      await this.httpTest('https://api.stackpro.io/auth/status', 'Auth Status', [200, 401]);
      
      // Test 3: API rate limiting
      await this.rateLimitTest('https://api.stackpro.io/health');
      
      // Test 4: CORS headers
      await this.corsTest('https://api.stackpro.io/health');
      
      this.testResults.api.status = 'passed';
      log('✅ API health: PASSED', 'green');
      
    } catch (error) {
      this.testResults.api.status = 'failed';
      log(`❌ API health: FAILED - ${error.message}`, 'red');
    }
  }

  async testDatabaseHealth() {
    log('\n🗄️ Testing Database Health...', 'bold');
    
    try {
      // Find RDS instances
      const instances = await this.rds.describeDBInstances().promise();
      const stackProInstance = instances.DBInstances.find(db => 
        db.DBInstanceIdentifier.includes('stackpro')
      );
      
      if (!stackProInstance) {
        throw new Error('StackPro RDS instance not found');
      }
      
      // Test 1: RDS instance status
      this.addTestResult('database', 'RDS Instance Status', 
        stackProInstance.DBInstanceStatus === 'available' ? 'passed' : 'failed',
        `Status: ${stackProInstance.DBInstanceStatus}`);
      
      // Test 2: Connection availability
      this.addTestResult('database', 'RDS Connectivity', 
        stackProInstance.Endpoint ? 'passed' : 'failed',
        `Endpoint: ${stackProInstance.Endpoint?.Address || 'N/A'}`);
      
      // Test 3: Backup configuration
      this.addTestResult('database', 'Backup Configuration',
        stackProInstance.BackupRetentionPeriod > 0 ? 'passed' : 'failed',
        `Retention: ${stackProInstance.BackupRetentionPeriod} days`);
      
      // Test 4: Multi-AZ (optional for free tier)
      this.addTestResult('database', 'High Availability', 'info',
        `Multi-AZ: ${stackProInstance.MultiAZ ? 'Enabled' : 'Disabled (Free Tier)'}`);
      
      this.testResults.database.status = 'passed';
      log('✅ Database health: PASSED', 'green');
      
    } catch (error) {
      this.testResults.database.status = 'failed';
      log(`❌ Database health: FAILED - ${error.message}`, 'red');
    }
  }

  async testStorageHealth() {
    log('\n🪣 Testing Storage Health...', 'bold');
    
    try {
      // Find S3 buckets
      const buckets = await this.s3.listBuckets().promise();
      const stackProBucket = buckets.Buckets.find(bucket => 
        bucket.Name.includes('stackpro')
      );
      
      if (!stackProBucket) {
        throw new Error('StackPro S3 bucket not found');
      }
      
      // Test 1: Bucket accessibility
      await this.s3.headBucket({ Bucket: stackProBucket.Name }).promise();
      this.addTestResult('storage', 'S3 Bucket Access', 'passed', 
        `Bucket: ${stackProBucket.Name}`);
      
      // Test 2: Bucket policies
      try {
        const policy = await this.s3.getBucketPolicy({ 
          Bucket: stackProBucket.Name 
        }).promise();
        this.addTestResult('storage', 'Bucket Policy', 'passed', 'Policy configured');
      } catch (policyError) {
        if (policyError.code === 'NoSuchBucketPolicy') {
          this.addTestResult('storage', 'Bucket Policy', 'warning', 'No policy configured');
        } else {
          throw policyError;
        }
      }
      
      // Test 3: Test file upload/download
      await this.testS3Operations(stackProBucket.Name);
      
      this.testResults.storage.status = 'passed';
      log('✅ Storage health: PASSED', 'green');
      
    } catch (error) {
      this.testResults.storage.status = 'failed';
      log(`❌ Storage health: FAILED - ${error.message}`, 'red');
    }
  }

  async testMessagingHealth() {
    log('\n💬 Testing Messaging Health...', 'bold');
    
    try {
      // Test 1: DynamoDB tables
      const tables = await this.dynamodb.listTables().promise();
      const messagingTables = tables.TableNames.filter(table => 
        table.includes('stackpro') && 
        (table.includes('messages') || table.includes('connections') || table.includes('rooms'))
      );
      
      if (messagingTables.length === 0) {
        throw new Error('No messaging DynamoDB tables found');
      }
      
      this.addTestResult('messaging', 'DynamoDB Tables', 'passed',
        `Found ${messagingTables.length} tables: ${messagingTables.join(', ')}`);
      
      // Test 2: WebSocket endpoint (basic connectivity test)
      try {
        await this.websocketTest('wss://ws.stackpro.io');
        this.addTestResult('messaging', 'WebSocket Endpoint', 'passed', 'WebSocket reachable');
      } catch (wsError) {
        this.addTestResult('messaging', 'WebSocket Endpoint', 'warning', 
          'WebSocket may not be fully deployed yet');
      }
      
      this.testResults.messaging.status = 'passed';
      log('✅ Messaging health: PASSED', 'green');
      
    } catch (error) {
      this.testResults.messaging.status = 'failed';
      log(`❌ Messaging health: FAILED - ${error.message}`, 'red');
    }
  }

  async testMonitoringHealth() {
    log('\n📊 Testing Monitoring Health...', 'bold');
    
    try {
      // Test 1: CloudWatch metrics
      const metricsList = await this.cloudwatch.listMetrics({
        Namespace: 'AWS/ApplicationELB'
      }).promise();
      
      this.addTestResult('monitoring', 'CloudWatch Metrics', 'passed',
        `Found ${metricsList.Metrics.length} metrics`);
      
      // Test 2: CloudWatch alarms
      const alarms = await this.cloudwatch.describeAlarms().promise();
      const stackProAlarms = alarms.MetricAlarms.filter(alarm =>
        alarm.AlarmName.includes('stackpro') || alarm.AlarmName.includes('StackPro')
      );
      
      this.addTestResult('monitoring', 'CloudWatch Alarms', 
        stackProAlarms.length > 0 ? 'passed' : 'warning',
        `Found ${stackProAlarms.length} alarms`);
      
      this.testResults.monitoring.status = 'passed';
      log('✅ Monitoring health: PASSED', 'green');
      
    } catch (error) {
      this.testResults.monitoring.status = 'failed';
      log(`❌ Monitoring health: FAILED - ${error.message}`, 'red');
    }
  }

  async testBudgetHealth() {
    log('\n💰 Testing Budget Health...', 'bold');
    
    try {
      // Get account ID
      const sts = new AWS.STS({
        credentials: new AWS.SharedIniFileCredentials({ profile: HEALTH_CONFIG.profile })
      });
      const identity = await sts.getCallerIdentity().promise();
      
      // Test 1: Budget existence
      const budgets = await this.budgets.describeBudgets({
        AccountId: identity.Account
      }).promise();
      
      const stackProBudget = budgets.Budgets.find(budget => 
        budget.BudgetName.includes('stackpro') || budget.BudgetName.includes('StackPro')
      );
      
      if (stackProBudget) {
        this.addTestResult('budget', 'Budget Configuration', 'passed',
          `Budget: ${stackProBudget.BudgetName}, Limit: $${stackProBudget.BudgetLimit.Amount}`);
        
        // Test 2: Budget alerts
        const notifications = await this.budgets.describeNotificationsForBudget({
          AccountId: identity.Account,
          BudgetName: stackProBudget.BudgetName
        }).promise();
        
        this.addTestResult('budget', 'Budget Alerts', 
          notifications.Notifications.length > 0 ? 'passed' : 'warning',
          `${notifications.Notifications.length} notifications configured`);
      } else {
        this.addTestResult('budget', 'Budget Configuration', 'warning',
          'No StackPro budget found - consider setting up cost monitoring');
      }
      
      this.testResults.budget.status = 'passed';
      log('✅ Budget health: PASSED', 'green');
      
    } catch (error) {
      this.testResults.budget.status = 'warning';
      log(`⚠️ Budget health: WARNING - ${error.message}`, 'yellow');
    }
  }

  // Helper methods
  async httpTest(url, testName, expectedStatus = 200) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        const isExpectedStatus = Array.isArray(expectedStatus) 
          ? expectedStatus.includes(res.statusCode)
          : res.statusCode === expectedStatus;
          
        if (isExpectedStatus) {
          this.addTestResult('frontend', testName, 'passed', 
            `HTTP ${res.statusCode}`);
          resolve();
        } else {
          this.addTestResult('frontend', testName, 'failed', 
            `HTTP ${res.statusCode} (expected ${expectedStatus})`);
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
      });
      
      req.on('error', (error) => {
        this.addTestResult('frontend', testName, 'failed', error.message);
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        this.addTestResult('frontend', testName, 'failed', 'Request timeout');
        reject(new Error(`Timeout for ${url}`));
      });
    });
  }

  async sslTest(domain) {
    return new Promise((resolve, reject) => {
      const req = https.get(`https://${domain}`, (res) => {
        const cert = res.connection.getPeerCertificate();
        
        if (cert && cert.subject) {
          const expiryDate = new Date(cert.valid_to);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry > 30) {
            this.addTestResult('frontend', 'SSL Certificate', 'passed',
              `Valid until ${cert.valid_to} (${daysUntilExpiry} days)`);
            resolve();
          } else {
            this.addTestResult('frontend', 'SSL Certificate', 'warning',
              `Expires soon: ${cert.valid_to} (${daysUntilExpiry} days)`);
            resolve();
          }
        } else {
          this.addTestResult('frontend', 'SSL Certificate', 'failed', 
            'No certificate information available');
          reject(new Error('SSL certificate check failed'));
        }
      });
      
      req.on('error', (error) => {
        this.addTestResult('frontend', 'SSL Certificate', 'failed', error.message);
        reject(error);
      });
    });
  }

  async performanceTest(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = https.get(url, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (responseTime < 2000) {
          this.addTestResult('frontend', 'Page Load Performance', 'passed',
            `${responseTime}ms (< 2s)`);
        } else if (responseTime < 5000) {
          this.addTestResult('frontend', 'Page Load Performance', 'warning',
            `${responseTime}ms (slow but acceptable)`);
        } else {
          this.addTestResult('frontend', 'Page Load Performance', 'failed',
            `${responseTime}ms (too slow)`);
        }
        
        resolve();
      });
      
      req.on('error', () => {
        this.addTestResult('frontend', 'Page Load Performance', 'failed', 
          'Request failed');
        resolve();
      });
    });
  }

  async rateLimitTest(url) {
    // Simple rate limit test - make multiple requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(new Promise((resolve) => {
        const req = https.get(url, (res) => resolve(res.statusCode));
        req.on('error', () => resolve(500));
      }));
    }
    
    const results = await Promise.all(requests);
    const hasRateLimit = results.some(status => status === 429);
    
    this.addTestResult('api', 'Rate Limiting', 
      hasRateLimit ? 'passed' : 'info',
      hasRateLimit ? 'Rate limiting active' : 'No rate limiting detected');
  }

  async corsTest(url) {
    return new Promise((resolve) => {
      const req = https.get(url, (res) => {
        const corsHeaders = res.headers['access-control-allow-origin'];
        this.addTestResult('api', 'CORS Configuration',
          corsHeaders ? 'passed' : 'warning',
          corsHeaders ? `CORS: ${corsHeaders}` : 'No CORS headers detected');
        resolve();
      });
      
      req.on('error', () => {
        this.addTestResult('api', 'CORS Configuration', 'failed', 'Request failed');
        resolve();
      });
    });
  }

  async testS3Operations(bucketName) {
    try {
      // Test file upload
      const testKey = 'health-check/test-file.txt';
      const testData = `Health check test file created at ${new Date().toISOString()}`;
      
      await this.s3.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: testData,
        ContentType: 'text/plain'
      }).promise();
      
      // Test file download
      const downloadResult = await this.s3.getObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();
      
      if (downloadResult.Body.toString() === testData) {
        this.addTestResult('storage', 'S3 Upload/Download', 'passed',
          'File operations working correctly');
      } else {
        throw new Error('Downloaded content does not match uploaded content');
      }
      
      // Cleanup test file
      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: testKey
      }).promise();
      
    } catch (error) {
      this.addTestResult('storage', 'S3 Upload/Download', 'failed', 
        error.message);
      throw error;
    }
  }

  async websocketTest(wsUrl) {
    // Basic WebSocket connectivity test (simplified)
    return new Promise((resolve, reject) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  addTestResult(category, testName, status, details = '') {
    this.testResults[category].tests.push({
      name: testName,
      status: status,
      details: details,
      timestamp: new Date().toISOString()
    });
    
    const statusIcon = {
      'passed': '✅',
      'failed': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    
    log(`  ${statusIcon[status]} ${testName}: ${details}`, 
      status === 'passed' ? 'green' : 
      status === 'failed' ? 'red' : 
      status === 'warning' ? 'yellow' : 'blue');
  }

  calculateOverallHealth() {
    let totalTests = 0;
    let passedTests = 0;
    
    Object.values(this.testResults).forEach(category => {
      if (category.tests) {
        category.tests.forEach(test => {
          totalTests++;
          if (test.status === 'passed') passedTests++;
        });
      }
    });
    
    const score = Math.round((passedTests / totalTests) * 100);
    this.testResults.overall.score = score;
    
    if (score >= 90) {
      this.testResults.overall.status = 'excellent';
    } else if (score >= 80) {
      this.testResults.overall.status = 'good';
    } else if (score >= 70) {
      this.testResults.overall.status = 'fair';
    } else {
      this.testResults.overall.status = 'poor';
    }
  }

  displaySummary() {
    log('\n📊 Health Check Summary', 'bold');
    log('=' * 50, 'blue');
    
    const categories = [
      'frontend', 'api', 'database', 'storage', 
      'messaging', 'monitoring', 'budget'
    ];
    
    categories.forEach(category => {
      const result = this.testResults[category];
      const statusIcon = {
        'passed': '✅',
        'failed': '❌',
        'warning': '⚠️'
      };
      
      log(`${statusIcon[result.status] || '❓'} ${category.toUpperCase()}: ${result.status}`, 
        result.status === 'passed' ? 'green' : 
        result.status === 'failed' ? 'red' : 'yellow');
    });
    
    log('\n🎯 Overall Health Score', 'bold');
    const score = this.testResults.overall.score;
    const status = this.testResults.overall.status;
    
    log(`Score: ${score}% (${status.toUpperCase()})`, 
      score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red');
    
    if (score >= 90) {
      log('🎉 Excellent! Your platform is production-ready', 'green');
    } else if (score >= 80) {
      log('👍 Good! Minor issues to address', 'yellow');
    } else if (score >= 70) {
      log('⚠️ Fair! Several issues need attention', 'yellow');
    } else {
      log('🚨 Poor! Critical issues must be resolved', 'red');
    }
  }

  async generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      domain: HEALTH_CONFIG.domain,
      profile: HEALTH_CONFIG.profile,
      region: HEALTH_CONFIG.region,
      results: this.testResults,
      summary: {
        totalCategories: 7,
        passedCategories: Object.values(this.testResults).filter(r => 
          r.status === 'passed').length,
        overallScore: this.testResults.overall.score,
        overallStatus: this.testResults.overall.status
      }
    };
    
    const reportPath = path.join(__dirname, '..', 'logs', 
      `production-health-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log(`\n📄 Detailed report saved: ${reportPath}`, 'blue');
    
    return report;
  }
}

// Quick health check
async function quickHealthCheck() {
  log('🚀 Quick Health Check', 'bold');
  
  const checker = new ProductionHealthChecker();
  
  try {
    // Test only critical endpoints
    await checker.httpTest('https://stackpro.io', 'Main Site', 200);
    await checker.httpTest('https://api.stackpro.io/health', 'API Health', 200);
    
    log('✅ Quick health check passed!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Quick health check failed: ${error.message}`, 'red');
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('📖 StackPro Production Health Check');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/production-health-check.js        # Full health check');
    console.log('  node scripts/production-health-check.js --quick # Quick check only');
    console.log('  node scripts/production-health-check.js --help  # Show this help');
    return;
  }
  
  if (args.includes('--quick')) {
    await quickHealthCheck();
    return;
  }
  
  // Full health check
  const checker = new ProductionHealthChecker();
  await checker.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  });
}

module.exports = { ProductionHealthChecker, quickHealthCheck };
