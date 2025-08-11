# 📬 StackPro Email Receiving & Forwarding System

## 🎯 **SOLUTION: AWS SES EMAIL RECEIVING + FORWARDING**

### **What We'll Build:**
- ✅ **Receive emails** sent to any @stackpro.io address
- ✅ **Save emails** to S3 bucket programmatically  
- ✅ **Forward emails** to your personal email
- ✅ **Process emails** with Lambda functions
- ✅ **Real-time notifications** when emails arrive
- ✅ **Email history** stored and searchable

### **Architecture:**
```
Email → SES Receive → S3 Storage → Lambda Processing → Forward to Gmail
                   → SNS Notification → Real-time alerts
```

---

## 🚀 **STEP 1: CREATE S3 BUCKET FOR EMAIL STORAGE**

Let me create an S3 bucket to store incoming emails:

### **S3 Bucket Configuration:**
```bash
# Create bucket for email storage
aws s3 mb s3://stackpro-emails-storage --profile Stackbox --region us-west-2

# Set bucket policy for SES access
aws s3api put-bucket-policy --bucket stackpro-emails-storage --profile Stackbox --policy file://email-bucket-policy.json
```

### **Bucket Policy (email-bucket-policy.json):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESPuts",
      "Effect": "Allow",
      "Principal": {
        "Service": "ses.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::stackpro-emails-storage/*",
      "Condition": {
        "StringEquals": {
          "aws:Referer": "304052673868"
        }
      }
    }
  ]
}
```

---

## 🔧 **STEP 2: EMAIL PROCESSING LAMBDA FUNCTION**

### **Lambda Function (email-processor.js):**
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ses = new AWS.SES();

exports.handler = async (event) => {
    console.log('Email received:', JSON.stringify(event, null, 2));
    
    try {
        // Get email from S3
        const record = event.Records[0];
        const bucketName = record.s3.bucket.name;
        const objectKey = record.s3.object.key;
        
        // Download email from S3
        const emailObject = await s3.getObject({
            Bucket: bucketName,
            Key: objectKey
        }).promise();
        
        // Parse email content
        const emailContent = emailObject.Body.toString();
        const emailLines = emailContent.split('\n');
        
        // Extract email headers
        let from = '';
        let subject = '';
        let to = '';
        
        for (let line of emailLines) {
            if (line.startsWith('From: ')) {
                from = line.replace('From: ', '').trim();
            }
            if (line.startsWith('Subject: ')) {
                subject = line.replace('Subject: ', '').trim();
            }
            if (line.startsWith('To: ')) {
                to = line.replace('To: ', '').trim();
            }
        }
        
        // Forward email to your personal address
        const forwardedSubject = `[StackPro] ${subject}`;
        const forwardedBody = `
Original Email Received at: ${to}
From: ${from}
Subject: ${subject}
Date: ${new Date().toISOString()}

--- Original Message ---
${emailContent}

--- End Original Message ---

Email stored at: s3://${bucketName}/${objectKey}
        `;
        
        // Send forwarded email
        await ses.sendEmail({
            Source: 'admin@stackpro.io',
            Destination: {
                ToAddresses: ['YOUR_PERSONAL_EMAIL@gmail.com'] // Replace with your email
            },
            Message: {
                Subject: {
                    Data: forwardedSubject
                },
                Body: {
                    Text: {
                        Data: forwardedBody
                    }
                }
            }
        }).promise();
        
        console.log(`Email forwarded successfully from ${from} to YOUR_PERSONAL_EMAIL@gmail.com`);
        
        return {
            statusCode: 200,
            body: JSON.stringify('Email processed and forwarded successfully')
        };
        
    } catch (error) {
        console.error('Error processing email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Error processing email')
        };
    }
};
```

---

## 📋 **STEP 3: SES RECEIPT RULE CONFIGURATION**

### **Create Receipt Rule Set:**
```bash
# Create rule set for receiving emails
aws ses create-receipt-rule-set \
    --rule-set-name stackpro-incoming-emails \
    --profile Stackbox \
    --region us-west-2

# Set as active rule set
aws ses set-active-receipt-rule-set \
    --rule-set-name stackpro-incoming-emails \
    --profile Stackbox \
    --region us-west-2
```

### **Create Receipt Rule:**
```bash
# Create rule to handle incoming emails
aws ses create-receipt-rule \
    --rule-set-name stackpro-incoming-emails \
    --rule file://receipt-rule.json \
    --profile Stackbox \
    --region us-west-2
```

