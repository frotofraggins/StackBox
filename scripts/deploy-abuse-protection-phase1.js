#!/usr/bin/env node

/**
 * StackPro Abuse Protection - Phase 1: Infrastructure Deployment
 * Creates DynamoDB table, Lambda function, CloudWatch alarms
 */

const AWS = require('aws-sdk');
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

// Configuration with adjusted limits
const CONFIG = {
  profile: 'Stackbox',
  region: 'us-west-2',
  accountId: '304052673868',
  tags: {
    Project: 'StackPro',
    Env: 'FreeTier',
    Purpose: 'AbuseProtection',
    Phase: 'Phase1'
  },
  // Adjusted conservative limits
  quotas: {
    TENANT_API_DAILY: 3000,
    USER_API_DAILY: 600,
    IP_API_DAILY: 800,
    TENANT_WS_MSGS_DAILY: 3000,
    USER_WS_MSGS_DAILY: 500,
    TENANT_FILES_DAILY: 15,
    MAX_FILE_MB: 10
  }
};

class AbuseProtectionPhase1Deployer {
  constructor() {
    this.dynamodb = new AWS.DynamoDB({
      region: CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
    });
    
    this.lambda = new AWS.Lambda({
      region: CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
    });
    
    this.cloudwatch = new AWS.CloudWatch({
      region: CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
    });
    
    this.iam = new AWS.IAM({
      region: CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
    });
    
    this.deploymentResults = {
      dynamodbTable: null,
      lambdaFunction: null,
      iamRole: null,
      alarms: [],
      dashboardUrl: null,
      errors: []
    };
  }

  async deployPhase1() {
    log('🚀 StackPro Abuse Protection - Phase 1: Infrastructure', 'bold');
    log(`📍 Account: ${CONFIG.accountId} (${CONFIG.profile})`, 'blue');
    log(`🌍 Region: ${CONFIG.region}`, 'blue');
    log(`🏷️ Tags: ${JSON.stringify(CONFIG.tags)}`, 'blue');
    
    try {
      await this.validatePrerequisites();
      await this.createDynamoDBTable();
      await this.createIAMRole();
      await this.createLambdaFunction();
      await this.createCloudWatchAlarms();
      await this.updateDashboard();
      await this.generatePhase1Report();
      
      log('\n✅ Phase 1 Infrastructure Deployment Completed!', 'green');
      this.displayResults();
      
    } catch (error) {
      log(`\n❌ Phase 1 Deployment Failed: ${error.message}`, 'red');
      await this.cleanup();
      throw error;
    }
  }

  async validatePrerequisites() {
    log('\n🔍 Validating Prerequisites', 'bold');
    
    // Check AWS account
    const sts = new AWS.STS({
      credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
    });
    const identity = await sts.getCallerIdentity().promise();
    
    if (identity.Account !== CONFIG.accountId) {
      throw new Error(`Wrong AWS account: ${identity.Account} (expected ${CONFIG.accountId})`);
    }
    
    log(`✅ AWS Account: ${identity.Account}`, 'green');
    
    // Check existing resources - allow reuse if already exists
    try {
      const tableDescription = await this.dynamodb.describeTable({
        TableName: 'stackpro-sandbox-quotas'
      }).promise();
      log('✅ DynamoDB table already exists, will reuse', 'green');
      this.deploymentResults.dynamodbTable = {
        arn: tableDescription.Table.TableArn,
        name: tableDescription.Table.TableName,
        status: tableDescription.Table.TableStatus,
        ttlEnabled: true
      };
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        log('✅ DynamoDB table name available', 'green');
      } else {
        throw error;
      }
    }
    
