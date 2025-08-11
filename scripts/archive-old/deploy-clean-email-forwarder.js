#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

/**
 * Deploy Clean Email Forwarder Lambda
 * Replaces the messy email forwarding with clean, readable format
 */
class CleanEmailForwarderDeployer {
  constructor() {
    this.region = process.env.AWS_REGION || 'us-west-2';
    this.lambda = new AWS.Lambda({ region: this.region });
    this.s3 = new AWS.S3({ region: this.region });
    this.ses = new AWS.SES({ region: this.region });
    
    this.functionName = 'stackpro-clean-email-forwarder';
    this.emailBucket = 'stackpro-emails-clean';
  }

  /**
   * Create deployment package
   */
  async createDeploymentPackage() {
    console.log('📦 Creating deployment package...');
    
    const zipPath = path.join(__dirname, '../lambda-clean-email-forwarder.zip');
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log(`✅ Deployment package created: ${archive.pointer()} bytes`);
        resolve(zipPath);
      });
      
      archive.on('error', reject);
      archive.pipe(output);
      
      // Add the Lambda function
      archive.file('lambda-email-forwarder-clean.js', { name: 'index.js' });
      
      // Add the email parser utility
      archive.directory('src/utils/', 'src/utils/');
      
      // Add node_modules for dependencies
      if (fs.existsSync('node_modules/mailparser')) {
        archive.directory('node_modules/mailparser', 'node_modules/mailparser');
      }
      if (fs.existsSync('node_modules/@aws-sdk')) {
        archive.directory('node_modules/@aws-sdk', 'node_modules/@aws-sdk');
      }
      
      // Add package.json
      archive.file('package.json', { name: 'package.json' });
      
      archive.finalize();
    });
  }

  /**
   * Create or update Lambda function
   */
  async deployLambdaFunction(zipPath) {
    console.log('🚀 Deploying Lambda function...');
    
    const zipBuffer = fs.readFileSync(zipPath);
    
    try {
      // Try to update existing function first
      await this.lambda.updateFunctionCode({
        FunctionName: this.functionName,
        ZipFile: zipBuffer
      }).promise();
      
      console.log('✅ Lambda function updated successfully');
      
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        // Function doesn't exist, create it
        console.log('📝 Creating new Lambda function...');
        
        const createParams = {
          FunctionName: this.functionName,
          Runtime: 'nodejs20.x',
          Role: await this.getLambdaExecutionRole(),
          Handler: 'index.handler',
          Code: { ZipFile: zipBuffer },
          Description: 'StackPro Clean Email Forwarder - Parses and forwards emails in readable format',
          Timeout: 30,
          MemorySize: 256,
          Environment: {
            Variables: {
              AWS_REGION: this.region,
              SES_EMAIL_BUCKET: this.emailBucket,
              ADMIN_FORWARD_EMAIL: process.env.ADMIN_FORWARD_EMAIL || 'nsflournoy@gmail.com',
              INFO_FORWARD_EMAIL: process.env.INFO_FORWARD_EMAIL || 'nsflournoy@gmail.com',
              SUPPORT_FORWARD_EMAIL: process.env.SUPPORT_FORWARD_EMAIL || 'nsflournoy@gmail.com',
              DOCS_FORWARD_EMAIL: process.env.DOCS_FORWARD_EMAIL || 'nsflournoy@gmail.com'
            }
          }
        };
        
        await this.lambda.createFunction(createParams).promise();
        console.log('✅ Lambda function created successfully');
        
      } else {
        throw error;
      }
    }
    
    // Clean up zip file
    fs.unlinkSync(zipPath);
  }

  /**
   * Get or create Lambda execution role
   */
  async getLambdaExecutionRole() {
    const roleName = 'StackProEmailForwarderRole';
    const iam = new AWS.IAM();
    
    try {
      const role = await iam.getRole({ RoleName: roleName }).promise();
      return role.Role.Arn;
    } catch (error) {
      if (error.code === 'NoSuchEntity') {
        console.log('📝 Creating Lambda execution role...');
        
        const assumeRolePolicy = {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        };
        
        const createRoleResult = await iam.createRole({
          RoleName: roleName,
          AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
          Description: 'Execution role for StackPro Clean Email Forwarder Lambda'
        }).promise();
        
        // Attach basic Lambda execution policy
        await iam.attachRolePolicy({
          RoleName: roleName,
          PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        }).promise();
        
        // Attach S3 and SES permissions
        const inlinePolicy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject'
              ],
              Resource: `arn:aws:s3:::${this.emailBucket}/*`
            },
            {
              Effect: 'Allow',
              Action: [
                'ses:SendEmail',
                'ses:SendRawEmail'
              ],
              Resource: '*'
            }
          ]
        };
        
        await iam.putRolePolicy({
          RoleName: roleName,
          PolicyName: 'EmailForwarderPolicy',
          PolicyDocument: JSON.stringify(inlinePolicy)
        }).promise();
        
        console.log('✅ Lambda execution role created');
        
        // Wait a bit for role to propagate
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        return createRoleResult.Role.Arn;
      } else {
        throw error;
      }
    }
  }

  /**
   * Create S3 bucket for email storage if needed
   */
  async ensureEmailBucket() {
    console.log('📦 Ensuring S3 bucket exists...');
    
    try {
      await this.s3.headBucket({ Bucket: this.emailBucket }).promise();
      console.log('✅ S3 bucket already exists');
    } catch (error) {
      if (error.code === 'NotFound') {
        console.log('📝 Creating S3 bucket...');
        
        const createParams = {
          Bucket: this.emailBucket,
          CreateBucketConfiguration: {
            LocationConstraint: this.region
          }
        };
        
        if (this.region === 'us-east-1') {
          delete createParams.CreateBucketConfiguration;
        }
        
        await this.s3.createBucket(createParams).promise();
        
        // Set bucket policy for SES
        const bucketPolicy = {
          Version: '2012-10-17',
          Statement: [{
            Sid: 'AllowSESPuts',
            Effect: 'Allow',
            Principal: { Service: 'ses.amazonaws.com' },
            Action: 's3:PutObject',
            Resource: `arn:aws:s3:::${this.emailBucket}/*`
          }]
        };
        
        await this.s3.putBucketPolicy({
          Bucket: this.emailBucket,
          Policy: JSON.stringify(bucketPolicy)
        }).promise();
        
        console.log('✅ S3 bucket created with SES permissions');
      } else {
        throw error;
      }
    }
  }

  /**
   * Add Lambda permission for SES
   */
  async addSESPermission() {
    console.log('🔐 Adding SES permission to Lambda...');
    
    try {
      await this.lambda.addPermission({
        FunctionName: this.functionName,
        StatementId: 'ses-invoke',
        Action: 'lambda:InvokeFunction',
        Principal: 'ses.amazonaws.com'
      }).promise();
      
      console.log('✅ SES permission added to Lambda');
    } catch (error) {
      if (error.code === 'ResourceConflictException') {
        console.log('ℹ️ SES permission already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Get Lambda function ARN
   */
  async getLambdaArn() {
    const result = await this.lambda.getFunction({
      FunctionName: this.functionName
    }).promise();
    
    return result.Configuration.FunctionArn;
  }

  /**
   * Display next steps
   */
  displayNextSteps(lambdaArn) {
    console.log('\n🎉 Clean Email Forwarder deployed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update your SES receipt rules to use the new Lambda function:');
    console.log(`   Lambda ARN: ${lambdaArn}`);
    console.log(`   S3 Bucket: ${this.emailBucket}`);
    console.log('\n2. Test by sending an email to admin@stackpro.io');
    console.log('3. Check that forwarded emails are now clean and readable');
    console.log('\n💡 The new forwarder will:');
    console.log('   • Parse email content properly');
    console.log('   • Show clean headers (From, To, Subject, Date)');
    console.log('   • Display readable message content');
    console.log('   • List attachments clearly');
    console.log('   • Remove technical SMTP headers');
    
    console.log('\n📧 Example forwarded email format:');
    console.log('   📧 EMAIL FORWARDED VIA STACKPRO');
    console.log('   👤 From: sender@example.com');
    console.log('   📅 Date: Aug 11, 2025, 8:20:00 AM');
    console.log('   📝 Subject: Clean, readable subject');
    console.log('   [Clean message content here]');
  }

  /**
   * Main deployment function
   */
  async deploy() {
    try {
      console.log('🚀 Starting Clean Email Forwarder deployment...\n');
      
      // Create deployment package
      const zipPath = await this.createDeploymentPackage();
      
      // Ensure S3 bucket exists
      await this.ensureEmailBucket();
      
      // Deploy Lambda function
      await this.deployLambdaFunction(zipPath);
      
      // Add SES permission
      await this.addSESPermission();
      
      // Get Lambda ARN for next steps
      const lambdaArn = await this.getLambdaArn();
      
      // Display success and next steps
      this.displayNextSteps(lambdaArn);
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new CleanEmailForwarderDeployer();
  deployer.deploy();
}

module.exports = { CleanEmailForwarderDeployer };
