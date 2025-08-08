const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-west-2' });

exports.handler = async (event) => {
    console.log('SES event received:', JSON.stringify(event, null, 2));
    
    try {
        // Extract email details from SES event
        const sesRecord = event.Records[0].ses;
        const mail = sesRecord.mail;
        const receipt = sesRecord.receipt;
        
        // Get the message from S3 (SES stores it there)
        const s3 = new AWS.S3();
        const bucketName = 'stackpro-emails-storage';
        const objectKey = `incoming-emails/${mail.messageId}`;
        
        let emailContent = '';
        try {
            const s3Object = await s3.getObject({
                Bucket: bucketName,
                Key: objectKey
            }).promise();
            emailContent = s3Object.Body.toString();
        } catch (s3Error) {
            console.log('Could not fetch from S3, using basic info');
            emailContent = `Email received but content not available in S3.`;
        }
        
        // Parse basic email info
        const subject = mail.commonHeaders.subject || 'No Subject';
        const from = mail.commonHeaders.from ? mail.commonHeaders.from[0] : 'Unknown';
        const to = mail.commonHeaders.to ? mail.commonHeaders.to[0] : 'Unknown';
        const date = mail.commonHeaders.date || new Date().toISOString();
        
        // Create forwarded email
        const forwardedSubject = `[StackPro] ${subject}`;
        const forwardedBody = `🚀 NEW EMAIL RECEIVED AT STACKPRO.IO

📧 To: ${to}
👤 From: ${from}
📅 Date: ${date}
📝 Subject: ${subject}

--- ORIGINAL MESSAGE ---
${emailContent}

--- END ORIGINAL MESSAGE ---

💾 Email automatically stored in S3: ${objectKey}
🔗 View in AWS Console: https://console.aws.amazon.com/s3/
`;

        // Send forwarded email
        const forwardParams = {
            Source: 'admin@stackpro.io',
            Destination: {
                ToAddresses: ['nsflournoy@gmail.com']
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
                                    <p><strong>📧 To:</strong> ${to}</p>
                                    <p><strong>👤 From:</strong> ${from}</p>
                                    <p><strong>📅 Date:</strong> ${date}</p>
                                    <p><strong>📝 Subject:</strong> ${subject}</p>
                                </div>
                                
                                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                                    <h3>Original Message:</h3>
                                    <pre style="white-space: pre-wrap; font-family: inherit;">${emailContent}</pre>
                                </div>
                                
                                <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 8px; font-size: 14px; color: #0369a1;">
                                    💾 Email stored: ${objectKey}<br>
                                    🔗 <a href="https://console.aws.amazon.com/s3/">View in AWS Console</a>
                                </div>
                            </div>
                        `
                    }
                }
            }
        };
        
        await ses.sendEmail(forwardParams).promise();
        console.log(`✅ Email forwarded successfully to nsflournoy@gmail.com`);
        
        return {
            statusCode: 200,
            body: JSON.stringify('Email forwarded successfully')
        };
        
    } catch (error) {
        console.error('❌ Error forwarding email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Error forwarding email')
        };
    }
};
