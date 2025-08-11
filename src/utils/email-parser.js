const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { simpleParser } = require('mailparser');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });
const ses = new SESClient({ region: process.env.AWS_REGION || 'us-west-2' });

/**
 * Clean Email Forwarding Service
 * Parses emails and forwards them in a readable, professional format
 */
class EmailForwardingService {
  constructor() {
    this.region = process.env.AWS_REGION || 'us-west-2';
    this.emailBucket = process.env.SES_EMAIL_BUCKET || 'stackpro-emails';
  }

  /**
   * Parse raw email from S3 and extract readable content
   */
  async parseEmailFromS3(bucketName, objectKey) {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
      });

      const response = await s3.send(getCommand);
      const emailContent = await this.streamToString(response.Body);
      
      // Use mailparser to parse the email
      const parsed = await simpleParser(emailContent);
      
      return {
        messageId: parsed.messageId,
        from: this.formatAddress(parsed.from),
        to: this.formatAddresses(parsed.to),
        cc: this.formatAddresses(parsed.cc),
        bcc: this.formatAddresses(parsed.bcc),
        subject: parsed.subject || 'No Subject',
        date: parsed.date || new Date(),
        text: parsed.text || '',
        html: parsed.html || '',
        attachments: this.formatAttachments(parsed.attachments || []),
        headers: this.extractImportantHeaders(parsed.headers)
      };
    } catch (error) {
      console.error('❌ Failed to parse email from S3:', error);
      throw error;
    }
  }

  /**
   * Convert readable stream to string
   */
  async streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }

  /**
   * Format email addresses for display
   */
  formatAddress(address) {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (address.name && address.address) {
      return `${address.name} <${address.address}>`;
    }
    return address.address || address.toString();
  }

  formatAddresses(addresses) {
    if (!addresses) return '';
    if (Array.isArray(addresses)) {
      return addresses.map(addr => this.formatAddress(addr)).join(', ');
    }
    return this.formatAddress(addresses);
  }

  /**
   * Format attachments for display
   */
  formatAttachments(attachments) {
    return attachments.map(att => ({
      filename: att.filename || 'unnamed-attachment',
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || 0,
      contentId: att.contentId,
      content: att.content // Keep for processing if needed
    }));
  }

  /**
   * Extract only important headers for display
   */
  extractImportantHeaders(headers) {
    const important = {};
    const importantKeys = [
      'return-path',
      'reply-to',
      'organization',
      'x-priority',
      'x-mailer',
      'user-agent'
    ];

    if (headers) {
      importantKeys.forEach(key => {
        if (headers.has && headers.has(key)) {
          important[key] = headers.get(key);
        } else if (headers[key]) {
          important[key] = headers[key];
        }
      });
    }

    return important;
  }

  /**
   * Create clean, readable email content
   */
  createCleanEmailContent(parsedEmail, recipientContext = '') {
    const fromDisplay = parsedEmail.from || 'Unknown Sender';
    const dateDisplay = parsedEmail.date ? parsedEmail.date.toLocaleString() : 'Unknown Date';
    
    let content = '';
    
    // Header section
    content += `📧 EMAIL FORWARDED VIA STACKPRO\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    if (recipientContext) {
      content += `📬 Delivered to: ${recipientContext}\n`;
    }
    
    content += `👤 From: ${fromDisplay}\n`;
    content += `📧 To: ${parsedEmail.to}\n`;
    
    if (parsedEmail.cc) {
      content += `📋 CC: ${parsedEmail.cc}\n`;
    }
    
    content += `📅 Date: ${dateDisplay}\n`;
    content += `📝 Subject: ${parsedEmail.subject}\n`;
    
    // Important headers
    if (Object.keys(parsedEmail.headers).length > 0) {
      content += `\n📋 Additional Headers:\n`;
      Object.entries(parsedEmail.headers).forEach(([key, value]) => {
        content += `   ${key}: ${value}\n`;
      });
    }
    
    // Attachments
    if (parsedEmail.attachments.length > 0) {
      content += `\n📎 Attachments (${parsedEmail.attachments.length}):\n`;
      parsedEmail.attachments.forEach(att => {
        const sizeDisplay = att.size ? ` (${this.formatFileSize(att.size)})` : '';
        content += `   • ${att.filename}${sizeDisplay} - ${att.contentType}\n`;
      });
    }
    
    content += `\n${'='.repeat(50)}\n`;
    content += `MESSAGE CONTENT\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    // Email body - prefer text over HTML for forwarding
    if (parsedEmail.text) {
      content += parsedEmail.text;
    } else if (parsedEmail.html) {
      // Basic HTML to text conversion
      const textFromHtml = parsedEmail.html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      
      content += textFromHtml;
      content += `\n\n[Note: This message was converted from HTML format]`;
    } else {
      content += '[No readable content found in this email]';
    }
    
    content += `\n\n${'='.repeat(50)}\n`;
    content += `This email was processed and forwarded by StackPro Email System\n`;
    content += `Processed at: ${new Date().toLocaleString()}\n`;
    
    return content;
  }

  /**
   * Format file sizes for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Forward parsed email with clean formatting
   */
  async forwardCleanEmail(parsedEmail, forwardToEmail, originalRecipient = '') {
    try {
      const cleanContent = this.createCleanEmailContent(parsedEmail, originalRecipient);
      
      // Create subject with forwarding indicator
      const subject = `[Forwarded] ${parsedEmail.subject}`;
      
      const command = new SendEmailCommand({
        Source: 'admin@stackpro.io',
        Destination: {
          ToAddresses: [forwardToEmail]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Text: {
              Data: cleanContent,
              Charset: 'UTF-8'
            }
          }
        },
        ReplyToAddresses: [parsedEmail.from || 'noreply@stackpro.io']
      });

      await ses.send(command);
      
      console.log(`✅ Clean email forwarded: ${parsedEmail.subject} → ${forwardToEmail}`);
      
      return {
        success: true,
        messageId: parsedEmail.messageId,
        forwardedTo: forwardToEmail,
        subject: parsedEmail.subject
      };
    } catch (error) {
      console.error('❌ Failed to forward clean email:', error);
      throw error;
    }
  }

  /**
   * Process SES email receipt event
   */
  async processSESEmailReceipt(sesEvent) {
    console.log('📧 Processing clean email forwarding:', JSON.stringify(sesEvent, null, 2));
    
    try {
      const mail = sesEvent.mail;
      const receipt = sesEvent.receipt;
      
      // Get email from S3 if stored there
      if (receipt.action && receipt.action.type === 'S3' && receipt.action.bucketName) {
        const bucketName = receipt.action.bucketName;
        const objectKey = receipt.action.objectKey;
        
        // Parse the email
        const parsedEmail = await this.parseEmailFromS3(bucketName, objectKey);
        
        // Determine forwarding rules based on recipient
        const recipients = mail.commonHeaders.to || [];
        const forwardingRules = this.getForwardingRules();
        
        for (const recipient of recipients) {
          const forwardTo = forwardingRules[recipient.toLowerCase()];
          if (forwardTo) {
            await this.forwardCleanEmail(parsedEmail, forwardTo, recipient);
          }
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            message: 'Email processed and forwarded successfully',
            recipients: recipients.length
          })
        };
      } else {
        // Fallback: create basic forward from SES event data
        const basicEmail = {
          messageId: mail.messageId,
          from: mail.commonHeaders.from?.[0] || 'Unknown',
          to: (mail.commonHeaders.to || []).join(', '),
          subject: mail.commonHeaders.subject || 'No Subject',
          date: new Date(mail.commonHeaders.date || Date.now()),
          text: '[Email content not available - stored forwarding setup needed]',
          html: '',
          attachments: [],
          headers: {}
        };
        
        const recipients = mail.commonHeaders.to || [];
        const forwardingRules = this.getForwardingRules();
        
        for (const recipient of recipients) {
          const forwardTo = forwardingRules[recipient.toLowerCase()];
          if (forwardTo) {
            await this.forwardCleanEmail(basicEmail, forwardTo, recipient);
          }
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            message: 'Basic email forwarding completed',
            note: 'Full content parsing requires S3 storage setup'
          })
        };
      }
    } catch (error) {
      console.error('❌ Error processing email receipt:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  /**
   * Get email forwarding rules
   * In production, this would come from a database
   */
  getForwardingRules() {
    return {
      'admin@stackpro.io': process.env.ADMIN_FORWARD_EMAIL || 'nsflournoy@gmail.com',
      'info@stackpro.io': process.env.INFO_FORWARD_EMAIL || 'nsflournoy@gmail.com',
      'support@stackpro.io': process.env.SUPPORT_FORWARD_EMAIL || 'nsflournoy@gmail.com',
      'docs@stackpro.io': process.env.DOCS_FORWARD_EMAIL || 'nsflournoy@gmail.com'
    };
  }
}

module.exports = { EmailForwardingService };
