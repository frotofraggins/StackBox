const AWS = require('aws-sdk');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });
const ses = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

/**
 * Process incoming emails for AI document ingestion
 * Route: docs-{tenantId}@stackpro.io → tenant S3 bucket
 */
class EmailIntakeService {
  constructor() {
    this.region = process.env.AWS_REGION || 'us-west-2';
    this.baseBucket = process.env.AI_DOCS_BUCKET || 'stackpro-ai-docs';
    this.forwardTo = process.env.AI_DOCS_FORWARD_EMAIL || 'nsflournoy@gmail.com';
  }

  /**
   * Extract tenant ID from email address
   * docs-tenant123@stackpro.io → tenant123
   */
  extractTenantId(emailAddress) {
    const match = emailAddress.match(/^docs-([^@]+)@stackpro\.io$/);
    return match ? match[1] : null;
  }

  /**
   * Process attachments and store in S3
   */
  async processAttachments(tenantId, messageId, attachments = []) {
    const storedFiles = [];
    
    for (const attachment of attachments) {
      try {
        const key = `tenants/${tenantId}/docs/email-ingest/${messageId}/${attachment.filename}`;
        
        const putCommand = new PutObjectCommand({
          Bucket: this.baseBucket,
          Key: key,
          Body: attachment.content,
          ContentType: attachment.contentType || 'application/octet-stream',
          Metadata: {
            source: 'email',
            tenantId: tenantId,
            messageId: messageId,
            originalFilename: attachment.filename,
            uploadedAt: new Date().toISOString()
          },
          ServerSideEncryption: 'aws:kms'
        });

        await s3.send(putCommand);
        
        storedFiles.push({
          filename: attachment.filename,
          s3Key: key,
          size: attachment.size,
          contentType: attachment.contentType
        });

        console.log(`✅ Stored attachment: ${attachment.filename} for tenant ${tenantId}`);
      } catch (error) {
        console.error(`❌ Failed to store attachment ${attachment.filename}:`, error);
      }
    }

    return storedFiles;
  }

  /**
   * Forward email to designated recipients
   */
  async forwardEmail(tenantId, originalEmail, storedFiles = []) {
    try {
      const subject = `📄 [AI Docs] ${originalEmail.subject || 'Document Upload'}`;
      
      let body = `🤖 AI DOCUMENT INGESTION - TENANT: ${tenantId}\n\n`;
      body += `📧 From: ${originalEmail.from || 'Unknown'}\n`;
      body += `📅 Date: ${originalEmail.date || new Date().toISOString()}\n`;
      body += `📝 Subject: ${originalEmail.subject || 'No Subject'}\n\n`;
      
      if (storedFiles.length > 0) {
        body += `📎 PROCESSED ATTACHMENTS (${storedFiles.length}):\n`;
        storedFiles.forEach(file => {
          body += `  • ${file.filename} (${file.contentType})\n`;
        });
        body += `\n`;
      }
      
      body += `--- ORIGINAL MESSAGE ---\n`;
      body += originalEmail.body || 'No content';
      body += `\n--- END ORIGINAL MESSAGE ---\n\n`;
      body += `This email was processed by StackPro AI Document Ingestion System.`;

      const command = new SendEmailCommand({
        Source: `ai-docs@stackpro.io`,
        Destination: {
          ToAddresses: [this.forwardTo]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Text: {
              Data: body,
              Charset: 'UTF-8'
            }
          }
        }
      });

      await ses.send(command);
      console.log(`✅ Forwarded AI docs email for tenant ${tenantId}`);
    } catch (error) {
      console.error(`❌ Failed to forward email for tenant ${tenantId}:`, error);
    }
  }

  /**
   * Main processing function for SES Lambda
   */
  async processEmailEvent(sesEvent) {
    console.log('📧 Processing AI docs email event:', JSON.stringify(sesEvent, null, 2));
    
    try {
      const mail = sesEvent.mail;
      const recipients = mail.commonHeaders.to || [];
      
      for (const recipient of recipients) {
        const tenantId = this.extractTenantId(recipient);
        
        if (!tenantId) {
          console.log(`⚠️ Skipping non-tenant email: ${recipient}`);
          continue;
        }

        console.log(`🎯 Processing for tenant: ${tenantId}`);

        // Extract email content and attachments
        const emailData = {
          messageId: mail.messageId,
          from: mail.commonHeaders.from?.[0] || 'Unknown',
          to: recipient,
          subject: mail.commonHeaders.subject || 'No Subject',
          date: mail.commonHeaders.date || new Date().toISOString(),
          body: 'Email content processing not implemented in this demo'
        };

        // In a real implementation, you'd parse the email from S3
        // For now, we'll simulate with empty attachments
        const storedFiles = await this.processAttachments(tenantId, mail.messageId, []);
        
        // Forward to designated recipients
        await this.forwardEmail(tenantId, emailData, storedFiles);

        // Store email metadata for AI processing
        await this.storeEmailMetadata(tenantId, emailData, storedFiles);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Email processed successfully' })
      };
    } catch (error) {
      console.error('❌ Error processing email:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  /**
   * Store email metadata for AI gap analysis
   */
  async storeEmailMetadata(tenantId, emailData, storedFiles) {
    try {
      const metadata = {
        tenantId,
        messageId: emailData.messageId,
        timestamp: new Date().toISOString(),
        from: emailData.from,
        subject: emailData.subject,
        attachmentCount: storedFiles.length,
        files: storedFiles,
        source: 'email-intake',
        processed: false
      };

      const key = `tenants/${tenantId}/metadata/email-intake/${emailData.messageId}.json`;
      
      const putCommand = new PutObjectCommand({
        Bucket: this.baseBucket,
        Key: key,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
        Metadata: {
          tenantId: tenantId,
          source: 'email-metadata',
          createdAt: new Date().toISOString()
        },
        ServerSideEncryption: 'aws:kms'
      });

      await s3.send(putCommand);
      console.log(`✅ Stored email metadata for tenant ${tenantId}`);
    } catch (error) {
      console.error(`❌ Failed to store email metadata:`, error);
    }
  }
}

module.exports = { EmailIntakeService };