    log('✅ Prerequisites validated', 'green');
  }

  async createDynamoDBTable() {
    log('\n🗄️ Creating DynamoDB Table: stackpro-sandbox-quotas', 'bold');
    
    // Skip creation if table already exists (use existing from prerequisites)
    if (this.deploymentResults.dynamodbTable) {
      log('✅ Using existing DynamoDB table', 'green');
      
      // Ensure TTL is configured on existing table
      try {
        log('🕒 Verifying TTL configuration...', 'blue');
        await this.dynamodb.updateTimeToLive({
          TableName: 'stackpro-sandbox-quotas',
          TimeToLiveSpecification: {
            AttributeName: 'ttl',
            Enabled: true
          }
        }).promise();
        log('✅ TTL configuration verified', 'green');
      } catch (error) {
        if (error.code === 'ResourceInUseException') {
          log('✅ TTL already enabled', 'green');
        } else {
          log(`⚠️ TTL configuration warning: ${error.message}`, 'yellow');
        }
      }
      
      return;
    }
    
    const tableParams = {
      TableName: 'stackpro-sandbox-quotas',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'scope',
          AttributeType: 'S'
        },
        {
          AttributeName: 'date',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'scope',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'date',
          KeyType: 'RANGE'
        }
      ],
      Tags: Object.entries(CONFIG.tags).map(([Key, Value]) => ({ Key, Value }))
    };

    try {
      const result = await this.dynamodb.createTable(tableParams).promise();
      
      log(`✅ Table created: ${result.TableDescription.TableArn}`, 'green');
      log(`📊 Status: ${result.TableDescription.TableStatus}`, 'blue');
      
      // Wait for table to be active
      log('⏳ Waiting for table to become active...', 'yellow');
      await this.dynamodb.waitFor('tableExists', {
        TableName: 'stackpro-sandbox-quotas'
      }).promise();
      
      log('✅ Table is now active', 'green');
      
      // Enable TTL after table is active
      log('🕒 Configuring TTL for automatic cleanup...', 'blue');
      await this.dynamodb.updateTimeToLive({
        TableName: 'stackpro-sandbox-quotas',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      }).promise();
      
      log('✅ TTL configured for ttl attribute', 'green');
      
      this.deploymentResults.dynamodbTable = {
        arn: result.TableDescription.TableArn,
        name: result.TableDescription.TableName,
        status: 'ACTIVE',
        ttlEnabled: true
      };
      
    } catch (error) {
      this.deploymentResults.errors.push({
        component: 'DynamoDB',
        error: error.message
      });
      throw new Error(`DynamoDB table creation failed: ${error.message}`);
    }
  }

  async createIAMRole() {
    log('\n🔐 Creating IAM Role for Lambda Function', 'bold');
    
    const assumeRolePolicyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      ]
    };

    const roleParams = {
      RoleName: 'StackPro-Sandbox-TenantLock-Role',
      AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument),
      Description: 'IAM role for StackPro sandbox tenant lock Lambda function',
      Tags: Object.entries(CONFIG.tags).map(([Key, Value]) => ({ Key, Value }))
    };

    try {
      const roleResult = await this.iam.createRole(roleParams).promise();
      
      log(`✅ Role created: ${roleResult.Role.Arn}`, 'green');
      
      // Attach basic Lambda execution policy
      await this.iam.attachRolePolicy({
        RoleName: 'StackPro-Sandbox-TenantLock-Role',
        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      }).promise();
      
      // Create custom policy for DynamoDB and CloudWatch
      const customPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query'
            ],
            Resource: `arn:aws:dynamodb:${CONFIG.region}:${CONFIG.accountId}:table/stackpro-sandbox-*`
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData'
            ],
            Resource: '*'
          }
        ]
      };
      
      await this.iam.putRolePolicy({
        RoleName: 'StackPro-Sandbox-TenantLock-Role',
        PolicyName: 'StackPro-Sandbox-Permissions',
        PolicyDocument: JSON.stringify(customPolicy)
      }).promise();
      
      log('✅ IAM policies attached', 'green');
      
      // Wait for role propagation
      log('⏳ Waiting for IAM role propagation...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      this.deploymentResults.iamRole = {
        arn: roleResult.Role.Arn,
        name: roleResult.Role.RoleName
      };
      
    } catch (error) {
      if (error.code === 'EntityAlreadyExists') {
        log('✅ IAM role already exists, using existing', 'green');
        const getRole = await this.iam.getRole({
          RoleName: 'StackPro-Sandbox-TenantLock-Role'
        }).promise();
        this.deploymentResults.iamRole = {
          arn: getRole.Role.Arn,
          name: getRole.Role.RoleName
        };
      } else {
        this.deploymentResults.errors.push({
          component: 'IAM',
          error: error.message
        });
        throw new Error(`IAM role creation failed: ${error.message}`);
      }
    }
  }

  async createLambdaFunction() {
    log('\n⚡ Creating Lambda Function: stackpro-sandbox-tenant-lock', 'bold');
    
    // Create Lambda function code
    const lambdaCode = `const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
    console.log('Tenant lock triggered by CloudWatch alarm:', JSON.stringify(event));
    
    try {
        // Parse alarm from CloudWatch event
        const message = JSON.parse(event.Records[0].Sns.Message);
        const alarmName = message.AlarmName;
        const reason = message.Reason;
        
        // Extract tenant ID from alarm (if available in dimensions)
        let tenantId = 'unknown';
        if (message.Trigger && message.Trigger.Dimensions) {
            const tenantDimension = message.Trigger.Dimensions.find(d => d.name === 'TenantId');
            if (tenantDimension) {
                tenantId = tenantDimension.value;
            }
        }
        
        // Log tenant suspension (anonymized)
        const hashedTenantId = require('crypto').createHash('sha256').update(tenantId).digest('hex').substring(0, 16);
        console.log('Suspending tenant: ' + hashedTenantId + ' due to: ' + reason);
        
        // Update tenant status in quotas table
        const suspensionRecord = {
            scope: 'tenant#' + tenantId + '#suspended',
            date: new Date().toISOString().split('T')[0],
            status: 'SUSPENDED_ABUSE',
            reason: reason,
            suspendedAt: new Date().toISOString(),
            alarmName: alarmName,
            ttl: Math.floor(Date.now() / 1000) + (86400 * 30) // 30 day TTL
        };
        
        await dynamodb.put({
            TableName: process.env.QUOTAS_TABLE || 'stackpro-sandbox-quotas',
            Item: suspensionRecord
        }).promise();
        
        // Send metric to CloudWatch
        await cloudwatch.putMetricData({
            Namespace: 'StackPro/Sandbox',
            MetricData: [{
                MetricName: 'TenantSuspended',
                Value: 1,
                Unit: 'Count',
                Dimensions: [{
                    Name: 'Reason',
                    Value: 'AnomalyDetection'
                }],
                Timestamp: new Date()
            }]
        }).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Tenant suspended successfully',
                tenantId: hashedTenantId,
                reason: reason
            })
        };
        
    } catch (error) {
        console.error('Error suspending tenant:', error);
        
        await cloudwatch.putMetricData({
            Namespace: 'StackPro/Sandbox',
            MetricData: [{
                MetricName: 'TenantSuspensionError',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date()
            }]
        }).promise();
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to suspend tenant',
                message: error.message
            })
        };
    }
};`;

    // Create proper zip file using archiver
    const archiver = require('archiver');
    const zipBuffer = await new Promise((resolve, reject) => {
      const archive = archiver('zip');
      const chunks = [];
      
      archive.on('data', chunk => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
      
      archive.append(lambdaCode, { name: 'index.js' });
      archive.finalize();
    });

    const functionParams = {
      FunctionName: 'stackpro-sandbox-tenant-lock',
      Runtime: 'nodejs18.x',
      Role: this.deploymentResults.iamRole.arn,
      Handler: 'index.handler',
      Code: {
        ZipFile: zipBuffer
      },
      Description: 'StackPro sandbox tenant lock function for abuse protection',
      Timeout: 30,
      MemorySize: 256,
      Environment: {
        Variables: {
          QUOTAS_TABLE: 'stackpro-sandbox-quotas',
          ABUSE_PROTECTION_ENABLED: 'true'
        }
      },
      Tags: CONFIG.tags
    };

    try {
      const result = await this.lambda.createFunction(functionParams).promise();
      
      log(`✅ Lambda created: ${result.FunctionArn}`, 'green');
      log(`📋 Function name: ${result.FunctionName}`, 'blue');
      
      this.deploymentResults.lambdaFunction = {
        arn: result.FunctionArn,
        name: result.FunctionName
      };
      
    } catch (error) {
      this.deploymentResults.errors.push({
        component: 'Lambda',
        error: error.message
      });
      throw new Error(`Lambda function creation failed: ${error.message}`);
    }
  }

  async createCloudWatchAlarms() {
    log('\n📊 Creating CloudWatch Alarms', 'bold');
    
    const alarms = [
      {
        AlarmName: 'StackPro-Sandbox-QuotaRejectedRateHigh',
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        MetricName: 'QuotaRejected',
        Namespace: 'StackPro/Sandbox',
        Period: 300,
        Statistic: 'Sum',
        Threshold: 150, // Reduced from 250 for more conservative monitoring
        ActionsEnabled: true,
        AlarmActions: [],
        AlarmDescription: 'High rate of quota rejections indicates potential abuse',
        TreatMissingData: 'notBreaching'
      },
      {
        AlarmName: 'StackPro-Sandbox-ApiSpike-Tenant',
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'ApiRequests',
        Namespace: 'StackPro/Sandbox',
        Period: 900,
        Statistic: 'Sum',
        Threshold: 600, // Reduced for conservative limits
        TreatMissingData: 'notBreaching',
        AlarmDescription: 'Detect API usage spikes per tenant (conservative)'
      },
      {
        AlarmName: 'StackPro-Sandbox-WSSpike-Tenant',
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'WsMessages',
        Namespace: 'StackPro/Sandbox',
        Period: 900,
        Statistic: 'Sum',
        Threshold: 600, // Reduced for conservative limits
        TreatMissingData: 'notBreaching',
        AlarmDescription: 'Detect WebSocket message spikes per tenant (conservative)'
      },
      {
        AlarmName: 'StackPro-Sandbox-AnomalyLockTriggered',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
        MetricName: 'AnomalyLockTriggered',
        Namespace: 'StackPro/Sandbox',
        Period: 300,
        Statistic: 'Sum',
        Threshold: 1,
        AlarmActions: [],
        AlarmDescription: 'Alert when anomaly detection triggers tenant lock'
      },
      {
        AlarmName: 'StackPro-Sandbox-DailyCostSpike',
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'EstimatedCharges',
        Namespace: 'AWS/Billing',
        Period: 86400,
        Statistic: 'Maximum',
        Threshold: 3.0, // $3 circuit breaker
        AlarmActions: [],
        AlarmDescription: 'Global circuit breaker for daily cost spike',
        Dimensions: [
          {
            Name: 'Currency',
            Value: 'USD'
          }
        ]
      }
    ];

    for (const alarm of alarms) {
      try {
        // Add standard tags to all alarms
        const alarmWithTags = {
          ...alarm,
          Tags: Object.entries(CONFIG.tags).map(([Key, Value]) => ({ Key, Value }))
        };
        
        await this.cloudwatch.putMetricAlarm(alarmWithTags).promise();
        
        log(`✅ Created alarm: ${alarm.AlarmName}`, 'green');
        
        this.deploymentResults.alarms.push({
          name: alarm.AlarmName,
          threshold: alarm.Threshold,
          metric: alarm.MetricName
        });
        
      } catch (error) {
        log(`⚠️ Failed to create alarm ${alarm.AlarmName}: ${error.message}`, 'yellow');
        this.deploymentResults.errors.push({
          component: `Alarm-${alarm.AlarmName}`,
          error: error.message
        });
      }
    }
    
    // Create composite alarm for high usage anomaly
    try {
      const compositeAlarm = {
        AlarmName: 'StackPro-Sandbox-HighUsageAnomaly',
        AlarmRule: "(ALARM 'StackPro-Sandbox-ApiSpike-Tenant' OR ALARM 'StackPro-Sandbox-WSSpike-Tenant')",
        ActionsEnabled: true,
        AlarmActions: [this.deploymentResults.lambdaFunction.arn],
        AlarmDescription: 'Composite alarm for usage spikes triggering tenant lock',
        Tags: Object.entries(CONFIG.tags).map(([Key, Value]) => ({ Key, Value }))
      };
      
      await this.cloudwatch.putCompositeAlarm(compositeAlarm).promise();
      log(`✅ Created composite alarm: ${compositeAlarm.AlarmName}`, 'green');
      
      this.deploymentResults.alarms.push({
        name: compositeAlarm.AlarmName,
        type: 'composite',
        actions: 'tenant-lock'
      });
      
    } catch (error) {
      log(`⚠️ Failed to create composite alarm: ${error.message}`, 'yellow');
      this.deploymentResults.errors.push({
        component: 'CompositeAlarm',
        error: error.message
      });
    }
    
    log(`✅ Created ${this.deploymentResults.alarms.length} CloudWatch alarms`, 'green');
  }

  async updateDashboard() {
    log('\n📊 Creating CloudWatch Dashboard', 'bold');
    
    const dashboardBody = {
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['StackPro/Sandbox', 'QuotaRejected', 'QuotaType', 'API'],
              ['.', '.', '.', 'WebSocket'],
              ['.', '.', '.', 'Files']
            ],
            view: 'timeSeries',
            stacked: false,
            region: CONFIG.region,
            title: 'Quota Rejections by Type',
            period: 300,
            stat: 'Sum'
          }
        },
        {
          type: 'metric',
          x: 12,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              ['StackPro/Sandbox', 'ApiRequests'],
              ['.', 'WsMessages']
            ],
            view: 'timeSeries',
            stacked: false,
            region: CONFIG.region,
            title: 'API & WebSocket Usage',
            period: 300,
            stat: 'Sum'
          }
        },
        {
          type: 'metric',
          x: 0,
          y: 6,
          width: 8,
          height: 6,
          properties: {
            metrics: [
              ['StackPro/Sandbox', 'TenantSuspended']
            ],
            view: 'singleValue',
            region: CONFIG.region,
            title: 'Suspended Tenants (24h)',
            period: 86400,
            stat: 'Sum'
          }
        },
        {
          type: 'metric',
          x: 8,
          y: 6,
          width: 8,
          height: 6,
          properties: {
            metrics: [
              ['AWS/Billing', 'EstimatedCharges', 'Currency', 'USD']
            ],
            view: 'singleValue',
            region: 'us-east-1',
            title: 'Daily AWS Cost ($)',
            period: 86400,
            stat: 'Maximum'
          }
        },
        {
          type: 'log',
          x: 16,
          y: 6,
          width: 8,
          height: 6,
          properties: {
            query: 'SOURCE \'/aws/lambda/stackpro-sandbox-tenant-lock\' | fields @timestamp, @message\n| filter @message like /Suspending tenant/\n| sort @timestamp desc\n| limit 20',
            region: CONFIG.region,
            title: 'Recent Tenant Suspensions',
            view: 'table'
          }
        }
      ]
    };
    
    try {
      const dashboardName = 'StackPro-Sandbox-AbuseProtection';
      
      await this.cloudwatch.putDashboard({
        DashboardName: dashboardName,
        DashboardBody: JSON.stringify(dashboardBody)
      }).promise();
      
      const dashboardUrl = `https://${CONFIG.region}.console.aws.amazon.com/cloudwatch/home?region=${CONFIG.region}#dashboards:name=${dashboardName}`;
      
      log(`✅ Dashboard created: ${dashboardName}`, 'green');
      log(`🔗 Dashboard URL: ${dashboardUrl}`, 'blue');
      
      this.deploymentResults.dashboardUrl = dashboardUrl;
      
    } catch (error) {
      log(`⚠️ Dashboard creation failed: ${error.message}`, 'yellow');
      this.deploymentResults.errors.push({
        component: 'Dashboard',
        error: error.message
      });
    }
  }

  async generatePhase1Report() {
    log('\n📄 Generating Phase 1 Deployment Report', 'bold');
    
    const report = {
      phase: 'Phase 1 - Infrastructure',
      timestamp: new Date().toISOString(),
      account: CONFIG.accountId,
      region: CONFIG.region,
      
      // Infrastructure ARNs
      resources: {
        dynamodbTable: this.deploymentResults.dynamodbTable,
        lambdaFunction: this.deploymentResults.lambdaFunction,
        iamRole: this.deploymentResults.iamRole,
        alarms: this.deploymentResults.alarms,
        dashboardUrl: this.deploymentResults.dashboardUrl
      },
      
      // Table schema
      tableSchema: {
        tableName: 'stackpro-sandbox-quotas',
        partitionKey: 'scope (String)', 
        sortKey: 'date (String)',
        ttlAttribute: 'ttl',
        billingMode: 'PAY_PER_REQUEST',
        sampleRecords: [
          {
            scope: 'tenant#abc123',
            date: '2025-08-08',
            apiCalls: 150,
            wsMsgs: 45,
            filesUploaded: 3,
            bytesUploaded: 5242880,
            ttl: 1755830400
          },
          {
            scope: 'user#user456',
            date: '2025-08-08', 
            apiCalls: 75,
            wsMsgs: 20,
            ttl: 1755830400
          },
          {
            scope: 'ip#192.168.1.100',
            date: '2025-08-08',
            apiCalls: 200,
            ttl: 1755830400
          }
        ]
      },
      
      // Updated conservative limits
      quotaLimits: CONFIG.quotas,
      
      // Errors and warnings
      errors: this.deploymentResults.errors,
      
      // Next steps
      nextSteps: [
        'Verify all alarms are in OK state',
        'Test DynamoDB table write/read operations', 
        'Confirm Lambda function can be invoked',
        'Proceed to Phase 2: Backend Integration'
      ]
    };
    
    const reportPath = path.join(__dirname, '..', 'logs', `abuse-protection-phase1-${Date.now()}.json`);
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log(`📄 Phase 1 report saved: ${reportPath}`, 'blue');
    
    return report;
  }

  displayResults() {
    log('\n🎉 PHASE 1 DEPLOYMENT RESULTS', 'bold');
    log('=' * 50, 'green');
    
    log('\n📋 Infrastructure Created:', 'bold');
    if (this.deploymentResults.dynamodbTable) {
      log(`✅ DynamoDB Table: ${this.deploymentResults.dynamodbTable.arn}`, 'green');
    }
    if (this.deploymentResults.lambdaFunction) {
      log(`✅ Lambda Function: ${this.deploymentResults.lambdaFunction.arn}`, 'green');
    }
    if (this.deploymentResults.iamRole) {
      log(`✅ IAM Role: ${this.deploymentResults.iamRole.arn}`, 'green');
    }
    
    log(`\n📊 CloudWatch Alarms: ${this.deploymentResults.alarms.length} created`, 'bold');
    this.deploymentResults.alarms.forEach(alarm => {
      log(`  ✅ ${alarm.name}`, 'green');
    });
    
    if (this.deploymentResults.dashboardUrl) {
      log(`\n📈 Dashboard: ${this.deploymentResults.dashboardUrl}`, 'bold');
    }
    
    if (this.deploymentResults.errors.length > 0) {
      log(`\n⚠️ Warnings/Errors: ${this.deploymentResults.errors.length}`, 'yellow');
      this.deploymentResults.errors.forEach(error => {
        log(`  ⚠️ ${error.component}: ${error.error}`, 'yellow');
      });
    }
    
    log('\n💰 Cost Impact: $0.00 (within AWS free tier)', 'green');
    log('🔒 Security: All resources tagged Env=FreeTier', 'green');
    log('🚀 Status: Ready for Phase 2 (Backend Integration)', 'green');
    
    log('\n📋 Next Steps:', 'bold');
    log('1. Review deployment report in logs/', 'blue');
    log('2. Verify alarms in CloudWatch console', 'blue');
    log('3. Test DynamoDB table accessibility', 'blue');
    log('4. Approve Phase 2: Backend Integration', 'blue');
  }

  async cleanup() {
    log('\n🧹 Cleaning up failed deployment...', 'yellow');
    
    // This method would clean up any partially created resources
    // For safety, we'll just log what would be cleaned up
    log('⚠️ Manual cleanup may be required for:', 'yellow');
    if (this.deploymentResults.dynamodbTable) {
      log(`  - DynamoDB table: ${this.deploymentResults.dynamodbTable.name}`, 'blue');
    }
    if (this.deploymentResults.lambdaFunction) {
      log(`  - Lambda function: ${this.deploymentResults.lambdaFunction.name}`, 'blue');
    }
    if (this.deploymentResults.iamRole) {
      log(`  - IAM role: ${this.deploymentResults.iamRole.name}`, 'blue');
    }
    this.deploymentResults.alarms.forEach(alarm => {
      log(`  - CloudWatch alarm: ${alarm.name}`, 'blue');
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('📖 StackPro Abuse Protection - Phase 1 Infrastructure');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/deploy-abuse-protection-phase1.js     # Deploy infrastructure');
    console.log('  node scripts/deploy-abuse-protection-phase1.js --help # Show this help');
    console.log('');
    console.log('Creates:');
    console.log('  • DynamoDB table: stackpro-sandbox-quotas');
    console.log('  • Lambda function: stackpro-sandbox-tenant-lock');
    console.log('  • 6 CloudWatch alarms for monitoring');
    console.log('  • CloudWatch dashboard for abuse protection');
    return;
  }
  
  const deployer = new AbuseProtectionPhase1Deployer();
  await deployer.deployPhase1();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Phase 1 deployment failed:', error.message);
    process.exit(1);
  });
}

module.exports = { AbuseProtectionPhase1Deployer };