### **Receipt Rule Configuration (receipt-rule.json):**
```json
{
  "Name": "stackpro-forward-all",
  "Enabled": true,
  "TlsPolicy": "Optional",
  "Recipients": [
    "admin@stackpro.io",
    "support@stackpro.io", 
    "sales@stackpro.io",
    "info@stackpro.io"
  ],
  "Actions": [
    {
      "S3Action": {
        "BucketName": "stackpro-emails-storage",
        "ObjectKeyPrefix": "incoming-emails/",
        "TopicArn": "arn:aws:sns:us-west-2:304052673868:stackpro-email-notifications"
      }
    }
  ]
}
```

---

## 🚨 **STEP 4: REAL-TIME NOTIFICATIONS**

### **SNS Topic for Email Notifications:**
```bash
# Create SNS topic for email notifications
aws sns create-topic \
    --name stackpro-email-notifications \
    --profile Stackbox \
    --region us-west-2

# Subscribe your email to get notified
aws sns subscribe \
    --topic-arn arn:aws:sns:us-west-2:304052673868:stackpro-email-notifications \
    --protocol email \
    --notification-endpoint YOUR_PERSONAL_EMAIL@gmail.com \
    --profile Stackbox \
    --region us-west-2
```

---

## 🛠️ **AUTOMATED SETUP SCRIPT**

Let me create a script to set everything up automatically:

### **setup-email-forwarding.js:**
```javascript
const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS
AWS.config.update({
  region: 'us-west-2',
  profile: 'Stackbox'
});

const s3 = new AWS.S3();
const ses = new AWS.SES();
const sns = new AWS.SNS();
const lambda = new AWS.Lambda();

async function setupEmailForwarding() {
  console.log('🚀 Setting up StackPro email receiving and forwarding...');

  try {
    // 1. Create S3 bucket
    console.log('📦 Creating S3 bucket for email storage...');
    await s3.createBucket({
      Bucket: 'stackpro-emails-storage',
      CreateBucketConfiguration: {
        LocationConstraint: 'us-west-2'
      }
    }).promise();
    
    // 2. Set S3 bucket policy
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [{
        Sid: "AllowSESPuts",
        Effect: "Allow",
        Principal: { Service: "ses.amazonaws.com" },
        Action: "s3:PutObject",
        Resource: "arn:aws:s3:::stackpro-emails-storage/*",
        Condition: {
          StringEquals: { "aws:Referer": "304052673868" }
        }
      }]
    };
    
    await s3.putBucketPolicy({
      Bucket: 'stackpro-emails-storage',
      Policy: JSON.stringify(bucketPolicy)
    }).promise();
    
    // 3. Create SNS topic
    console.log('🔔 Creating SNS topic for notifications...');
    const topicResult = await sns.createTopic({
      Name: 'stackpro-email-notifications'
    }).promise();
    
    // 4. Create Lambda function
    console.log('⚡ Creating Lambda function for email processing...');
    const lambdaCode = fs.readFileSync('./email-processor.zip');
    
    await lambda.createFunction({
      FunctionName: 'stackpro-email-processor',
      Runtime: 'nodejs18.x',
      Role: 'arn:aws:iam::304052673868:role/lambda-execution-role',
      Handler: 'index.handler',
      Code: { ZipFile: lambdaCode },
      Description: 'Process and forward incoming emails for StackPro'
    }).promise();
    
    // 5. Create SES receipt rule set
    console.log('📧 Creating SES receipt rules...');
    await ses.createReceiptRuleSet({
      RuleSetName: 'stackpro-incoming-emails'
    }).promise();
    
    // 6. Create receipt rule
    await ses.createReceiptRule({
      RuleSetName: 'stackpro-incoming-emails',
      Rule: {
        Name: 'stackpro-forward-all',
        Enabled: true,
        TlsPolicy: 'Optional',
        Recipients: [
          'admin@stackpro.io',
          'support@stackpro.io',
          'sales@stackpro.io',
          'info@stackpro.io'
        ],
        Actions: [{
          S3Action: {
            BucketName: 'stackpro-emails-storage',
            ObjectKeyPrefix: 'incoming-emails/',
            TopicArn: topicResult.TopicArn
          }
        }]
      }
    }).promise();
    
    // 7. Set active rule set
    await ses.setActiveReceiptRuleSet({
      RuleSetName: 'stackpro-incoming-emails'
    }).promise();
    
    console.log('✅ Email forwarding setup complete!');
    console.log('📧 Emails to @stackpro.io will now be:');
    console.log('   • Saved to S3: s3://stackpro-emails-storage/');
    console.log('   • Forwarded to your personal email');
    console.log('   • Trigger SNS notifications');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

module.exports = { setupEmailForwarding };

// Run if called directly
if (require.main === module) {
  setupEmailForwarding();
}
```

