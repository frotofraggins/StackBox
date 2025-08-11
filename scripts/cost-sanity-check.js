#!/usr/bin/env node
/**
 * Cost Sanity Check Script
 * Monitors AWS free-tier usage and costs
 */
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: process.env.AWS_REGION || 'us-west-2' });

const cloudwatch = new AWS.CloudWatch();
const budgets = new AWS.Budgets();

async function checkBudget() {
  try {
    const result = await budgets.describeBudgets({ 
      AccountId: process.env.AWS_ACCOUNT_ID || 'default' 
    }).promise();
    
    const budget = result.Budgets?.find(b => 
      b.BudgetName?.includes('stackpro') || 
      b.BudgetName?.includes('5') ||
      parseFloat(b.BudgetLimit?.Amount || '0') === 5.0
    );
    
    if (budget) {
      return {
        exists: true,
        amount: parseFloat(budget.BudgetLimit?.Amount || '0'),
        spent: parseFloat(budget.CalculatedSpend?.ActualSpend?.Amount || '0'),
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.warn('Could not check budget:', error.message);
    return { exists: false };
  }
}

async function getMetric(namespace, metricName, dimensions = []) {
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const params = {
      Namespace: namespace,
      MetricName: metricName,
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400, // 1 day
      Statistics: ['Sum'],
      Dimensions: dimensions,
    };
    
    const result = await cloudwatch.getMetricStatistics(params).promise();
    const datapoints = result.Datapoints || [];
    
    if (datapoints.length === 0) return 0;
    
    // Sum all datapoints for month-to-date total
    return datapoints.reduce((sum, dp) => sum + (dp.Sum || 0), 0);
  } catch (error) {
    console.warn(`Could not get ${metricName}:`, error.message);
    return 0;
  }
}

async function checkServices() {
  console.log('🔍 Checking AWS service usage...');
  
  const metrics = [];
  
  // Lambda
  const lambdaInvocations = await getMetric('AWS/Lambda', 'Invocations');
  const lambdaDuration = await getMetric('AWS/Lambda', 'Duration');
  const lambdaGBSeconds = lambdaDuration / 1000 * 0.125; // Assuming 128MB functions
  
  metrics.push({
    service: 'Lambda Invocations',
    current: lambdaInvocations,
    limit: 1000000,
    unit: 'requests',
    percentage: (lambdaInvocations / 1000000) * 100,
    status: lambdaInvocations > 800000 ? 'critical' : lambdaInvocations > 700000 ? 'warning' : 'healthy',
  });
  
  metrics.push({
    service: 'Lambda GB-seconds',
    current: lambdaGBSeconds,
    limit: 400000,
    unit: 'GB-s',
    percentage: (lambdaGBSeconds / 400000) * 100,
    status: lambdaGBSeconds > 320000 ? 'critical' : lambdaGBSeconds > 280000 ? 'warning' : 'healthy',
  });
  
  // API Gateway
  const apiGatewayRequests = await getMetric('AWS/ApiGateway', 'Count');
  
  metrics.push({
    service: 'API Gateway',
    current: apiGatewayRequests,
    limit: 1000000,
    unit: 'requests',
    percentage: (apiGatewayRequests / 1000000) * 100,
    status: apiGatewayRequests > 800000 ? 'critical' : apiGatewayRequests > 700000 ? 'warning' : 'healthy',
  });
  
  // DynamoDB
  const dynamoReadUnits = await getMetric('AWS/DynamoDB', 'ConsumedReadCapacityUnits');
  const dynamoWriteUnits = await getMetric('AWS/DynamoDB', 'ConsumedWriteCapacityUnits');
  
  // Free tier: 25 GB storage, 25 read/write capacity units
  metrics.push({
    service: 'DynamoDB Reads',
    current: dynamoReadUnits,
    limit: 25000000, // 25 units * 30 days * 24 hours * 3600 seconds
    unit: 'RCUs',
    percentage: (dynamoReadUnits / 25000000) * 100,
    status: dynamoReadUnits > 20000000 ? 'critical' : dynamoReadUnits > 17500000 ? 'warning' : 'healthy',
  });
  
  metrics.push({
    service: 'DynamoDB Writes',
    current: dynamoWriteUnits,
    limit: 25000000,
    unit: 'WCUs',
    percentage: (dynamoWriteUnits / 25000000) * 100,
    status: dynamoWriteUnits > 20000000 ? 'critical' : dynamoWriteUnits > 17500000 ? 'warning' : 'healthy',
  });
  
  // S3
  const s3GetRequests = await getMetric('AWS/S3', 'NumberOfObjects');
  const s3PutRequests = await getMetric('AWS/S3', 'NumberOfObjects');
  
  metrics.push({
    service: 'S3 Requests',
    current: s3GetRequests + s3PutRequests,
    limit: 20000,
    unit: 'requests',
    percentage: ((s3GetRequests + s3PutRequests) / 20000) * 100,
    status: (s3GetRequests + s3PutRequests) > 16000 ? 'critical' : (s3GetRequests + s3PutRequests) > 14000 ? 'warning' : 'healthy',
  });
  
  return metrics;
}

function formatNumber(num) {
  if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function getStatusIcon(status) {
  switch (status) {
    case 'healthy': return '✅';
    case 'warning': return '⚠️';
    case 'critical': return '❌';
    default: return '❓';
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const dryRun = args.includes('--dry-run');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No actual API calls');
  }
  
  try {
    // Check budget
    const budget = await checkBudget();
    
    // Check service metrics
    const metrics = await checkServices();
    
    // Calculate overall status
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    
    let overallStatus = 'healthy';
    let exitCode = 0;
    
    if (criticalCount > 0) {
      overallStatus = 'critical';
      exitCode = 3;
    } else if (warningCount > 0) {
      overallStatus = 'warning';
      exitCode = 2;
    }
    
    const estimatedCost = budget.spent || 0;
    
    if (jsonOutput) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        overallStatus,
        estimatedCost,
        budget: budget.exists ? { amount: budget.amount, spent: budget.spent } : null,
        metrics,
        exitCode,
      }, null, 2));
    } else {
      console.log('\n🎯 StackPro Cost Sanity Check');
      console.log('================================');
      
      if (budget.exists) {
        console.log(`💰 Budget: $${budget.spent?.toFixed(2) || '0.00'} / $${budget.amount?.toFixed(2) || '5.00'}`);
      } else {
        console.log('💰 Budget: Not configured (⚠️ Recommended: $5/month)');
      }
      
      console.log(`💸 Estimated Cost: $${estimatedCost.toFixed(2)}`);
      console.log(`📊 Overall Status: ${getStatusIcon(overallStatus)} ${overallStatus.toUpperCase()}`);
      console.log('');
      
      console.log('Service Usage:');
      console.log('─────────────────────────────────────────────────────────');
      
      for (const metric of metrics) {
        const icon = getStatusIcon(metric.status);
        const current = formatNumber(metric.current);
        const limit = formatNumber(metric.limit);
        const percentage = metric.percentage.toFixed(1);
        
        console.log(`${icon} ${metric.service.padEnd(20)} ${current.padStart(8)} / ${limit.padStart(8)} ${metric.unit} (${percentage.padStart(5)}%)`);
      }
      
      console.log('─────────────────────────────────────────────────────────');
      
      if (exitCode === 0) {
        console.log('✅ All services within free tier limits');
      } else if (exitCode === 2) {
        console.log('⚠️  Some services approaching free tier limits');
      } else {
        console.log('❌ Some services exceeding free tier limits');
      }
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Cost check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkServices, checkBudget };
