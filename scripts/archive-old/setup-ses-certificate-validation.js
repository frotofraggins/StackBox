#!/usr/bin/env node

/**
 * Setup AWS SES email forwarding for ACM certificate validation
 * Forwards validation emails to nsflournoy@gmail.com
 */

const AWS = require('aws-sdk');
const fs = require('fs');

const CONFIG = {
  PROFILE: 'domain-account',
  REGION: 'us-west-2',
  DOMAIN: 'sandbox.stackpro.io',
  HOSTED_ZONE_ID: 'Z09644762VPS77ZYCBQ3E',
  FORWARD_TO: 'nsflournoy@gmail.com',
  BUCKET_NAME: 'stackpro-ses-emails-validation',
  RULE_SET_NAME: 'stackpro-validation-rules'
};

const VALIDATION_EMAILS = [
  'admin@sandbox.stackpro.io',
  'administrator@sandbox.stackpro.io',
  'hostmaster@sandbox.stackpro.io',
  'postmaster@sandbox.stackpro.io',
  'webmaster@sandbox.stackpro.io'
];

// Initialize AWS services
AWS.config.update({ 
  region: CONFIG.REGION,
  credentials: new AWS.SharedIniFileCredentials({ profile: CONFIG.PROFILE })
});

const ses = new AWS.SES();
const s3 = new AWS.S3();
const route53 = new AWS.Route53();
const lambda = new AWS.Lambda();
const iam = new AWS.IAM();

async function createS3BucketForEmails() {
  console.log('📧 Creating S3 bucket for email storage...');
  
  try {
    await s3.createBucket({
      Bucket: CONFIG.BUCKET_NAME,
      CreateBucketConfiguration: {
        LocationConstraint: CONFIG.REGION
      }
    }).promise();
    console.log(`✅ Created S3 bucket: ${CONFIG.BUCKET_NAME}`);
  } catch (error) {
    if (error.code === 'BucketAlreadyOwnedByYou') {
      console.log(`✅ S3 bucket already exists: ${CONFIG.BUCKET_NAME}`);
    } else {
      throw error;
    }
  }

  // Set bucket policy for SES
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowSESPuts',
        Effect: 'Allow',
        Principal: { Service: 'ses.amazonaws.com' },
        Action: 's3:PutObject',
        Resource: `arn:aws:s3:::${CONFIG.BUCKET_NAME}/*`,
        Condition: {
          StringEquals: {
            'AWS:Referer': AWS.config.credentials.accessKeyId
          }
        }
      }
    ]
  };

  await s3.putBucketPolicy({
    Bucket: CONFIG.BUCKET_NAME,
    Policy: JSON.stringify(bucketPolicy)
  }).promise();

  console.log('✅ Set S3 bucket policy for SES access');
}

async function createLambdaForwarder() {
  console.log('🔧 Creating Lambda function for email forwarding...');

  // Create IAM role for Lambda
  const roleName = 'stackpro-ses-forwarder-role';
  const lambdaFunctionName = 'stackpro-ses-email-forwarder';

  try {
    const role = await iam.createRole({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }
        ]
      })
    }).promise();

    // Attach policies
    await iam.attachRolePolicy({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    }).promise();

    await iam.attachRolePolicy({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
    }).promise();

    await iam.attachRolePolicy({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/AmazonSESFullAccess'
    }).promise();

    console.log('✅ Created IAM role for Lambda');

    // Wait for role propagation
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Create Lambda function
    const lambdaCode = `
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ses = new AWS.SES({ region: '${CONFIG.REGION}' });

exports.handler = async (event) => {
    console.log('SES event received:', JSON.stringify(event, null, 2));
    
    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;
    
    try {
        // Get email from S3
        const emailObj = await s3.getObject({
            Bucket: bucketName,
            Key: objectKey
        }).promise();
        
        const emailContent = emailObj.Body.toString();
        
        // Parse email headers to extract original recipient
        const lines = emailContent.split('\\n');
        let originalTo = '';
        let subject = '';
        
        for (const line of lines) {
            if (line.startsWith('To:')) {
                originalTo = line.substring(3).trim();
            }
            if (line.startsWith('Subject:')) {
                subject = line.substring(8).trim();
            }
        }
        
        // Forward to nsflournoy@gmail.com
        const params = {
            Source: 'admin@sandbox.stackpro.io',
            Destination: {
                ToAddresses: ['${CONFIG.FORWARD_TO}']
            },
            Message: {
                Subject: {
                    Data: '[FORWARDED] ' + subject + ' (Original: ' + originalTo + ')',
                    Charset: 'UTF-8'
                },
                Body: {
                    Text: {
                        Data: 'Original recipient: ' + originalTo + '\\n\\n' + emailContent,
                        Charset: 'UTF-8'
                    }
                }
            }
        };
        
        await ses.sendEmail(params).promise();
        console.log('✅ Email forwarded successfully');
        
        return { statusCode: 200, body: 'Email forwarded' };
    } catch (error) {
        console.error('❌ Error forwarding email:', error);
        throw error;
    }
};`;

    await lambda.createFunction({
      FunctionName: lambdaFunctionName,
      Runtime: 'nodejs18.x',
      Role: role.Role.Arn,
      Handler: 'index.handler',
      Code: {
        ZipFile: Buffer.from(lambdaCode)
      },
      Description: 'Forward SES emails for certificate validation'
    }).promise();

    console.log('✅ Created Lambda function for email forwarding');

    return lambdaFunctionName;

  } catch (error) {
    if (error.code === 'EntityAlreadyExists') {
      console.log('✅ Lambda function already exists');
      return lambdaFunctionName;
    } else {
      throw error;
    }
  }
}

