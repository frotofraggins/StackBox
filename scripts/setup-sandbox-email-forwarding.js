#!/usr/bin/env node

/**
 * Setup Email Forwarding for sandbox.stackpro.io
 * Sets up SES email forwarding for certificate validation emails
 */

const { SESClient, CreateReceiptRuleCommand, ListReceiptRuleSetsCommand, CreateReceiptRuleSetCommand } = require('@aws-sdk/client-ses');
const { LambdaClient, CreateFunctionCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } = require('@aws-sdk/client-iam');
const fs = require('fs');

async function setupSandboxEmailForwarding() {
  console.log('📧 Setting up email forwarding for sandbox.stackpro.io...\n');

  const ses = new SESClient({ region: 'us-west-2' });
  const lambda = new LambdaClient({ region: 'us-west-2' });
  const iam = new IAMClient({ region: 'us-west-2' });

  try {
    // Step 1: Create Lambda function for email forwarding (reuse existing if available)
    console.log('1️⃣ Setting up Lambda email forwarder...');
    
    let lambdaArn = '';
    try {
      const existingFunction = await lambda.send(new GetFunctionCommand({
        FunctionName: 'stackpro-email-forwarder'
      }));
      lambdaArn = existingFunction.Configuration.FunctionArn;
      console.log('✅ Using existing Lambda function:', lambdaArn);
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log('📝 Creating new Lambda function...');
        // Read the email forwarder code
        const lambdaCode = fs.readFileSync('lambda-email-forwarder-fixed.js', 'utf8');
        
        // Create IAM role for Lambda
        const roleName = 'stackpro-email-forwarder-role';
        let roleArn = '';
        
        try {
          const existingRole = await iam.send(new GetRoleCommand({ RoleName: roleName }));
          roleArn = existingRole.Role.Arn;
          console.log('✅ Using existing IAM role:', roleArn);
        } catch (roleError) {
          if (roleError.name === 'NoSuchEntity') {
            const trustPolicy = {
              Version: '2012-10-17',
              Statement: [{
                Effect: 'Allow',
                Principal: { Service: 'lambda.amazonaws.com' },
                Action: 'sts:AssumeRole'
              }]
            };

            const roleResult = await iam.send(new CreateRoleCommand({
              RoleName: roleName,
              AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
              Description: 'Role for StackPro email forwarding Lambda'
            }));

            roleArn = roleResult.Role.Arn;
            console.log('✅ Created IAM role:', roleArn);

            // Attach policies
            await iam.send(new AttachRolePolicyCommand({
              RoleName: roleName,
              PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
            }));

            await iam.send(new AttachRolePolicyCommand({
              RoleName: roleName,
              PolicyArn: 'arn:aws:iam::aws:policy/AmazonSESFullAccess'
            }));

            console.log('✅ Attached policies to role');
          } else {
            throw roleError;
          }
        }

        // Create Lambda function
        const functionResult = await lambda.send(new CreateFunctionCommand({
          FunctionName: 'stackpro-email-forwarder',
          Runtime: 'nodejs18.x',
          Role: roleArn,
          Handler: 'index.handler',
          Code: {
            ZipFile: Buffer.from(`
exports.handler = async (event) => {
  console.log('Email forwarding event:', JSON.stringify(event, null, 2));
  
  const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
  const ses = new SESClient({ region: 'us-west-2' });
  
  try {
    for (const record of event.Records) {
      if (record.eventSource === 'aws:ses') {
        const mail = record.ses.mail;
        const receipt = record.ses.receipt;
        
        console.log('Processing email:', {
          messageId: mail.messageId,
          source: mail.source,
          destination: mail.destination,
          subject: mail.commonHeaders.subject
        });
        
        // Forward certificate validation emails to your email
        const forwardTo = 'nflosc@gmail.com';
        
        const forwardParams = {
          Source: 'noreply@stackpro.io',
          Destination: {
            ToAddresses: [forwardTo]
          },
          Message: {
            Subject: {
              Data: \`[CERT VALIDATION] \${mail.commonHeaders.subject || 'Certificate Validation'}\`
            },
            Body: {
              Text: {
                Data: \`Certificate validation email forwarded from \${mail.source}\\n\\nOriginal Subject: \${mail.commonHeaders.subject}\\n\\nThis is an automated forward for SSL certificate validation.\`
              }
            }
          }
        };
        
        await ses.send(new SendEmailCommand(forwardParams));
        console.log('✅ Email forwarded successfully');
      }
    }
    
    return { statusCode: 200, body: 'Email processed successfully' };
  } catch (error) {
    console.error('❌ Email forwarding failed:', error);
    throw error;
  }
};
            `)
          },
          Description: 'Forward emails for certificate validation',
          Timeout: 30,
          Environment: {
            Variables: {
              FORWARD_TO: 'nflosc@gmail.com'
            }
          }
        }));

        lambdaArn = functionResult.FunctionArn;
        console.log('✅ Created Lambda function:', lambdaArn);
      } else {
        throw error;
      }
    }

    // Step 2: Set up SES receipt rule
    console.log('\n2️⃣ Setting up SES receipt rule...');
    
    const ruleSetName = 'stackpro-sandbox-rules';
    
    // Check if rule set exists
    const ruleSets = await ses.send(new ListReceiptRuleSetsCommand({}));
    const existingRuleSet = ruleSets.RuleSets?.find(rs => rs.Name === ruleSetName);
    
    if (!existingRuleSet) {
      console.log('📝 Creating SES receipt rule set...');
      await ses.send(new CreateReceiptRuleSetCommand({
        RuleSetName: ruleSetName
      }));
      console.log('✅ Created SES receipt rule set');
    } else {
      console.log('✅ Using existing SES receipt rule set');
    }

    // Create receipt rule for sandbox domain
    console.log('📝 Creating receipt rule for sandbox.stackpro.io...');
    
    await ses.send(new CreateReceiptRuleCommand({
      RuleSetName: ruleSetName,
      Rule: {
        Name: 'sandbox-cert-validation',
        Enabled: true,
        Recipients: [
          'admin@sandbox.stackpro.io',
          'webmaster@sandbox.stackpro.io',
          'hostmaster@sandbox.stackpro.io',
          'postmaster@sandbox.stackpro.io'
        ],
        Actions: [
          {
            LambdaAction: {
              FunctionArn: lambdaArn,
              InvocationType: 'Event'
            }
          }
        ]
      }
    }));

    console.log('✅ Created SES receipt rule for sandbox domain');

    // Step 3: Output configuration
    console.log('\n' + '='.repeat(80));
    console.log('📧 SANDBOX EMAIL FORWARDING SETUP COMPLETE');
    console.log('='.repeat(80));
    console.log();
    console.log('✅ Configuration Summary:');
    console.log(`   Lambda Function: ${lambdaArn}`);
    console.log(`   SES Rule Set: ${ruleSetName}`);
    console.log('   Forwarding emails to: nflosc@gmail.com');
    console.log();
    console.log('📧 Email addresses configured for certificate validation:');
    console.log('   • admin@sandbox.stackpro.io');
    console.log('   • webmaster@sandbox.stackpro.io');
    console.log('   • hostmaster@sandbox.stackpro.io');
    console.log('   • postmaster@sandbox.stackpro.io');
    console.log();
    console.log('🎯 Next Steps:');
    console.log('1. Verify domain ownership in SES console');
    console.log('2. Set sandbox.stackpro.io MX record to point to AWS SES');
    console.log('3. Request SSL certificate for sandbox.stackpro.io');
    console.log('4. Certificate validation emails will be forwarded to nflosc@gmail.com');
    console.log();

    // Save configuration
    const config = {
      domain: 'sandbox.stackpro.io',
      lambdaArn,
      ruleSetName,
      forwardTo: 'nflosc@gmail.com',
      emailAddresses: [
        'admin@sandbox.stackpro.io',
        'webmaster@sandbox.stackpro.io', 
        'hostmaster@sandbox.stackpro.io',
        'postmaster@sandbox.stackpro.io'
      ],
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync('sandbox-email-config.json', JSON.stringify(config, null, 2));
    console.log('💾 Configuration saved to sandbox-email-config.json');

    return config;

  } catch (error) {
    console.error('❌ Email forwarding setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupSandboxEmailForwarding().catch(console.error);
}

module.exports = { setupSandboxEmailForwarding };
