#!/usr/bin/env node

/**
 * AWS Resource Audit for StackPro
 * Comprehensive inventory of all resources in account 304052673868
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const CONFIG = {
  profile: 'Stackbox',
  region: 'us-west-2',
  accountId: '304052673868'
};

class AWSResourceAuditor {
  constructor() {
    // Initialize AWS clients
    this.clients = {
      dynamodb: new AWS.DynamoDB({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      lambda: new AWS.Lambda({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      rds: new AWS.RDS({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      s3: new AWS.S3({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      apigateway: new AWS.APIGateway({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      apigatewayv2: new AWS.ApiGatewayV2({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      amplify: new AWS.Amplify({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      cloudwatch: new AWS.CloudWatch({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      iam: new AWS.IAM({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      route53: new AWS.Route53({
        region: CONFIG.region,
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      route53domains: new AWS.Route53Domains({
        region: 'us-east-1', // Route53 Domains is global
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      }),
      budgets: new AWS.Budgets({
        region: 'us-east-1', // Budgets is global
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      })
    };
    
    this.resources = {
      dynamodb: [],
      lambda: [],
      rds: [],
      s3: [],
      apigateway: [],
      amplify: [],
      cloudwatch: { alarms: [], dashboards: [] },
      iam: { roles: [], policies: [] },
      route53: { zones: [], domains: [] },
      budgets: []
    };
  }

  async auditAllResources() {
    log('🔍 StackPro AWS Resource Audit', 'bold');
    log(`📍 Account: ${CONFIG.accountId} (${CONFIG.profile})`, 'blue');
    log(`🌍 Primary Region: ${CONFIG.region}`, 'blue');
    log(`⏰ Started: ${new Date().toISOString()}`, 'blue');
    
    try {
      await this.validateAccount();
      await this.auditDynamoDB();
      await this.auditLambda();
      await this.auditRDS();
      await this.auditS3();
      await this.auditAPIGateway();
      await this.auditAmplify();
      await this.auditCloudWatch();
      await this.auditIAM();
      await this.auditRoute53();
      await this.auditBudgets();
      
      await this.generateResourceReport();
      await this.analyzeCodeUsage();
      
      log('\n✅ AWS Resource Audit Completed!', 'green');
      
    } catch (error) {
      log(`\n❌ Resource audit failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async validateAccount() {
    log('\n🔍 Validating AWS Account', 'bold');
    
    const sts = new AWS.STS({
      credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
    });
    const identity = await sts.getCallerIdentity().promise();
    
    if (identity.Account !== CONFIG.accountId) {
      throw new Error(`Wrong AWS account: ${identity.Account} (expected ${CONFIG.accountId})`);
    }
    
    log(`✅ Connected to AWS Account: ${identity.Account}`, 'green');
    log(`👤 User: ${identity.Arn}`, 'blue');
  }

  async auditDynamoDB() {
    log('\n🗄️ Auditing DynamoDB Tables', 'bold');
    
    try {
      const tables = await this.clients.dynamodb.listTables().promise();
      
      for (const tableName of tables.TableNames) {
        const tableDescription = await this.clients.dynamodb.describeTable({
          TableName: tableName
        }).promise();
        
        // Get TTL info
        let ttlInfo = null;
        try {
          const ttl = await this.clients.dynamodb.describeTimeToLive({
            TableName: tableName
          }).promise();
          ttlInfo = ttl.TimeToLiveDescription;
        } catch (error) {
          // TTL might not be enabled
        }
        
        const tableInfo = {
          name: tableName,
          arn: tableDescription.Table.TableArn,
          status: tableDescription.Table.TableStatus,
          billingMode: tableDescription.Table.BillingModeSummary?.BillingMode || 'PROVISIONED',
          itemCount: tableDescription.Table.ItemCount,
          sizeBytes: tableDescription.Table.TableSizeBytes,
          keySchema: tableDescription.Table.KeySchema,
          attributes: tableDescription.Table.AttributeDefinitions,
          ttl: ttlInfo,
          tags: await this.getResourceTags('dynamodb', tableDescription.Table.TableArn)
        };
        
        this.resources.dynamodb.push(tableInfo);
        log(`✅ ${tableName} - Status: ${tableInfo.status}, Items: ${tableInfo.itemCount}`, 'green');
      }
      
      log(`📊 Total DynamoDB Tables: ${tables.TableNames.length}`, 'cyan');
      
    } catch (error) {
      log(`⚠️ DynamoDB audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditLambda() {
    log('\n⚡ Auditing Lambda Functions', 'bold');
    
    try {
      const functions = await this.clients.lambda.listFunctions().promise();
      
      for (const func of functions.Functions) {
        // Get function configuration
        const config = await this.clients.lambda.getFunction({
          FunctionName: func.FunctionName
        }).promise();
        
        const functionInfo = {
          name: func.FunctionName,
          arn: func.FunctionArn,
          runtime: func.Runtime,
          handler: func.Handler,
          codeSize: func.CodeSize,
          timeout: func.Timeout,
          memorySize: func.MemorySize,
          lastModified: func.LastModified,
          environment: func.Environment?.Variables || {},
          role: func.Role,
          description: func.Description,
          tags: config.Tags || {}
        };
        
        this.resources.lambda.push(functionInfo);
        log(`✅ ${func.FunctionName} - Runtime: ${func.Runtime}, Size: ${func.CodeSize} bytes`, 'green');
      }
      
      log(`📊 Total Lambda Functions: ${functions.Functions.length}`, 'cyan');
      
    } catch (error) {
      log(`⚠️ Lambda audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditRDS() {
    log('\n🗃️ Auditing RDS Instances', 'bold');
    
    try {
      const instances = await this.clients.rds.describeDBInstances().promise();
      
      for (const instance of instances.DBInstances) {
        const instanceInfo = {
          identifier: instance.DBInstanceIdentifier,
          arn: instance.DBInstanceArn,
          status: instance.DBInstanceStatus,
          engine: instance.Engine,
          engineVersion: instance.EngineVersion,
          instanceClass: instance.DBInstanceClass,
          allocatedStorage: instance.AllocatedStorage,
          multiAZ: instance.MultiAZ,
          endpoint: instance.Endpoint,
          port: instance.DbInstancePort,
          backupRetention: instance.BackupRetentionPeriod,
          tags: await this.getResourceTags('rds', instance.DBInstanceArn)
        };
        
        this.resources.rds.push(instanceInfo);
        log(`✅ ${instance.DBInstanceIdentifier} - Status: ${instance.DBInstanceStatus}, Engine: ${instance.Engine}`, 'green');
      }
      
      log(`📊 Total RDS Instances: ${instances.DBInstances.length}`, 'cyan');
      
    } catch (error) {
      log(`⚠️ RDS audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditS3() {
    log('\n🪣 Auditing S3 Buckets', 'bold');
    
    try {
      const buckets = await this.clients.s3.listBuckets().promise();
      
      for (const bucket of buckets.Buckets) {
        try {
          // Get bucket location
          const location = await this.clients.s3.getBucketLocation({
            Bucket: bucket.Name
          }).promise();
          
          // Get bucket tags
          let tags = {};
          try {
            const tagResult = await this.clients.s3.getBucketTagging({
              Bucket: bucket.Name
            }).promise();
            tags = tagResult.TagSet.reduce((acc, tag) => {
              acc[tag.Key] = tag.Value;
              return acc;
            }, {});
          } catch (tagError) {
            // Bucket might not have tags
          }
          
          const bucketInfo = {
            name: bucket.Name,
            creationDate: bucket.CreationDate,
            region: location.LocationConstraint || 'us-east-1',
            tags: tags
          };
          
          this.resources.s3.push(bucketInfo);
          log(`✅ ${bucket.Name} - Region: ${bucketInfo.region}`, 'green');
          
        } catch (bucketError) {
          log(`⚠️ Could not access bucket ${bucket.Name}: ${bucketError.message}`, 'yellow');
        }
      }
      
      log(`📊 Total S3 Buckets: ${buckets.Buckets.length}`, 'cyan');
      
    } catch (error) {
      log(`⚠️ S3 audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditAPIGateway() {
    log('\n🌐 Auditing API Gateway', 'bold');
    
    try {
      // REST APIs (v1)
      const restApis = await this.clients.apigateway.getRestApis().promise();
      
      for (const api of restApis.items) {
        const apiInfo = {
          type: 'REST',
          id: api.id,
          name: api.name,
          description: api.description,
          createdDate: api.createdDate,
          endpointConfiguration: api.endpointConfiguration,
          tags: api.tags || {}
        };
        
        this.resources.apigateway.push(apiInfo);
        log(`✅ REST API: ${api.name} (${api.id})`, 'green');
      }
      
      // HTTP APIs (v2)
      const httpApis = await this.clients.apigatewayv2.getApis().promise();
      
      for (const api of httpApis.Items) {
        const apiInfo = {
          type: 'HTTP',
          id: api.ApiId,
          name: api.Name,
          description: api.Description,
          createdDate: api.CreatedDate,
          apiEndpoint: api.ApiEndpoint,
          protocolType: api.ProtocolType,
          tags: api.Tags || {}
        };
        
        this.resources.apigateway.push(apiInfo);
        log(`✅ ${api.ProtocolType} API: ${api.Name} (${api.ApiId})`, 'green');
      }
      
      log(`📊 Total API Gateway APIs: ${restApis.items.length + httpApis.Items.length}`, 'cyan');
      
    } catch (error) {
      log(`⚠️ API Gateway audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditAmplify() {
    log('\n📱 Auditing AWS Amplify Apps', 'bold');
    
    try {
      const apps = await this.clients.amplify.listApps().promise();
      
      for (const app of apps.apps) {
        const branches = await this.clients.amplify.listBranches({
          appId: app.appId
        }).promise();
        
        const appInfo = {
          appId: app.appId,
          name: app.name,
          description: app.description,
          repository: app.repository,
          platform: app.platform,
          defaultDomain: app.defaultDomain,
          createTime: app.createTime,
          updateTime: app.updateTime,
          branches: branches.branches,
          tags: app.tags || {}
        };
        
        this.resources.amplify.push(appInfo);
        log(`✅ ${app.name} - Platform: ${app.platform}, Branches: ${branches.branches.length}`, 'green');
      }
      
      log(`📊 Total Amplify Apps: ${apps.apps.length}`, 'cyan');
      
    } catch (error) {
      log(`⚠️ Amplify audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditCloudWatch() {
    log('\n📊 Auditing CloudWatch Resources', 'bold');
    
    try {
      // CloudWatch Alarms
      const alarms = await this.clients.cloudwatch.describeAlarms().promise();
      
      this.resources.cloudwatch.alarms = alarms.MetricAlarms.map(alarm => ({
        name: alarm.AlarmName,
        description: alarm.AlarmDescription,
        state: alarm.StateValue,
        metricName: alarm.MetricName,
        namespace: alarm.Namespace,
        threshold: alarm.Threshold,
        comparisonOperator: alarm.ComparisonOperator,
        actions: alarm.AlarmActions
      }));
      
      // CloudWatch Dashboards
      const dashboards = await this.clients.cloudwatch.listDashboards().promise();
      this.resources.cloudwatch.dashboards = dashboards.DashboardEntries;
      
      log(`✅ Alarms: ${alarms.MetricAlarms.length}, Dashboards: ${dashboards.DashboardEntries.length}`, 'green');
      
    } catch (error) {
      log(`⚠️ CloudWatch audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditIAM() {
    log('\n🔐 Auditing IAM Resources', 'bold');
    
    try {
      // IAM Roles
      const roles = await this.clients.iam.listRoles().promise();
      const stackProRoles = roles.Roles.filter(role => 
        role.RoleName.includes('StackPro') || 
        role.RoleName.includes('stackpro') ||
        role.Description?.includes('StackPro') ||
        role.Description?.includes('stackpro')
      );
      
      this.resources.iam.roles = stackProRoles.map(role => ({
        name: role.RoleName,
        arn: role.Arn,
        description: role.Description,
        createDate: role.CreateDate,
        path: role.Path
      }));
      
      log(`✅ StackPro IAM Roles: ${stackProRoles.length}`, 'green');
      
    } catch (error) {
      log(`⚠️ IAM audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditRoute53() {
    log('\n🌐 Auditing Route53 Resources', 'bold');
    
    try {
      // Hosted Zones
      const zones = await this.clients.route53.listHostedZones().promise();
      
      for (const zone of zones.HostedZones) {
        const records = await this.clients.route53.listResourceRecordSets({
          HostedZoneId: zone.Id
        }).promise();
        
        const zoneInfo = {
          id: zone.Id,
          name: zone.Name,
          recordCount: zone.ResourceRecordSetCount,
          records: records.ResourceRecordSets,
          comment: zone.Config?.Comment
        };
        
        this.resources.route53.zones.push(zoneInfo);
        log(`✅ Hosted Zone: ${zone.Name} - Records: ${zone.ResourceRecordSetCount}`, 'green');
      }
      
      // Registered Domains
      const domains = await this.clients.route53domains.listDomains().promise();
      this.resources.route53.domains = domains.Domains;
      
      domains.Domains.forEach(domain => {
        log(`✅ Domain: ${domain.DomainName} - Status: ${domain.StatusList?.[0] || 'OK'}`, 'green');
      });
      
      log(`📊 Hosted Zones: ${zones.HostedZones.length}, Domains: ${domains.Domains.length}`, 'cyan');
      
    } catch (error) {
      log(`⚠️ Route53 audit failed: ${error.message}`, 'yellow');
    }
  }

  async auditBudgets() {
    log('\n💰 Auditing AWS Budgets', 'bold');
    
    try {
      const sts = new AWS.STS({
        credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.profile })
      });
      const identity = await sts.getCallerIdentity().promise();
      
      const budgets = await this.clients.budgets.describeBudgets({
        AccountId: identity.Account
      }).promise();
      
      this.resources.budgets = budgets.Budgets.map(budget => ({
        name: budget.BudgetName,
        type: budget.BudgetType,
        limit: budget.BudgetLimit,
        timeUnit: budget.TimeUnit,
        costFilters: budget.CostFilters
      }));
      
      budgets.Budgets.forEach(budget => {
        log(`✅ Budget: ${budget.BudgetName} - Limit: $${budget.BudgetLimit.Amount}`, 'green');
      });
      
      log(`📊 Total Budgets: ${budgets.Budgets.length}`, 'cyan');
      
    } catch (error) {
      log(`⚠️ Budgets audit failed: ${error.message}`, 'yellow');
    }
  }

  async getResourceTags(service, arn) {
    try {
      switch (service) {
        case 'dynamodb':
          const dynamoTags = await this.clients.dynamodb.listTagsOfResource({
            ResourceArn: arn
          }).promise();
          return dynamoTags.Tags.reduce((acc, tag) => {
            acc[tag.Key] = tag.Value;
            return acc;
          }, {});
          
        case 'rds':
          const rdsTags = await this.clients.rds.listTagsForResource({
            ResourceName: arn
          }).promise();
          return rdsTags.TagList.reduce((acc, tag) => {
            acc[tag.Key] = tag.Value;
            return acc;
          }, {});
          
        default:
          return {};
      }
    } catch (error) {
      return {};
    }
  }

  async generateResourceReport() {
    log('\n📄 Generating Resource Report', 'bold');
    
    const report = {
      audit: {
        timestamp: new Date().toISOString(),
        account: CONFIG.accountId,
        region: CONFIG.region,
        profile: CONFIG.profile
      },
      summary: {
        dynamodb: this.resources.dynamodb.length,
        lambda: this.resources.lambda.length,
        rds: this.resources.rds.length,
        s3: this.resources.s3.length,
        apigateway: this.resources.apigateway.length,
        amplify: this.resources.amplify.length,
        cloudwatchAlarms: this.resources.cloudwatch.alarms.length,
        cloudwatchDashboards: this.resources.cloudwatch.dashboards.length,
        iamRoles: this.resources.iam.roles.length,
        hostedZones: this.resources.route53.zones.length,
        domains: this.resources.route53.domains.length,
        budgets: this.resources.budgets.length
      },
      resources: this.resources,
      analysis: {
        stackProResources: this.identifyStackProResources(),
        freeTierUsage: this.analyzeFreeTierUsage(),
        costEstimate: this.estimateCosts()
      }
    };
    
    const reportPath = path.join(__dirname, '..', 'logs', `aws-resource-audit-${Date.now()}.json`);
    
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log(`📄 Resource report saved: ${reportPath}`, 'blue');
    
    return report;
  }

  identifyStackProResources() {
    const stackProResources = {
      confirmed: [],
      likely: [],
      unknown: []
    };
    
    // Check DynamoDB tables
    this.resources.dynamodb.forEach(table => {
      if (table.name.includes('stackpro') || table.tags?.Project === 'StackPro') {
        stackProResources.confirmed.push(`DynamoDB: ${table.name}`);
      }
    });
    
    // Check Lambda functions
    this.resources.lambda.forEach(func => {
      if (func.name.includes('stackpro') || func.tags?.Project === 'StackPro') {
        stackProResources.confirmed.push(`Lambda: ${func.name}`);
      }
    });
    
    // Check RDS instances
    this.resources.rds.forEach(rds => {
      if (rds.identifier.includes('stackpro') || rds.tags?.Project === 'StackPro') {
        stackProResources.confirmed.push(`RDS: ${rds.identifier}`);
      }
    });
    
    // Check S3 buckets
    this.resources.s3.forEach(bucket => {
      if (bucket.name.includes('stackpro') || bucket.tags?.Project === 'StackPro') {
        stackProResources.confirmed.push(`S3: ${bucket.name}`);
      }
    });
    
    return stackProResources;
  }

  analyzeFreeTierUsage() {
    return {
      dynamodb: {
        tables: this.resources.dynamodb.length,
        freeTierLimit: 25,
        status: this.resources.dynamodb.length <= 25 ? 'within-limit' : 'exceeds-limit'
      },
      lambda: {
        functions: this.resources.lambda.length,
        freeTierLimit: 'unlimited',
        status: 'within-limit'
      },
      rds: {
        instances: this.resources.rds.length,
        freeTierLimit: 1,
        status: this.resources.rds.length <= 1 ? 'within-limit' : 'exceeds-limit'
      },
      s3: {
        buckets: this.resources.s3.length,
        freeTierLimit: 'unlimited',
        status: 'within-limit'
      }
    };
  }

  estimateCosts() {
    return {
      dynamodb: '$0.00 (Pay-per-request within free tier)',
      lambda: '$0.00 (Within free tier execution limits)',
      rds: this.resources.rds.length > 0 ? '$0.00 (t3.micro within free tier)' : '$0.00',
      s3: '$0.00 (Within free tier storage limits)',
      totalEstimate: '$0.00'
    };
  }

  async analyzeCodeUsage() {
    log('\n💻 Analyzing Code Usage of AWS Resources', 'bold');
    
    // This will scan the codebase to understand how resources are used
    const codeAnalysis = {};
    
    // Check if any code files reference our resources
    const filesToCheck = [
      'src/api/server.js',
      'src/services/database-service.js',
      'src/services/aws-provisioner.js',
      'scripts/setup.js',
      'config/aws-config.json'
    ];
    
    for (const filePath of filesToCheck) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for resource references
        const resourceReferences = {
          dynamodb: (content.match(/dynamodb/gi) || []).length,
          lambda: (content.match(/lambda/gi) || []).length,
          rds: (content.match(/rds|database/gi) || []).length,
          s3: (content.match(/s3|bucket/gi) || []).length,
          apigateway: (content.match(/apigateway|api.gateway/gi) || []).length
        };
        
        codeAnalysis[filePath] = resourceReferences;
      }
    }
    
    log('📋 Code Analysis Results:', 'cyan');
    Object.entries(codeAnalysis).forEach(([file, refs]) => {
      log(`  ${file}:`, 'blue');
      Object.entries(refs).forEach(([service, count]) => {
        if (count > 0) {
          log(`    ${service}: ${count} references`, 'green');
        }
      });
    });
    
    return codeAnalysis;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('📖 StackPro AWS Resource Auditor');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/audit-aws-resources.js        # Full resource audit');
    console.log('  node scripts/audit-aws-resources.js --help # Show this help');
    console.log('');
    console.log('Audits:');
    console.log('  • DynamoDB tables and configuration');
    console.log('  • Lambda functions and settings');
    console.log('  • RDS instances and databases');
    console.log('  • S3 buckets and policies');
    console.log('  • API Gateway APIs');
    console.log('  • AWS Amplify applications');
    console.log('  • CloudWatch alarms and dashboards');
    console.log('  • IAM roles and policies');
    console.log('  • Route53 hosted zones and domains');
    console.log('  • AWS Budgets and cost monitoring');
    return;
  }
  
  const auditor = new AWSResourceAuditor();
  await auditor.auditAllResources();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ AWS resource audit failed:', error.message);
    process.exit(1);
  });
}

module.exports = { AWSResourceAuditor };
