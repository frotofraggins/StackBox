const { SNSClient, CreateTopicCommand, PublishCommand, SubscribeCommand } = require('@aws-sdk/client-sns');
const { SQSClient, CreateQueueCommand, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { logger } = require('../logger');

class NotificationService {
  constructor() {
    const region = process.env.AWS_REGION || 'us-west-2';
    
    this.sns = new SNSClient({ region });
    this.sqs = new SQSClient({ region });
    this.ses = new SESClient({ region });
    
    const dynamoDbClient = new DynamoDBClient({ region });
    this.dynamodb = DynamoDBDocumentClient.from(dynamoDbClient);
    
    // Service configuration
    this.region = region;
    this.accountId = process.env.AWS_ACCOUNT_ID;
    this.notificationsTable = 'StackPro-Notifications';
  }

  /**
   * Setup notification infrastructure for a client
   */
  async setupClientNotifications(clientId) {
    try {
      logger.info('Setting up notification infrastructure', { clientId });

      // Create SNS topic for client notifications
      const topicResult = await this.createNotificationTopic(clientId);
      
      // Create SQS queue for message processing
      const queueResult = await this.createMessageQueue(clientId);
      
      // Subscribe SQS to SNS for fanout
      await this.subscribeQueueToTopic(topicResult.TopicArn, queueResult.QueueUrl);
      
      // Setup dead letter queue for failed notifications
      const dlqResult = await this.createDeadLetterQueue(clientId);
      
      logger.info('Notification infrastructure setup complete', {
        clientId,
        topicArn: topicResult.TopicArn,
        queueUrl: queueResult.QueueUrl,
        dlqUrl: dlqResult.QueueUrl
      });

      return {
        topicArn: topicResult.TopicArn,
        queueUrl: queueResult.QueueUrl,
        dlqUrl: dlqResult.QueueUrl
      };

    } catch (error) {
      logger.error('Failed to setup notification infrastructure', {
        clientId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send multi-channel notification
   */
  async sendNotification(userId, clientId, notification) {
    try {
      const notificationId = this.generateNotificationId();
      const timestamp = new Date().toISOString();

      // Store notification in database
      await this.storeNotification({
        userId,
        clientId,
        notificationId,
        ...notification,
        timestamp
      });

      // Get user notification preferences
      const preferences = await this.getUserNotificationPreferences(userId, clientId);

      // Send via enabled channels
      const results = await Promise.allSettled([
        // Email notification
        preferences.email && this.sendEmailNotification(userId, clientId, notification),
        
        // Push notification (via SNS)
        preferences.push && this.sendPushNotification(userId, clientId, notification),
        
        // SMS notification
        preferences.sms && this.sendSMSNotification(userId, clientId, notification),
        
        // In-app notification (via WebSocket)
        preferences.inApp && this.sendInAppNotification(userId, clientId, notification)
      ].filter(Boolean));

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info('Multi-channel notification sent', {
        notificationId,
        userId,
        clientId,
        channels: Object.keys(preferences).filter(k => preferences[k]),
        successful,
        failed
      });

      return {
        notificationId,
        successful,
        failed,
        results
      };

    } catch (error) {
      logger.error('Failed to send notification', {
        userId,
        clientId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send email notification via SES
   */
  async sendEmailNotification(userId, clientId, notification) {
    try {
      // Get user email
      const userEmail = await this.getUserEmail(userId, clientId);
      if (!userEmail) {
        throw new Error('User email not found');
      }

      const emailParams = {
        Source: `StackPro <noreply@stackpro.io>`,
        Destination: {
          ToAddresses: [userEmail]
        },
        Message: {
          Subject: {
            Data: notification.title,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: this.generateEmailHTML(notification),
              Charset: 'UTF-8'
            },
            Text: {
              Data: notification.body,
              Charset: 'UTF-8'
            }
          }
        },
        Tags: [
          {
            Name: 'ClientId',
            Value: clientId
          },
          {
            Name: 'NotificationType',
            Value: notification.type
          }
        ]
      };

      const command = new SendEmailCommand(emailParams);
      const result = await this.ses.send(command);
      
      logger.info('Email notification sent', {
        userId,
        clientId,
        messageId: result.MessageId,
        type: notification.type
      });

      return result;

    } catch (error) {
      logger.error('Failed to send email notification', {
        userId,
        clientId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send push notification via SNS
   */
  async sendPushNotification(userId, clientId, notification) {
    try {
      // Get user push endpoint
      const pushEndpoint = await this.getUserPushEndpoint(userId, clientId);
      if (!pushEndpoint) {
        throw new Error('User push endpoint not found');
      }

      const message = {
        default: notification.body,
        GCM: JSON.stringify({
          data: {
            title: notification.title,
            body: notification.body,
            type: notification.type,
            ...notification.data
          }
        }),
        APNS: JSON.stringify({
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            badge: 1,
            sound: 'default'
          },
          type: notification.type,
          ...notification.data
        })
      };

      const params = {
        TargetArn: pushEndpoint,
        Message: JSON.stringify(message),
        MessageStructure: 'json'
      };

      const command = new PublishCommand(params);
      const result = await this.sns.send(command);
      
      logger.info('Push notification sent', {
        userId,
        clientId,
        messageId: result.MessageId,
        type: notification.type
      });

      return result;

    } catch (error) {
      logger.error('Failed to send push notification', {
        userId,
        clientId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send SMS notification via SNS
   */
  async sendSMSNotification(userId, clientId, notification) {
    try {
      // Get user phone number
      const phoneNumber = await this.getUserPhoneNumber(userId, clientId);
      if (!phoneNumber) {
        throw new Error('User phone number not found');
      }

      const message = `${notification.title}\n\n${notification.body}`;

      const params = {
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          },
          'ClientId': {
            DataType: 'String',
            StringValue: clientId
          },
          'NotificationType': {
            DataType: 'String',
            StringValue: notification.type
          }
        }
      };

      const command = new PublishCommand(params);
      const result = await this.sns.send(command);
      
      logger.info('SMS notification sent', {
        userId,
        clientId,
        messageId: result.MessageId,
        type: notification.type
      });

      return result;

    } catch (error) {
      logger.error('Failed to send SMS notification', {
        userId,
        clientId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send in-app notification via WebSocket
   */
  async sendInAppNotification(userId, clientId, notification) {
    try {
      // This would integrate with the WebSocket handler
      // For now, we'll publish to the client's notification topic
      const topicArn = `arn:aws:sns:${this.region}:${this.accountId}:stackpro-notifications-${clientId}`;

      const message = {
        type: 'in-app-notification',
        userId,
        notification
      };

      const params = {
        TopicArn: topicArn,
        Message: JSON.stringify(message),
        Subject: 'In-App Notification',
        MessageAttributes: {
          'NotificationType': {
            DataType: 'String',
            StringValue: 'in-app'
          },
          'TargetUserId': {
            DataType: 'String',
            StringValue: userId
          }
        }
      };

      const command = new PublishCommand(params);
      const result = await this.sns.send(command);
      
      logger.info('In-app notification sent', {
        userId,
        clientId,
        messageId: result.MessageId,
        type: notification.type
      });

      return result;

    } catch (error) {
      logger.error('Failed to send in-app notification', {
        userId,
        clientId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process notification queue messages
   */
  async processNotificationQueue(queueUrl) {
    try {
      const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        MessageAttributeNames: ['All']
      };

      const receiveCommand = new ReceiveMessageCommand(params);
      const result = await this.sqs.send(receiveCommand);
      const messages = result.Messages || [];

      logger.info('Processing notification queue', {
        queueUrl,
        messageCount: messages.length
      });

      for (const message of messages) {
        try {
          await this.processNotificationMessage(message);
          
          // Delete processed message
          const deleteCommand = new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle
          });
          await this.sqs.send(deleteCommand);

        } catch (error) {
          logger.error('Failed to process notification message', {
            messageId: message.MessageId,
            error: error.message
          });
        }
      }

      return messages.length;

    } catch (error) {
      logger.error('Failed to process notification queue', {
        queueUrl,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId, clientId) {
    try {
      // Default preferences - in production, this would come from database
      return {
        email: true,
        push: true,
        sms: false,
        inApp: true
      };
    } catch (error) {
      // Return defaults if can't get preferences
      return {
        email: true,
        push: false,
        sms: false,
        inApp: true
      };
    }
  }

  // Helper methods

  async createNotificationTopic(clientId) {
    const topicName = `stackpro-notifications-${clientId}`;
    
    const params = {
      Name: topicName,
      Tags: [
        {
          Key: 'ClientId',
          Value: clientId
        },
        {
          Key: 'Service',
          Value: 'StackPro-Messaging'
        }
      ]
    };

    const command = new CreateTopicCommand(params);
    return await this.sns.send(command);
  }

  async createMessageQueue(clientId) {
    const queueName = `stackpro-messaging-${clientId}`;
    
    const params = {
      QueueName: queueName,
      Attributes: {
        'MessageRetentionPeriod': '1209600', // 14 days
        'VisibilityTimeoutSeconds': '60',
        'MaxReceiveCount': '3'
      },
      tags: {
        'ClientId': clientId,
        'Service': 'StackPro-Messaging'
      }
    };

    const command = new CreateQueueCommand(params);
    return await this.sqs.send(command);
  }

  async createDeadLetterQueue(clientId) {
    const queueName = `stackpro-messaging-dlq-${clientId}`;
    
    const params = {
      QueueName: queueName,
      Attributes: {
        'MessageRetentionPeriod': '1209600' // 14 days
      },
      tags: {
        'ClientId': clientId,
        'Service': 'StackPro-Messaging',
        'Type': 'DeadLetter'
      }
    };

    const command = new CreateQueueCommand(params);
    return await this.sqs.send(command);
  }

  async subscribeQueueToTopic(topicArn, queueUrl) {
    const params = {
      Protocol: 'sqs',
      TopicArn: topicArn,
      Endpoint: queueUrl
    };

    const command = new SubscribeCommand(params);
    return await this.sns.send(command);
  }

  async storeNotification(notification) {
    const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

    const item = {
      ...notification,
      status: 'sent',
      ttl
    };

    const command = new PutCommand({
      TableName: this.notificationsTable,
      Item: item
    });
    await this.dynamodb.send(command);
  }

  async getUserEmail(userId, clientId) {
    // In production, this would query the user database
    // For now, return a placeholder
    return `${userId}@demo.com`;
  }

  async getUserPushEndpoint(userId, clientId) {
    // In production, this would query stored push endpoints
    return null;
  }

  async getUserPhoneNumber(userId, clientId) {
    // In production, this would query the user database
    return null;
  }

  generateEmailHTML(notification) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>StackPro</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.body}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from StackPro. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async processNotificationMessage(message) {
    const body = JSON.parse(message.Body);
    
    // Handle different message types
    switch (body.type) {
      case 'in-app-notification':
        // Forward to WebSocket connections
        await this.forwardToWebSocket(body);
        break;
      
      case 'email-notification':
        // Handle email-specific processing
        await this.processEmailNotification(body);
        break;
      
      default:
        logger.warn('Unknown notification message type', {
          type: body.type,
          messageId: message.MessageId
        });
    }
  }

  async forwardToWebSocket(message) {
    // This would integrate with the WebSocket handler to send real-time notifications
    logger.info('Forwarding to WebSocket', {
      userId: message.userId,
      type: message.notification.type
    });
  }

  async processEmailNotification(message) {
    // Handle email-specific processing
    logger.info('Processing email notification', {
      userId: message.userId,
      type: message.notification.type
    });
  }

  generateNotificationId() {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = NotificationService;