---

## 📧 **HOW IT WORKS**

### **Email Flow:**
1. **Customer sends email** → support@stackpro.io
2. **AWS SES receives** the email
3. **Email saved to S3** → s3://stackpro-emails-storage/incoming-emails/
4. **SNS notification** → triggers Lambda function
5. **Lambda processes** → extracts sender, subject, content
6. **Email forwarded** → YOUR_PERSONAL_EMAIL@gmail.com
7. **You receive** → "[StackPro] Original Subject" with full content

### **What You Get:**
```
Subject: [StackPro] Question about pricing
From: potential-customer@lawfirm.com
To: sales@stackpro.io

--- Forwarded Email ---
Original Email Received at: sales@stackpro.io
From: potential-customer@lawfirm.com
Subject: Question about pricing
Date: 2025-08-06T21:35:00Z

Hi, I'm interested in your business tools platform.
What's the pricing for a 50-person law firm?

Thanks,
John Smith
--- End Original Message ---

Email stored at: s3://stackpro-emails-storage/incoming-emails/2025-08-06/email-123.txt
```

---

## 🎯 **ADVANCED FEATURES**

### **Email Analytics & Search:**
```javascript
// Query all emails from a specific sender
const emailsFromSender = await s3.listObjectsV2({
  Bucket: 'stackpro-emails-storage',
  Prefix: 'incoming-emails/',
  // Add metadata filtering
}).promise();

// Search emails by subject
const emailsBySubject = await searchEmailsBySubject('pricing');

// Get all support emails
const supportEmails = await getEmailsByRecipient('support@stackpro.io');
```

### **Automatic Responses:**
```javascript
// Auto-reply for common emails
if (subject.toLowerCase().includes('pricing')) {
  await ses.sendEmail({
    Source: 'sales@stackpro.io',
    Destination: { ToAddresses: [from] },
    Message: {
      Subject: { Data: 'Re: Pricing Information' },
      Body: { 
        Html: { 
          Data: `
            <h2>Thank you for your interest in StackPro!</h2>
            <p>Our pricing starts at $299/month for small businesses.</p>
            <p>I'll personally follow up within 24 hours.</p>
            <p>Best regards,<br>StackPro Sales Team</p>
          `
        }
      }
    }
  }).promise();
}
```

### **CRM Integration:**
```javascript
// Automatically add email senders to CRM
const customerData = {
  email: from,
  source: 'Email Inquiry',
  firstContact: new Date(),
  inquiry: emailContent
};

await addToEspoCRM(customerData);
```

---

## 💰 **COSTS**

### **AWS Services Costs:**
- **S3 Storage:** $0.023 per GB/month (very cheap for emails)
- **Lambda Executions:** First 1M requests free, then $0.20 per 1M
- **SNS Notifications:** $0.50 per 1M notifications
- **SES Receiving:** $0.10 per 1,000 emails received

### **Example Monthly Costs:**
- **1,000 emails/month:** ~$0.20 total
- **10,000 emails/month:** ~$1.50 total
- **Extremely affordable** for professional email handling

---

## 🚀 **IMPLEMENTATION PLAN**

### **Phase 1: Basic Forwarding (Today)**
1. **✅ Create S3 bucket** for email storage
2. **✅ Set up SES receipt rules** 
3. **✅ Configure basic forwarding** to your Gmail
4. **✅ Test with sample email**

### **Phase 2: Advanced Processing (This Week)**
1. **✅ Add Lambda function** for smart processing
2. **✅ Implement email parsing** and categorization
3. **✅ Add auto-responses** for common inquiries
4. **✅ Integrate with your CRM system**

### **Phase 3: Business Intelligence (Next Week)**
1. **✅ Email analytics dashboard**
2. **✅ Customer inquiry tracking**
3. **✅ Automated lead scoring**
4. **✅ Integration with sales pipeline**

---

## ✅ **READY TO IMPLEMENT**

Would you like me to:
1. **✅ Set up basic email forwarding** right now?
2. **✅ Create the Lambda function** for processing?
3. **✅ Configure receipt rules** to catch all @stackpro.io emails?

**This will give you a complete professional email system with:**
- ✅ **Receive emails** at any @stackpro.io address
- ✅ **Forward to Gmail** automatically  
- ✅ **Save email history** in S3
- ✅ **Real-time notifications** when emails arrive
- ✅ **Professional appearance** for customers

**Cost: ~$1-2/month for unlimited email forwarding and storage!** 💰

**Ready to set this up?** 🚀
