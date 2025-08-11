#!/usr/bin/env node

/**
 * Deploy the complete AWS SES + Lambda email forwarding system
 * Uses existing S3 bucket and SES rule set, creates Lambda function
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const CONFIG = {
  PROFILE: 'domain-account',
  REGION: 'us-west-2',
  BUCKET_NAME: 'stackpro-ses-emails-validation',
  RULE_SET_NAME: 'stackpro-validation-rules',
  LAMBDA_FUNCTION_NAME: 'stackpro-email-forwarder',
  LAMBDA_ROLE_NAME: 'stackpro-email-forwarder-role',
  FORWARD_TO: 'nsflournoy@gmail.com'
};

const VALIDATION_DOMAINS = ['stackpro.io', 'sandbox.stackpro.io'];

// Initialize AWS services
AWS.config.update({ 
  region: CONFIG.REGION,
  credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.PROFILE })
});

const lambda = new AWS.Lambda();
const iam = new AWS.IAM();
const ses = new AWS.SES();

async function createLambdaRole() {
  console.log('🔧 Creating IAM role for Lambda function...');

  const trustPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Service: 'lambda.amazonaws.com' },
        Action: 'sts:AssumeRole'
      }
    ]
  };

  try {
    const role = await iam.createRole({
      RoleName: CONFIG.LAMBDA_ROLE_NAME,
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: 'Role for StackPro email forwarder Lambda function'
    }).promise();

    console.log(`✅ Created IAM role: ${CONFIG.LAMBDA_ROLE_NAME}`);

    // Attach managed policies
    const policies = [
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
      'arn:aws:iam::aws:policy/AmazonSESFullAccess'
    ];

    for (const policyArn of policies) {
      await iam.attachRolePolicy({
        RoleName: CONFIG.LAMBDA_ROLE_NAME,
        PolicyArn: policyArn
      }).promise();
    }

    console.log('✅ Attached managed policies to role');

    // Wait for role propagation
    console.log('⏳ Waiting for role propagation...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    return role.Role.Arn;

  } catch (error) {
    if (error.code === 'EntityAlreadyExists') {
      console.log(`✅ IAM role already exists: ${CONFIG.LAMBDA_ROLE_NAME}`);
      const role = await iam.getRole({ RoleName: CONFIG.LAMBDA_ROLE_NAME }).promise();
      return role.Role.Arn;
    } else {
      throw error;
    }
  }
}

async function createLambdaFunction(roleArn) {
  console.log('📦 Creating Lambda function...');

  // Read the Lambda function code
  const lambdaCode = fs.readFileSync('scripts/lambda-email-forwarder.js', 'utf8');

  // Update the code to use the correct bucket name
  const updatedCode = lambdaCode.replace(
    'stackpro-emails-storage',
    CONFIG.BUCKET_NAME
  );

  try {
    const result = await lambda.createFunction({
      FunctionName: CONFIG.LAMBDA_FUNCTION_NAME,
      Runtime: 'nodejs18.x',
      Role: roleArn,
      Handler: 'index.handler',
      Code: {
        ZipFile: Buffer.from(`
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: '${CONFIG.REGION}' });
const s3 = new AWS.S3();

exports.handler = async (event) => {
    console.log('📧 SES event received:', JSON.stringify(event, null, 2));
    
    try {
        // Extract email details from SES event
        const sesRecord = event.Records[0].ses;
        const mail = sesRecord.mail;
        const receipt = sesRecord.receipt;
        
        // Try to get the message from S3 (SES stores it there)
        const bucketName = '${CONFIG.BUCKET_NAME}';
        const objectKey = receipt.action.type === 'S3' ? receipt.action.objectKey : \`incoming-emails/\${mail.messageId}\`;
        
        let emailContent = '';
        try {
            const s3Object = await s3.getObject({
                Bucket: bucketName,
                Key: objectKey
            }).promise();
            emailContent = s3Object.Body.toString();
        } catch (s3Error) {
            console.log('ℹ️  Could not fetch from S3, using basic info:', s3Error.message);
            emailContent = \`Email received but content not available in S3. Message ID: \${mail.messageId}\`;
        }
        
        // Parse basic email info
        const subject = mail.commonHeaders.subject || 'No Subject';
        const from = mail.commonHeaders.from ? mail.commonHeaders.from[0] : 'Unknown';
        const to = mail.commonHeaders.to ? mail.commonHeaders.to[0] : 'Unknown';
        const date = mail.commonHeaders.date || new Date().toISOString();
        
        // Create forwarded email
        const forwardedSubject = \`📧 [StackPro] \${subject}\`;
        const forwardedBody = \`🚀 NEW EMAIL RECEIVED AT STACKPRO.IO

📧 To: \${to}
👤 From: \${from}
📅 Date: \${date}
📝 Subject: \${subject}

--- ORIGINAL MESSAGE ---
\${emailContent}

--- END ORIGINAL MESSAGE ---

💾 S3 Storage: \${objectKey}
🔗 Message ID: \${mail.messageId}

This email was automatically forwarded by StackPro Email System.
\`;

        // Send forwarded email
        const forwardParams = {
            Source: 'admin@stackpro.io',
            Destination: {
                ToAddresses: ['${CONFIG.FORWARD_TO}']
            },
            Message: {
                Subject: {
                    Data: forwardedSubject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Text: {
                        Data: forwardedBody,
                        Charset: 'UTF-8'
                    },
                    Html: {
                        Data: \`
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
                                <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                                        <h1 style="margin: 0; font-size: 24px;">🚀 StackPro Email</h1>
                                        <p style="margin: 5px 0 0 0; opacity: 0.9;">New message received</p>
                                    </div>
                                    
                                    <div style="padding: 20px;">
                                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                                            <p style="margin: 0 0 8px 0;"><strong>📧 To:</strong> \${to}</p>
                                            <p style="margin: 0 0 8px 0;"><strong>👤 From:</strong> \${from}</p>
                                            <p style="margin: 0 0 8px 0;"><strong>📅 Date:</strong> \${date}</p>
                                            <p style="margin: 0;"><strong>📝 Subject:</strong> \${subject}</p>
                                        </div>
                                        
                                        <div style="border-left: 4px solid #667eea; padding-left: 16px; margin: 20px 0;">
                                            <h3 style="color: #333; margin: 0 0 10px 0;">Original Message:</h3>
                                            <div style="background: #f1f3f4; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 14px; white-space: pre-wrap; max-height: 400px; overflow-y: auto;">\${emailContent}</div>
                                        </div>
                                        
                                        <div style="margin-top: 20px; padding: 15px; background: #e8f4fd; border-radius: 6px; font-size: 14px; color: #1565c0;">
                                            <p style="margin: 0 0 5px 0;"><strong>💾 Storage:</strong> \${objectKey}</p>
                                            <p style="margin: 0;"><strong>🔗 Message ID:</strong> \${mail.messageId}</p>
                                        </div>
                                    </div>
                                    
                                    <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                                        <p style="margin: 0;">🤖 Automatically forwarded by StackPro Email System</p>
                                    </div>
                                </div>
                            </div>
                        \`,
                        Charset: 'UTF-8'
                    }
                }
            }
        };
        
        await ses.sendEmail(forwardParams).promise();
        console.log(\`✅ Email forwarded successfully to ${CONFIG.FORWARD_TO}\`);
        
        return {
            statusCode: 200,
            body: JSON.stringify('Email forwarded successfully')
        };
        
    } catch (error) {
        console.error('❌ Error forwarding email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Error forwarding email: ' + error.message)
        };
    }
};
        `)
      },
      Description: 'StackPro email forwarder - forwards all emails to nsflournoy@gmail.com',
      Timeout: 30,
      Environment: {
        Variables: {
          FORWARD_TO_EMAIL: CONFIG.FORWARD_TO,
          S3_BUCKET: CONFIG.BUCKET_NAME
        }
      }
    }).promise();

    console.log(`✅ Created Lambda function: ${CONFIG.LAMBDA_FUNCTION_NAME}`);
    return result.FunctionArn;

  } catch (error) {
    if (error.code === 'ResourceConflictException') {
      console.log(`✅ Lambda function already exists: ${CONFIG.LAMBDA_FUNCTION_NAME}`);
      const result = await lambda.getFunction({ FunctionName: CONFIG.LAMBDA_FUNCTION_NAME }).promise();
      return result.Configuration.FunctionArn;
    } else {
      throw error;
    }
  }
}

async function createSESReceiptRules(lambdaArn) {
  console.log('📨 Creating SES receipt rules...');

  // Create rules for each domain
  for (const domain of VALIDATION_DOMAINS) {
    const ruleName = `${domain.replace('.', '-')}-forwarder`;
    
    const ruleParams = {
      RuleSetName: CONFIG.RULE_SET_NAME,
      Rule: {
        Name: ruleName,
        Enabled: true,
        Recipients: [
          `admin@${domain}`,
          `administrator@${domain}`,
          `hostmaster@${domain}`,
          `postmaster@${domain}`,
          `webmaster@${domain}`
        ],
        Actions: [
          {
            S3Action: {
              BucketName: CONFIG.BUCKET_NAME,
              ObjectKeyPrefix: `incoming-emails/${domain}/`
            }
          },
          {
            LambdaAction: {
              FunctionArn: lambdaArn
            }
          }
        ]
      }
    };

    try {
      await ses.createReceiptRule(ruleParams).promise();
      console.log(`✅ Created receipt rule: ${ruleName}`);
    } catch (error) {
      if (error.code === 'AlreadyExists') {
        console.log(`✅ Receipt rule already exists: ${ruleName}`);
      } else {
        throw error;
      }
    }
  }
}

async function addLambdaPermission(lambdaArn) {
  console.log('🔐 Adding SES permission to Lambda function...');

  try {
    await lambda.addPermission({
      FunctionName: CONFIG.LAMBDA_FUNCTION_NAME,
      StatementId: 'allow-ses',
      Action: 'lambda:InvokeFunction',
      Principal: 'ses.amazonaws.com'
    }).promise();

    console.log('✅ Added SES permission to Lambda function');
  } catch (error) {
    if (error.code === 'ResourceConflictException') {
      console.log('✅ SES permission already exists');
    } else {
      throw error;
    }
  }
}

async function main() {
  try {
    console.log('🚀 Deploying complete AWS SES + Lambda email forwarding system...');
    console.log(`📧 Forward to: ${CONFIG.FORWARD_TO}`);
    console.log(`📦 S3 Bucket: ${CONFIG.BUCKET_NAME}`);
    console.log(`📨 SES Rule Set: ${CONFIG.RULE_SET_NAME}`);
    console.log(`⚡ Lambda Function: ${CONFIG.LAMBDA_FUNCTION_NAME}`);

    // Step 1: Create IAM role
    const roleArn = await createLambdaRole();

    // Step 2: Create Lambda function
    const lambdaArn = await createLambdaFunction(roleArn);

    // Step 3: Add Lambda permission for SES
    await addLambdaPermission(lambdaArn);

    // Step 4: Create SES receipt rules
    await createSESReceiptRules(lambdaArn);

    console.log('\n🎉 AWS SES + Lambda email forwarding system deployed successfully!');
    console.log('\n📋 System Status:');
    console.log(`✅ S3 Bucket: ${CONFIG.BUCKET_NAME} (emails stored)`);
    console.log(`✅ SES Rule Set: ${CONFIG.RULE_SET_NAME} (active)`);
    console.log(`✅ Lambda Function: ${CONFIG.LAMBDA_FUNCTION_NAME} (deployed)`);
    console.log(`✅ Email Forwarding: ALL emails → ${CONFIG.FORWARD_TO}`);

    console.log('\n📧 Domains covered:');
    VALIDATION_DOMAINS.forEach(domain => {
      console.log(`   • admin@${domain}`);
      console.log(`   • administrator@${domain}`);
      console.log(`   • hostmaster@${domain}`);
      console.log(`   • postmaster@${domain}`);
      console.log(`   • webmaster@${domain}`);
    });

    console.log('\n🔍 Current certificates awaiting validation:');
    console.log('• arn:aws:acm:us-west-2:788363206718:certificate/da459d4a-8392-444a-8a75-4d9193ba23ad (stackpro.io)');
    console.log('• arn:aws:acm:us-west-2:788363206718:certificate/e0627367-8900-4df4-9dc0-a158ff70b524 (sandbox.stackpro.io)');

    console.log('\n✅ Next steps:');
    console.log('1. Validation emails will now be forwarded to nsflournoy@gmail.com');
    console.log('2. Check your email for AWS certificate validation messages');
    console.log('3. Click the validation links to approve certificates');
    console.log('4. Certificates will be issued within minutes');

  } catch (error) {
    console.error('❌ Error deploying email forwarding system:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  createLambdaRole,
  createLambdaFunction,
  createSESReceiptRules,
  addLambdaPermission
};
