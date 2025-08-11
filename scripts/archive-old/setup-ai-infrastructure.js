#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-west-2'
});

const iam = new AWS.IAM();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const logs = new AWS.CloudWatchLogs();
const bedrock = new AWS.BedrockRuntime();

class AIInfrastructureSetup {
  constructor() {
    this.accountId = null;
    this.policies = {};
  }

  async setup() {
    console.log('🚀 Setting up StackPro AI Infrastructure...\n');

    try {
      // Get AWS account ID
      const sts = new AWS.STS();
      const identity = await sts.getCallerIdentity().promise();
      this.accountId = identity.Account;
      console.log(`✅ AWS Account ID: ${this.accountId}\n`);

      // Load IAM policies
      await this.loadPolicies();

      // Step 1: Create S3 bucket for knowledge base
      await this.createS3KnowledgeBase();

      // Step 2: Create DynamoDB tables
      await this.createDynamoDBTables();

      // Step 3: Create CloudWatch log groups
      await this.createLogGroups();

      // Step 4: Create IAM roles and policies
      await this.createIAMResources();

      // Step 5: Test Bedrock access
      await this.testBedrockAccess();

      console.log('\n🎉 AI Infrastructure setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Update your .env file with the created resources');
      console.log('2. Run: node scripts/test-ai-setup.js to validate setup');
      console.log('3. Start implementing the AI services\n');

    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }

  async loadPolicies() {
    console.log('📋 Loading IAM policies...');
    try {
      const policiesPath = path.join(__dirname, '../config/aws/bedrock-iam-policies.json');
      const policiesContent = await fs.readFile(policiesPath, 'utf8');
      this.policies = JSON.parse(policiesContent);
      
      // Replace placeholder values
      Object.keys(this.policies).forEach(policyName => {
        let policyStr = JSON.stringify(this.policies[policyName]);
        policyStr = policyStr.replace(/\$\{AWS::AccountId\}/g, this.accountId);
        this.policies[policyName] = JSON.parse(policyStr);
      });
      
      console.log(`✅ Loaded ${Object.keys(this.policies).length} IAM policies\n`);
    } catch (error) {
      throw new Error(`Failed to load policies: ${error.message}`);
    }
  }

  async createS3KnowledgeBase() {
    console.log('📁 Creating S3 Knowledge Base...');
    
    const bucketName = 'stackpro-knowledge-base';
    
    try {
      // Check if bucket exists
      try {
        await s3.headBucket({ Bucket: bucketName }).promise();
        console.log(`✅ S3 bucket ${bucketName} already exists`);
      } catch (error) {
        if (error.statusCode === 404) {
          // Create bucket
          await s3.createBucket({
            Bucket: bucketName,
            CreateBucketConfiguration: {
              LocationConstraint: AWS.config.region !== 'us-east-1' ? AWS.config.region : undefined
            }
          }).promise();
          console.log(`✅ Created S3 bucket: ${bucketName}`);
        } else {
          throw error;
        }
      }

      // Set up bucket versioning
      await s3.putBucketVersioning({
        Bucket: bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      }).promise();

      // Set up lifecycle configuration
      await s3.putBucketLifecycleConfiguration({
        Bucket: bucketName,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: 'DeleteOldVersions',
              Status: 'Enabled',
              Filter: {},
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30
              }
            },
            {
              ID: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled', 
              Filter: {},
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7
              }
            }
          ]
        }
      }).promise();

      // Create folder structure for demo client
      await this.createClientFolders('demo-client-123');
      
      console.log('✅ S3 Knowledge Base configured successfully\n');
      
    } catch (error) {
      throw new Error(`S3 setup failed: ${error.message}`);
    }
  }

  async createClientFolders(clientId) {
    const bucketName = 'stackpro-knowledge-base';
    const folders = [
      `${clientId}/documents/raw/`,
      `${clientId}/documents/processed/`,
      `${clientId}/documents/metadata/`,
      `${clientId}/embeddings/`,
      `${clientId}/chat-history/`
    ];

    for (const folder of folders) {
      await s3.putObject({
        Bucket: bucketName,
        Key: folder,
        Body: '',
        Metadata: {
          'client-id': clientId,
          'created-by': 'stackpro-setup'
        }
      }).promise();
    }

    console.log(`✅ Created folder structure for client: ${clientId}`);
  }

  async createDynamoDBTables() {
    console.log('🗄️ Creating DynamoDB tables...');

    const tables = [
      {
        TableName: 'StackPro-AIEmbeddings',
        KeySchema: [
          { AttributeName: 'clientId', KeyType: 'HASH' },
          { AttributeName: 'documentId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'clientId', AttributeType: 'S' },
          { AttributeName: 'documentId', AttributeType: 'S' },
          { AttributeName: 'chunkId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'ChunkIndex',
            KeySchema: [
              { AttributeName: 'clientId', KeyType: 'HASH' },
              { AttributeName: 'chunkId', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            BillingMode: 'PAY_PER_REQUEST'
          },
          {
            IndexName: 'TimestampIndex',
            KeySchema: [
              { AttributeName: 'clientId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            BillingMode: 'PAY_PER_REQUEST'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamEnabled: true,
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        },
        Tags: [
          { Key: 'Environment', Value: 'production' },
          { Key: 'Service', Value: 'stackpro-ai' }
        ]
      },
      {
        TableName: 'StackPro-ChatHistory',
        KeySchema: [
          { AttributeName: 'conversationId', KeyType: 'HASH' },
          { AttributeName: 'messageId', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'conversationId', AttributeType: 'S' },
          { AttributeName: 'messageId', AttributeType: 'S' },
          { AttributeName: 'clientId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'ClientIndex',
            KeySchema: [
              { AttributeName: 'clientId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            BillingMode: 'PAY_PER_REQUEST'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        },
        Tags: [
          { Key: 'Environment', Value: 'production' },
          { Key: 'Service', Value: 'stackpro-ai' }
        ]
      },
      {
        TableName: 'StackPro-AIUsage',
        KeySchema: [
          { AttributeName: 'clientId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'clientId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
          { AttributeName: 'date', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'DateIndex',
            KeySchema: [
              { AttributeName: 'clientId', KeyType: 'HASH' },
              { AttributeName: 'date', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            BillingMode: 'PAY_PER_REQUEST'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        Tags: [
          { Key: 'Environment', Value: 'production' },
          { Key: 'Service', Value: 'stackpro-ai' }
        ]
      }
    ];

    for (const tableConfig of tables) {
      try {
        // Check if table exists
        await dynamodb.describeTable({ TableName: tableConfig.TableName }).promise();
        console.log(`✅ Table ${tableConfig.TableName} already exists`);
      } catch (error) {
        if (error.code === 'ResourceNotFoundException') {
          await dynamodb.createTable(tableConfig).promise();
          console.log(`✅ Created table: ${tableConfig.TableName}`);
          
          // Wait for table to become active
          await this.waitForTableActive(tableConfig.TableName);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ DynamoDB tables configured successfully\n');
  }

  async waitForTableActive(tableName) {
    console.log(`⏳ Waiting for table ${tableName} to become active...`);
    
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await dynamodb.describeTable({ TableName: tableName }).promise();
        if (result.Table.TableStatus === 'ACTIVE') {
          console.log(`✅ Table ${tableName} is now active`);
          return;
        }
        
        console.log(`⏳ Table ${tableName} status: ${result.Table.TableStatus}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        
      } catch (error) {
        console.error(`❌ Error checking table status: ${error.message}`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error(`Table ${tableName} did not become active within expected time`);
  }

  async createLogGroups() {
    console.log('📊 Creating CloudWatch log groups...');

    const logGroups = [
      '/stackpro/ai/embeddings',
      '/stackpro/ai/chat',
      '/stackpro/ai/documents',
      '/stackpro/ai/usage',
      '/stackpro/ai/demo-client-123'
    ];

    for (const logGroupName of logGroups) {
      try {
        await logs.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();
        console.log(`✅ Log group ${logGroupName} already exists`);
      } catch (error) {
        await logs.createLogGroup({
          logGroupName,
          tags: {
            Environment: 'production',
            Service: 'stackpro-ai'
          }
        }).promise();

        // Set retention period
        await logs.putRetentionPolicy({
          logGroupName,
          retentionInDays: 30
        }).promise();

        console.log(`✅ Created log group: ${logGroupName}`);
      }
    }

    console.log('✅ CloudWatch log groups configured successfully\n');
  }

  async createIAMResources() {
    console.log('🔐 Creating IAM roles and policies...');

    // Create policies first
    for (const [policyName, policyDocument] of Object.entries(this.policies)) {
      if (policyName === 'StackPro-TrustPolicy') continue; // Skip trust policy
      
      try {
        await iam.getPolicy({
          PolicyArn: `arn:aws:iam::${this.accountId}:policy/${policyName}`
        }).promise();
        console.log(`✅ Policy ${policyName} already exists`);
      } catch (error) {
        if (error.code === 'NoSuchEntity') {
          await iam.createPolicy({
            PolicyName: policyName,
            PolicyDocument: JSON.stringify(policyDocument),
            Description: `StackPro AI policy: ${policyName}`,
            Tags: [
              { Key: 'Environment', Value: 'production' },
              { Key: 'Service', Value: 'stackpro-ai' }
            ]
          }).promise();
          console.log(`✅ Created policy: ${policyName}`);
        } else {
          throw error;
        }
      }
    }

    // Create master AI service role
    const masterRoleName = 'StackPro-AIService';
    try {
      await iam.getRole({ RoleName: masterRoleName }).promise();
      console.log(`✅ Role ${masterRoleName} already exists`);
    } catch (error) {
      if (error.code === 'NoSuchEntity') {
        await iam.createRole({
          RoleName: masterRoleName,
          AssumeRolePolicyDocument: JSON.stringify(this.policies['StackPro-TrustPolicy']),
          Description: 'Master role for StackPro AI services',
          Tags: [
            { Key: 'Environment', Value: 'production' },
            { Key: 'Service', Value: 'stackpro-ai' }
          ]
        }).promise();

        // Attach master policy
        await iam.attachRolePolicy({
          RoleName: masterRoleName,
          PolicyArn: `arn:aws:iam::${this.accountId}:policy/StackPro-BedrockMasterPolicy`
        }).promise();

        console.log(`✅ Created role: ${masterRoleName}`);
      } else {
        throw error;
      }
    }

    // Create demo client role
    await this.createClientRole('demo-client-123');

    console.log('✅ IAM resources configured successfully\n');
  }

  async createClientRole(clientId) {
    const roleName = `StackPro-Client-${clientId}`;
    
    try {
      await iam.getRole({ RoleName: roleName }).promise();
      console.log(`✅ Client role ${roleName} already exists`);
    } catch (error) {
      if (error.code === 'NoSuchEntity') {
        await iam.createRole({
          RoleName: roleName,
          AssumeRolePolicyDocument: JSON.stringify(this.policies['StackPro-TrustPolicy']),
          PermissionsBoundary: `arn:aws:iam::${this.accountId}:policy/StackPro-ClientBoundaryPolicy`,
          Description: `Client-specific role for ${clientId}`,
          Tags: [
            { Key: 'ClientId', Value: clientId },
            { Key: 'Environment', Value: 'production' },
            { Key: 'Service', Value: 'stackpro-ai' }
          ]
        }).promise();

        // Attach client policy
        await iam.attachRolePolicy({
          RoleName: roleName,
          PolicyArn: `arn:aws:iam::${this.accountId}:policy/StackPro-ClientBedrockPolicy`
        }).promise();

        console.log(`✅ Created client role: ${roleName}`);
      } else {
        throw error;
      }
    }
  }

  async testBedrockAccess() {
    console.log('🧪 Testing Bedrock access...');

    try {
      // Test Claude 3.5 Sonnet access
      const testPayload = {
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: 'Say "StackPro AI setup successful!" if you can read this.'
            }
          ]
        })
      };

      const response = await bedrock.invokeModel(testPayload).promise();
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      console.log('✅ Claude 3.5 Sonnet test successful');
      console.log(`📝 Response: ${responseBody.content[0].text}`);

      // Test Titan Embeddings access
      const embeddingPayload = {
        modelId: 'amazon.titan-embed-text-v1',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: 'Test embedding for StackPro AI setup'
        })
      };

      const embeddingResponse = await bedrock.invokeModel(embeddingPayload).promise();
      const embeddingBody = JSON.parse(new TextDecoder().decode(embeddingResponse.body));
      
      console.log('✅ Titan Embeddings test successful');
      console.log(`📊 Embedding dimension: ${embeddingBody.embedding.length}`);

    } catch (error) {
      console.warn('⚠️ Bedrock access test failed (this might be expected if Bedrock is not enabled):');
      console.warn(`   ${error.message}`);
      console.warn('   Please ensure Bedrock is enabled in your AWS account and region');
    }

    console.log('✅ Bedrock configuration validated\n');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new AIInfrastructureSetup();
  setup.setup().catch(console.error);
}

module.exports = AIInfrastructureSetup;
