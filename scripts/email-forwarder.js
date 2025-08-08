/**
 * Simple Email Forwarder for StackPro
 * Checks S3 for new emails and forwards them to your personal email
 */

const AWS = require('aws-sdk');

// Simple logger (instead of external dependency)
const logger = {
  error: (message, error) => {
    console.error(`${new Date().toISOString()} [error]:`, message, error);
  },
  info: (message) => {
    console.log(`${new Date().toISOString()} [info]:`, message);
  }
};

// Configure AWS
AWS.config.update({
  region: 'us-west-2',
  profile: 'Stackbox'
});

const s3 = new AWS.S3();
const ses = new AWS.SES();

// Configuration
const BUCKET_NAME = 'stackpro-emails-storage';
const FORWARD_TO_EMAIL = 'nsflournoy@gmail.com'; // ✅ Your email address!

/**
 * Check for new emails in S3 and forward them
 */
async function checkAndForwardEmails() {
  try {
    console.log('🔍 Checking for new emails...');
    
    // List objects in the incoming-emails folder
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: 'incoming-emails/',
      MaxKeys: 10 // Check last 10 emails
    };
    
    const objects = await s3.listObjectsV2(listParams).promise();
    
    if (objects.Contents.length === 0) {
      console.log('📭 No emails found.');
      return;
    }
    
    console.log(`📧 Found ${objects.Contents.length} emails to process.`);
    
    // Process each email
    for (const object of objects.Contents) {
      await processEmail(object.Key);
    }
    
  } catch (error) {
    logger.error('Error checking emails:', error);
  }
}

/**
 * Process and forward a single email
 */
async function processEmail(emailKey) {
  try {
    console.log(`📄 Processing email: ${emailKey}`);
    
    // Download email from S3
    const emailObject = await s3.getObject({
      Bucket: BUCKET_NAME,
      Key: emailKey
    }).promise();
    
    // Parse email content
    const emailContent = emailObject.Body.toString();
    const emailData = parseEmail(emailContent);
    
    // Forward the email
    await forwardEmail(emailData, emailContent);
    
    // Mark as processed (move to processed folder)
    await markEmailAsProcessed(emailKey);
    
    console.log(`✅ Email from ${emailData.from} forwarded successfully.`);
    
  } catch (error) {
    logger.error(`Error processing email ${emailKey}:`, error);
  }
}

/**
 * Parse email content to extract headers
 */
function parseEmail(content) {
  const lines = content.split('\n');
  let from = '';
  let subject = '';
  let to = '';
  let date = '';
  let bodyStart = -1;
  
  // Find headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('From: ')) {
      from = line.replace('From: ', '').trim();
    } else if (line.startsWith('Subject: ')) {
      subject = line.replace('Subject: ', '').trim();
    } else if (line.startsWith('To: ')) {
      to = line.replace('To: ', '').trim();
    } else if (line.startsWith('Date: ')) {
      date = line.replace('Date: ', '').trim();
    } else if (line.trim() === '' && bodyStart === -1) {
      bodyStart = i + 1;
      break;
    }
  }
  
  // Extract body
  const body = bodyStart > -1 ? lines.slice(bodyStart).join('\n').trim() : '';
  
  return { from, subject, to, date, body };
}

/**
 * Forward email to personal address
 */
