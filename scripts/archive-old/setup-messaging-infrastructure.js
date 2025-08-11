#!/usr/bin/env node

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, UpdateTimeToLiveCommand } = require('@aws-sdk/client-dynamodb');
const { IAMClient, CreatePolicyCommand, CreateRoleCommand, AttachRolePolicyCommand } = require('@aws-sdk/client-iam');
const { SNSClient, CreateTopicCommand, SubscribeCommand } = require('@aws-sdk/client-sns');
const { SQSClient, CreateQueueCommand } = require('@aws-sdk/client-sqs');
const { ApiGatewayV2Client, CreateApiCommand, CreateRouteCommand, CreateStageCommand } = require('@aws-sdk/client-apigatewayv2');
const { LambdaClient, CreateFunctionCommand, AddPermissionCommand } = require('@aws-sdk/client-lambda');
const { CloudWatchLogsClient, CreateLogGroupCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const fs = require('fs');
const path = require('path');
const awsConfig = require('../config/aws-config.json');

class MessagingInfrastructureSetup {
  constructor() {
    const clientConfig = {
      region: awsConfig.aws.region,
      profile: awsConfig.aws.profile
    };

    this.dynamodb = new DynamoDBClient(clientConfig);
    this.iam = new IAMClient(clientConfig);
    this.sns = new SNSClient(clientConfig);
    this.sqs = new SQSClient(clientConfig);
    this.apigatewayv2 = new ApiGatewayV2Client(clientConfig);
    this.lambda = new LambdaClient(clientConfig);
    this.cloudWatchLogs = new CloudWatchLogsClient(clientConfig);
    this.sts = new STSClient(clientConfig);
    
    this.region = awsConfig.aws.region;
  }

  async getAccountId() {
    try {
      const command = new GetCallerIdentityCommand({});
      const result = await this.sts.send(command);
      return result.Account;
    } catch (error) {
      console.error('Failed to get AWS account ID:', error);
      throw error;
    }
  }

  async setup() {
    console.log('🚀 Setting up StackPro Messaging Infrastructure...\n');
    
    try {
      // Get AWS account ID first
      this.accountId = await this.getAccountId();
      console.log(`AWS Account ID: ${this.accountId}\n`);

      // Step 1: Create DynamoDB tables
      await this.createDynamoDBTables();
      
      // Step 2: Create IAM roles and policies  
      await this.createIAMResources();
      
      // Step 3: Create WebSocket API Gateway
      await this.createWebSocketAPI();
      
      // Step 4: Create Lambda functions
      await this.createLambdaFunctions();
      
      // Step 5: Create SNS/SQS resources
      await this.createNotificationResources();
      
      // Step 6: Create CloudWatch log groups
      await this.createLogGroups();
      
      console.log('\n✅ Messaging infrastructure setup complete!');
      console.log(`\n🔗 WebSocket Endpoint: ${this.webSocketUrl}`);
      console.log('\n📋 Next Steps:');
      console.log('1. Test basic messaging with: npm run test-messaging');
      console.log('2. Deploy messaging system to production');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      console.error(error.stack);
      process.exit(1);
    }
  }

  async createDynamoDBTables() {
    console.log('📊 Creating DynamoDB tables...');
    
    const schemaPath = path.join(__dirname, '../config/aws/messaging-dynamodb-schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    for (const [tableName, tableConfig] of Object.entries(schema)) {
      try {
        console.log(`  Creating table: ${tableName}`);
        
        const params = {
          ...tableConfig,
          BillingMode: 'PAY_PER_REQUEST'
        };
        
        // Create table
        const createCommand = new CreateTableCommand(params);
        await this.dynamodb.send(createCommand);
        
        // Wait for table to be active - simplified approach
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Enable TTL if specified
        if (tableConfig.TimeToLiveSpecification) {
          const ttlCommand = new UpdateTimeToLiveCommand({
            TableName: tableName,
            TimeToLiveSpecification: tableConfig.TimeToLiveSpecification
          });
          await this.dynamodb.send(ttlCommand);
        }
        
        console.log(`  ✅ ${tableName} created successfully`);
        
      } catch (error) {
        if (error.code === 'ResourceInUseException') {
          console.log(`  ⚠️  ${tableName} already exists`);
        } else {
          throw error;
        }
      }
    }
  }

  async createIAMResources() {
    console.log('🔐 Creating IAM roles and policies...');
    
    const policiesPath = path.join(__dirname, '../config/aws/messaging-iam-policies.json');
    const policies = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));
    
    // Create policies
    for (const [policyName, policyDocument] of Object.entries(policies)) {
      if (policyName === 'StackPro-LambdaTrustPolicy') continue; // Skip trust policy
      
      try {
        console.log(`  Creating policy: ${policyName}`);
        
        const createPolicyCommand = new CreatePolicyCommand({
          PolicyName: policyName,
          PolicyDocument: JSON.stringify(policyDocument),
          Description: `StackPro messaging policy: ${policyName}`
        });
        await this.iam.send(createPolicyCommand);
        
        console.log(`  ✅ ${policyName} created successfully`);
        
      } catch (error) {
        if (error.code === 'EntityAlreadyExistsException') {
          console.log(`  ⚠️  ${policyName} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Create Lambda execution role
    try {
      console.log('  Creating Lambda execution role...');
      
      const createRoleCommand = new CreateRoleCommand({
        RoleName: 'StackPro-MessagingLambdaRole',
        AssumeRolePolicyDocument: JSON.stringify(policies['StackPro-LambdaTrustPolicy']),
        Description: 'StackPro messaging Lambda execution role'
      });
      const role = await this.iam.send(createRoleCommand);
      
      // Attach policies
      const policyArn = `arn:aws:iam::${this.accountId}:policy/StackPro-MessagingMasterPolicy`;
      const attachPolicy1Command = new AttachRolePolicyCommand({
        RoleName: 'StackPro-MessagingLambdaRole',
        PolicyArn: policyArn
      });
      await this.iam.send(attachPolicy1Command);
      
      // Attach basic Lambda execution policy
      const attachPolicy2Command = new AttachRolePolicyCommand({
        RoleName: 'StackPro-MessagingLambdaRole',
        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      });
      await this.iam.send(attachPolicy2Command);
      
      console.log('  ✅ Lambda execution role created successfully');
      
    } catch (error) {
      if (error.code === 'EntityAlreadyExistsException') {
        console.log('  ⚠️  Lambda execution role already exists');
      } else {
        throw error;
      }
    }
  }

  async createWebSocketAPI() {
    console.log('🌐 Creating WebSocket API Gateway...');
    
    try {
      // Create WebSocket API
      const api = await this.apigatewayv2.createApi({
        Name: 'StackPro-Messaging-WebSocket',
        ProtocolType: 'WEBSOCKET',
        RouteSelectionExpression: '$request.body.action',
        Description: 'StackPro real-time messaging WebSocket API'
      }).promise();
      
      const apiId = api.ApiId;
      console.log(`  ✅ WebSocket API created: ${apiId}`);
      
      // Create routes
      const routes = [
        { routeKey: '$connect', target: 'connectHandler' },
        { routeKey: '$disconnect', target: 'disconnectHandler' },
        { routeKey: '$default', target: 'messageHandler' },
        { routeKey: 'sendMessage', target: 'messageHandler' },
        { routeKey: 'joinChannel', target: 'messageHandler' },
        { routeKey: 'typing', target: 'messageHandler' }
      ];
      
      for (const route of routes) {
        await this.apigatewayv2.createRoute({
          ApiId: apiId,
          RouteKey: route.routeKey,
          Target: `integrations/${route.target}` // Will be updated after Lambda creation
        }).promise();
        
        console.log(`  ✅ Route created: ${route.routeKey}`);
      }
      
      // Create stage
      await this.apigatewayv2.createStage({
        ApiId: apiId,
        StageName: 'prod',
        AutoDeploy: true,
        Description: 'Production stage for StackPro messaging'
      }).promise();
      
      const wsUrl = `wss://${apiId}.execute-api.${this.region}.amazonaws.com/prod`;
      console.log(`  ✅ WebSocket endpoint: ${wsUrl}`);
      
      // Save API ID for later use
      this.webSocketApiId = apiId;
      this.webSocketUrl = wsUrl;
      
    } catch (error) {
      console.error('Failed to create WebSocket API:', error);
      throw error;
    }
  }

  async createLambdaFunctions() {
    console.log('⚡ Creating Lambda functions...');
    
    const roleArn = `arn:aws:iam::${this.accountId}:role/StackPro-MessagingLambdaRole`;
    
    // Wait for role to be available
    console.log('  Waiting for IAM role to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const functions = [
      {
        name: 'StackPro-WebSocket-Connect',
        handler: 'websocket-handler.connectHandler',
        description: 'Handle WebSocket connections'
      },
      {
        name: 'StackPro-WebSocket-Disconnect', 
        handler: 'websocket-handler.disconnectHandler',
        description: 'Handle WebSocket disconnections'
      },
      {
        name: 'StackPro-WebSocket-Message',
        handler: 'websocket-handler.messageHandler', 
        description: 'Handle WebSocket messages'
      }
    ];
    
    // Create placeholder Lambda code
    const lambdaCode = `
exports.connectHandler = async (event) => {
  return { statusCode: 200, body: 'Connected' };
};

exports.disconnectHandler = async (event) => {
  return { statusCode: 200, body: 'Disconnected' };
};

exports.messageHandler = async (event) => {
  return { statusCode: 200, body: 'Message processed' };
};
`;
    
    const zipBuffer = this.createZipBuffer('index.js', lambdaCode);
    
    for (const func of functions) {
      try {
        console.log(`  Creating function: ${func.name}`);
        
        const lambdaFunction = await this.lambda.createFunction({
          FunctionName: func.name,
          Runtime: 'nodejs18.x',
          Role: roleArn,
          Handler: func.handler,
          Code: { ZipFile: zipBuffer },
          Description: func.description,
          Timeout: 30,
          Environment: {
            Variables: {
              WEBSOCKET_API_ENDPOINT: this.webSocketUrl?.replace('wss://', 'https://') || '',
              NODE_ENV: 'production'
            }
          },
          Tags: {
            Service: 'StackPro-Messaging',
            Environment: 'Production'
          }
        }).promise();
        
        console.log(`  ✅ ${func.name} created successfully`);
        
        // Grant API Gateway permission to invoke Lambda
        await this.lambda.addPermission({
          FunctionName: func.name,
          StatementId: 'AllowAPIGatewayInvoke',
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com'
        }).promise();
        
      } catch (error) {
        if (error.code === 'ResourceConflictException') {
          console.log(`  ⚠️  ${func.name} already exists`);
        } else {
          throw error;
        }
      }
    }
  }

  async createNotificationResources() {
    console.log('📮 Creating notification resources...');
    
    try {
      // Create demo SNS topic
      const topic = await this.sns.createTopic({
        Name: 'stackpro-notifications-demo',
        Tags: [
          { Key: 'Service', Value: 'StackPro-Messaging' },
          { Key: 'Environment', Value: 'Production' }
        ]
      }).promise();
      
      console.log(`  ✅ SNS topic created: ${topic.TopicArn}`);
      
      // Create demo SQS queue
      const queue = await this.sqs.createQueue({
        QueueName: 'stackpro-messaging-demo',
        Attributes: {
          'MessageRetentionPeriod': '1209600', // 14 days
          'VisibilityTimeoutSeconds': '60'
        },
        tags: {
          'Service': 'StackPro-Messaging',
          'Environment': 'Production'
        }
      }).promise();
      
      console.log(`  ✅ SQS queue created: ${queue.QueueUrl}`);
      
      // Subscribe queue to topic
      const queueArn = queue.QueueUrl.replace('https://sqs.', 'arn:aws:sqs:').replace('.amazonaws.com/', ':').replace('/', ':');
      
      await this.sns.subscribe({
        TopicArn: topic.TopicArn,
        Protocol: 'sqs',
        Endpoint: queueArn
      }).promise();
      
      console.log('  ✅ SQS subscribed to SNS topic');
      
    } catch (error) {
      console.error('Failed to create notification resources:', error);
      throw error;
    }
  }

  async createLogGroups() {
    console.log('📝 Creating CloudWatch log groups...');
    
    const cloudWatchLogs = new AWS.CloudWatchLogs();
    
    const logGroups = [
      '/stackpro/messaging/websocket',
      '/stackpro/messaging/api',
      '/stackpro/messaging/notifications',
      '/aws/lambda/StackPro-WebSocket-Connect',
      '/aws/lambda/StackPro-WebSocket-Disconnect',
      '/aws/lambda/StackPro-WebSocket-Message'
    ];
    
    for (const logGroupName of logGroups) {
      try {
        await cloudWatchLogs.createLogGroup({
          logGroupName,
          tags: {
            Service: 'StackPro-Messaging',
            Environment: 'Production'
          }
        }).promise();
        
        console.log(`  ✅ Log group created: ${logGroupName}`);
        
      } catch (error) {
        if (error.code === 'ResourceAlreadyExistsException') {
          console.log(`  ⚠️  Log group already exists: ${logGroupName}`);
        } else {
          throw error;
        }
      }
    }
  }

  createZipBuffer(filename, content) {
    const JSZip = require('jszip');
    const zip = new JSZip();
    zip.file(filename, content);
    return zip.generateNodeStream({ type: 'nodebuffer' });
  }
}

// Main execution
async function main() {
  const setup = new MessagingInfrastructureSetup();
  await setup.setup();
}

if (require.main === module) {
  main();
}

module.exports = MessagingInfrastructureSetup;