async function addMXRecords() {
  console.log('📧 Adding MX records for SES email receiving...');

  const changeParams = {
    HostedZoneId: CONFIG.HOSTED_ZONE_ID,
    ChangeBatch: {
      Comment: 'MX record for SES email receiving - certificate validation',
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: CONFIG.DOMAIN,
            Type: 'MX',
            TTL: 300,
            ResourceRecords: [
              { Value: `10 inbound-smtp.${CONFIG.REGION}.amazonaws.com` }
            ]
          }
        }
      ]
    }
  };

  const result = await route53.changeResourceRecordSets(changeParams).promise();
  console.log('✅ Added MX record:', result.ChangeInfo.Id);
}

async function createSESReceiptRules() {
  console.log('📨 Creating SES receipt rules...');

  // Create receipt rule set
  try {
    await ses.createReceiptRuleSet({
      RuleSetName: CONFIG.RULE_SET_NAME
    }).promise();
    console.log(`✅ Created receipt rule set: ${CONFIG.RULE_SET_NAME}`);
  } catch (error) {
    if (error.code === 'AlreadyExists') {
      console.log(`✅ Receipt rule set already exists: ${CONFIG.RULE_SET_NAME}`);
    } else {
      throw error;
    }
  }

  // Set as active rule set
  await ses.setActiveReceiptRuleSet({
    RuleSetName: CONFIG.RULE_SET_NAME
  }).promise();
  console.log('✅ Set active receipt rule set');

  // Create rule for validation emails
  const ruleParams = {
    RuleSetName: CONFIG.RULE_SET_NAME,
    Rule: {
      Name: 'certificate-validation-forwarder',
      Enabled: true,
      Recipients: VALIDATION_EMAILS,
      Actions: [
        {
          S3Action: {
            BucketName: CONFIG.BUCKET_NAME,
            ObjectKeyPrefix: 'validation-emails/'
          }
        }
      ]
    }
  };

  try {
    await ses.createReceiptRule(ruleParams).promise();
    console.log('✅ Created receipt rule for validation emails');
  } catch (error) {
    if (error.code === 'AlreadyExists') {
      console.log('✅ Receipt rule already exists');
    } else {
      throw error;
    }
  }
}

async function verifySESForSending() {
  console.log('📧 Verifying email addresses for sending...');

  // Verify the sender email (admin@sandbox.stackpro.io)
  try {
    await ses.verifyEmailIdentity({
      EmailAddress: 'admin@sandbox.stackpro.io'
    }).promise();
    console.log('✅ Verification email sent to admin@sandbox.stackpro.io');
  } catch (error) {
    console.log('⚠️  Email verification may already be pending');
  }

  // Verify destination email
  try {
    await ses.verifyEmailIdentity({
      EmailAddress: CONFIG.FORWARD_TO
    }).promise();
    console.log(`✅ Verification email sent to ${CONFIG.FORWARD_TO}`);
  } catch (error) {
    console.log('⚠️  Email verification may already be pending');
  }
}

async function main() {
  try {
    console.log('🚀 Setting up AWS SES email forwarding for certificate validation...');
    console.log(`Domain: ${CONFIG.DOMAIN}`);
    console.log(`Forward to: ${CONFIG.FORWARD_TO}`);
    console.log(`Validation emails: ${VALIDATION_EMAILS.join(', ')}`);

    await createS3BucketForEmails();
    await addMXRecords();
    await createSESReceiptRules();
    await verifySESForSending();

    console.log('\n🎉 SES email forwarding setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your email for SES verification messages');
    console.log('2. Click verification links for both admin@sandbox.stackpro.io and nsflournoy@gmail.com');
    console.log('3. Wait for ACM validation emails (should arrive within 5 minutes)');
    console.log('4. Validation emails will be forwarded to nsflournoy@gmail.com');
    console.log('5. Click approval links in forwarded emails');

    console.log('\n🔍 Monitor certificate validation:');
    console.log(`aws acm describe-certificate --profile ${CONFIG.PROFILE} --region ${CONFIG.REGION} --certificate-arn "arn:aws:acm:us-west-2:788363206718:certificate/c5dde5d7-9144-4d37-a44f-794c4043f2d1"`);

  } catch (error) {
    console.error('❌ Error setting up SES forwarding:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  VALIDATION_EMAILS,
  createS3BucketForEmails,
  addMXRecords,
  createSESReceiptRules,
  verifySESForSending
};