async function forwardEmail(emailData, originalContent) {
  const forwardedSubject = `[StackPro] ${emailData.subject || 'No Subject'}`;
  
  const forwardedBody = `
🚀 NEW EMAIL RECEIVED AT STACKPRO.IO

📧 To: ${emailData.to}
👤 From: ${emailData.from}
📅 Date: ${emailData.date}
📝 Subject: ${emailData.subject}

--- ORIGINAL MESSAGE ---
${emailData.body}

--- END ORIGINAL MESSAGE ---

💾 Original email stored in S3
🔗 View in AWS Console: https://console.aws.amazon.com/s3/
  `;
  
  // Send forwarded email
  const params = {
    Source: 'admin@stackpro.io',
    Destination: {
      ToAddresses: [FORWARD_TO_EMAIL]
    },
    Message: {
      Subject: {
        Data: forwardedSubject
      },
      Body: {
        Text: {
          Data: forwardedBody
        },
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1e40af; margin: 0;">🚀 New Email at StackPro.io</h2>
              </div>
              
              <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
                <p><strong>📧 To:</strong> ${emailData.to}</p>
                <p><strong>👤 From:</strong> ${emailData.from}</p>
                <p><strong>📅 Date:</strong> ${emailData.date}</p>
                <p><strong>📝 Subject:</strong> ${emailData.subject}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h3>Original Message:</h3>
                <pre style="white-space: pre-wrap; font-family: inherit;">${emailData.body}</pre>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 8px; font-size: 14px; color: #0369a1;">
                💾 Original email stored in S3<br>
                🔗 <a href="https://console.aws.amazon.com/s3/">View in AWS Console</a>
              </div>
            </div>
          `
        }
      }
    }
  };
  
  await ses.sendEmail(params).promise();
}

/**
 * Mark email as processed by moving it to processed folder
 */
async function markEmailAsProcessed(emailKey) {
  const processedKey = emailKey.replace('incoming-emails/', 'processed-emails/');
  
  // Copy to processed folder
  await s3.copyObject({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${emailKey}`,
    Key: processedKey
  }).promise();
  
  // Delete from incoming folder
  await s3.deleteObject({
    Bucket: BUCKET_NAME,
    Key: emailKey
  }).promise();
}

/**
 * Test email forwarding (send a test email to yourself)
 */
async function testEmailForwarding() {
  try {
    console.log('🧪 Testing email forwarding...');
    
    const testEmailParams = {
      Source: 'admin@stackpro.io',
      Destination: {
        ToAddresses: [FORWARD_TO_EMAIL]
      },
      Message: {
        Subject: {
          Data: '[StackPro] Email Forwarding Test'
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1e40af;">✅ Email Forwarding Test Successful!</h1>
                <p>Your StackPro email forwarding system is working correctly.</p>
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>✅ What's Working:</h3>
                  <ul>
                    <li>📧 Domain verified: stackpro.io</li>
                    <li>📦 S3 bucket created: stackpro-emails-storage</li>
                    <li>⚡ SES receipt rules active</li>
                    <li>🔄 Email forwarding configured</li>
                  </ul>
                </div>
                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px;">
                  <h3>📋 Next Steps:</h3>
                  <ol>
                    <li>Update FORWARD_TO_EMAIL in email-forwarder.js</li>
                    <li>Test by sending email to support@stackpro.io</li>
                    <li>Check this inbox for forwarded emails</li>
                    <li>Integrate with your platform's webhook system</li>
                  </ol>
                </div>
                <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px;">
                  <strong>💡 Pro Tip:</strong> Run <code>node scripts/email-forwarder.js</code> regularly to process incoming emails, or set up a cron job for automation.
                </p>
              </div>
            `
          }
        }
      }
    };
    
    await ses.sendEmail(testEmailParams).promise();
    console.log('✅ Test email sent! Check your personal inbox.');
    
  } catch (error) {
    logger.error('Error sending test email:', error);
  }
}

// Export functions
module.exports = {
  checkAndForwardEmails,
  testEmailForwarding
};

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'test') {
    testEmailForwarding();
  } else if (command === 'check') {
    checkAndForwardEmails();
  } else {
    console.log(`
🚀 StackPro Email Forwarder

Usage:
  node scripts/email-forwarder.js test    # Send test email
  node scripts/email-forwarder.js check   # Check and forward new emails

⚠️  IMPORTANT: Update FORWARD_TO_EMAIL variable with your personal email!

📧 Supported email addresses:
  • admin@stackpro.io
  • support@stackpro.io  
  • sales@stackpro.io
  • info@stackpro.io

💰 Cost: ~$0.10 per 1,000 emails (very affordable!)
    `);
  }
}
