const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SQSClient } = require('@aws-sdk/client-sqs');
const { SESClient } = require('@aws-sdk/client-ses');
const { logger } = require('../logger');

class MessagingService {
  constructor() {
    const region = process.env.AWS_REGION || 'us-west-2';
    
    // Initialize AWS SDK v3 clients
    const dynamoDbClient = new DynamoDBClient({ region });
    this.dynamodb = DynamoDBDocumentClient.from(dynamoDbClient);
    this.sns = new SNSClient({ region });
    this.sqs = new SQSClient({ region });
    this.ses = new SESClient({ region });
    
    // Table names
    this.connectionsTable = 'StackPro-Connections';
    this.messagesTable = 'StackPro-Messages';
    this.channelsTable = 'StackPro-Channels';
    this.presenceTable = 'StackPro-Presence';
    this.notificationsTable = 'StackPro-Notifications';
  }

  /**
   * Create a new channel
   */
  async createChannel(clientId, userId, channelData) {
    const channelId = this.generateChannelId(clientId);
    const timestamp = new Date().toISOString();

    const channel = {
      channelId,
      clientId,
      name: channelData.name,
      description: channelData.description || '',
      channelType: channelData.type || 'public', // public, private, dm, document
      createdBy: userId,
      createdAt: timestamp,
      members: channelData.members || [userId],
      settings: {
        allowFiles: channelData.allowFiles !== false,
        allowReactions: channelData.allowReactions !== false,
        allowThreads: channelData.allowThreads !== false,
        ...channelData.settings
      },
      documentId: channelData.documentId || null, // For document-specific channels
      isActive: true
    };

    try {
      const command = new PutCommand({
        TableName: this.channelsTable,
        Item: channel,
        ConditionExpression: 'attribute_not_exists(channelId)'
      });
      await this.dynamodb.send(command);

      logger.info('Channel created successfully', {
        channelId,
        clientId,
        createdBy: userId,
        channelType: channel.channelType
      });

      return channel;

    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Channel already exists');
      }
      throw new Error(`Failed to create channel: ${error.message}`);
    }
  }

  /**
   * Get client channels
   */
  async getClientChannels(clientId, userId) {
    try {
      const command = new QueryCommand({
        TableName: this.channelsTable,
        IndexName: 'ClientIndex',
        KeyConditionExpression: 'clientId = :clientId',
        FilterExpression: 'contains(members, :userId) AND isActive = :active',
        ExpressionAttributeValues: {
          ':clientId': clientId,
          ':userId': userId,
          ':active': true
        }
      });
      const result = await this.dynamodb.send(command);

      // Get unread counts for each channel
      const channelsWithCounts = await Promise.all(
        (result.Items || []).map(async (channel) => {
          const unreadCount = await this.getUnreadMessageCount(channel.channelId, userId);
          return {
            ...channel,
            unreadCount,
            lastActivity: await this.getChannelLastActivity(channel.channelId)
          };
        })
      );

      return channelsWithCounts.sort((a, b) => 
        new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt)
      );

    } catch (error) {
      throw new Error(`Failed to get channels: ${error.message}`);
    }
  }

  /**
   * Add user to channel
   */
  async addUserToChannel(channelId, userId, addedBy) {
    try {
      // Verify channel exists and user has permission to add
      const channel = await this.getChannel(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      if (channel.channelType === 'private' && !channel.members.includes(addedBy)) {
        throw new Error('Permission denied');
      }

      const command = new UpdateCommand({
        TableName: this.channelsTable,
        Key: { channelId },
        UpdateExpression: 'ADD members :userSet',
        ConditionExpression: 'attribute_exists(channelId)',
        ExpressionAttributeValues: {
          ':userSet': new Set([userId])
        }
      });
      await this.dynamodb.send(command);

      // Create system message
      await this.createSystemMessage(channelId, channel.clientId, `${userId} joined the channel`);

      logger.info('User added to channel', {
        channelId,
        userId,
        addedBy
      });

      return true;

    } catch (error) {
      throw new Error(`Failed to add user to channel: ${error.message}`);
    }
  }

  /**
   * Send message to channel
   */
  async sendMessage(channelId, userId, clientId, messageData) {
    const messageId = this.generateMessageId();
    const timestamp = new Date().toISOString();

    const message = {
      messageId,
      channelId,
      clientId,
      userId,
      content: messageData.content,
      messageType: messageData.type || 'text',
      timestamp,
      threadId: messageData.threadId || null,
      attachments: messageData.attachments || [],
      reactions: {},
      mentions: this.extractMentions(messageData.content),
      edited: false,
      deleted: false
    };

    try {
      // Verify user has access to channel
      const channel = await this.getChannel(channelId);
      if (!channel || !channel.members.includes(userId)) {
        throw new Error('Access denied to channel');
      }

      // Store message
      const command = new PutCommand({
        TableName: this.messagesTable,
        Item: message
      });
      await this.dynamodb.send(command);

      // Send notifications for mentions
      if (message.mentions.length > 0) {
        await this.sendMentionNotifications(message);
      }

      // Update channel activity
      await this.updateChannelActivity(channelId, timestamp);

      logger.info('Message sent successfully', {
        messageId,
        channelId,
        userId,
        clientId,
        messageType: message.messageType
      });

      return message;

    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get channel messages with pagination
   */
  async getChannelMessages(channelId, userId, limit = 50, lastKey = null) {
    try {
      // Verify user has access
      const channel = await this.getChannel(channelId);
      if (!channel || !channel.members.includes(userId)) {
        throw new Error('Access denied to channel');
      }

      const params = {
        TableName: this.messagesTable,
        KeyConditionExpression: 'channelId = :channelId',
        ExpressionAttributeValues: {
          ':channelId': channelId
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit
      };

      if (lastKey) {
        params.ExclusiveStartKey = lastKey;
      }

      const command = new QueryCommand(params);
      const result = await this.dynamodb.send(command);

      return {
        messages: (result.Items || []).reverse(), // Return chronologically
        lastKey: result.LastEvaluatedKey,
        hasMore: !!result.LastEvaluatedKey
      };

    } catch (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  /**
   * Update user presence
   */
  async updateUserPresence(userId, clientId, status, connectionId = null) {
    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

    const presence = {
      userId,
      clientId,
      status,
      lastSeen: timestamp,
      connectionId,
      ttl
    };

    try {
      const command = new PutCommand({
        TableName: this.presenceTable,
        Item: presence
      });
      await this.dynamodb.send(command);

      logger.info('User presence updated', {
        userId,
        clientId,
        status
      });

      return presence;

    } catch (error) {
      throw new Error(`Failed to update presence: ${error.message}`);
    }
  }

  /**
   * Get client user presence
   */
  async getClientPresence(clientId) {
    try {
      const command = new QueryCommand({
        TableName: this.presenceTable,
        IndexName: 'ClientIndex',
        KeyConditionExpression: 'clientId = :clientId',
        ExpressionAttributeValues: {
          ':clientId': clientId
        }
      });
      const result = await this.dynamodb.send(command);

      return (result.Items || []).reduce((acc, presence) => {
        acc[presence.userId] = {
          status: presence.status,
          lastSeen: presence.lastSeen
        };
        return acc;
      }, {});

    } catch (error) {
      throw new Error(`Failed to get presence: ${error.message}`);
    }
  }

  /**
   * Create document-specific channel
   */
  async createDocumentChannel(clientId, userId, documentId, documentName) {
    const channelData = {
      name: `📄 ${documentName}`,
      description: `Collaboration channel for ${documentName}`,
      type: 'document',
      documentId,
      members: [userId],
      settings: {
        allowFiles: true,
        allowReactions: true,
        allowThreads: true
      }
    };

    const channel = await this.createChannel(clientId, userId, channelData);

    // Create welcome message
    await this.createSystemMessage(
      channel.channelId, 
      clientId, 
      `Document collaboration channel created for ${documentName}`
    );

    return channel;
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId, channelId, userId, clientId, emoji) {
    try {
      const message = await this.getMessage(channelId, messageId);
      if (!message || message.clientId !== clientId) {
        throw new Error('Message not found or access denied');
      }

      const reactionKey = `reactions.${emoji}`;
      
      const command = new UpdateCommand({
        TableName: this.messagesTable,
        Key: { channelId, messageId },
        UpdateExpression: 'ADD #reactions.#emoji :userSet',
        ExpressionAttributeNames: {
          '#reactions': 'reactions',
          '#emoji': emoji
        },
        ExpressionAttributeValues: {
          ':userSet': new Set([userId])
        }
      });
      await this.dynamodb.send(command);

      logger.info('Reaction added', {
        messageId,
        channelId,
        userId,
        emoji
      });

      return true;

    } catch (error) {
      throw new Error(`Failed to add reaction: ${error.message}`);
    }
  }

  /**
   * Send notification
   */
  async sendNotification(userId, clientId, notification) {
    const notificationId = this.generateNotificationId();
    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

    const notificationRecord = {
      userId,
      notificationId,
      clientId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      status: 'unread',
      timestamp,
      ttl
    };

    try {
      // Store notification
      const command = new PutCommand({
        TableName: this.notificationsTable,
        Item: notificationRecord
      });
      await this.dynamodb.send(command);

      // Send via SNS (email, push, SMS)
      await this.publishNotification(userId, clientId, notification);

      logger.info('Notification sent', {
        notificationId,
        userId,
        clientId,
        type: notification.type
      });

      return notificationRecord;

    } catch (error) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, limit = 50, status = null) {
    try {
      const params = {
        TableName: this.notificationsTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false,
        Limit: limit
      };

      if (status) {
        params.IndexName = 'StatusIndex';
        params.KeyConditionExpression += ' AND #status = :status';
        params.ExpressionAttributeNames = { '#status': 'status' };
        params.ExpressionAttributeValues[':status'] = status;
      }

      const command = new QueryCommand(params);
      const result = await this.dynamodb.send(command);

      return result.Items || [];

    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  // Helper methods

  async getChannel(channelId) {
    const command = new GetCommand({
      TableName: this.channelsTable,
      Key: { channelId }
    });
    const result = await this.dynamodb.send(command);
    return result.Item || null;
  }

  async getMessage(channelId, messageId) {
    const command = new GetCommand({
      TableName: this.messagesTable,
      Key: { channelId, messageId }
    });
    const result = await this.dynamodb.send(command);
    return result.Item || null;
  }

  async getUnreadMessageCount(channelId, userId) {
    // Simplified - in production, you'd track read positions
    return 0;
  }

  async getChannelLastActivity(channelId) {
    const command = new QueryCommand({
      TableName: this.messagesTable,
      KeyConditionExpression: 'channelId = :channelId',
      ExpressionAttributeValues: { ':channelId': channelId },
      ScanIndexForward: false,
      Limit: 1
    });
    const result = await this.dynamodb.send(command);

    return result.Items?.[0]?.timestamp || null;
  }

  async updateChannelActivity(channelId, timestamp) {
    const command = new UpdateCommand({
      TableName: this.channelsTable,
      Key: { channelId },
      UpdateExpression: 'SET lastActivity = :timestamp',
      ExpressionAttributeValues: { ':timestamp': timestamp }
    });
    await this.dynamodb.send(command);
  }

  async createSystemMessage(channelId, clientId, content) {
    const messageId = this.generateMessageId();
    const timestamp = new Date().toISOString();

    const message = {
      messageId,
      channelId,
      clientId,
      userId: 'system',
      content,
      messageType: 'system',
      timestamp,
      reactions: {},
      edited: false,
      deleted: false
    };

    const command = new PutCommand({
      TableName: this.messagesTable,
      Item: message
    });
    await this.dynamodb.send(command);
  }

  extractMentions(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  async sendMentionNotifications(message) {
    for (const mentionedUser of message.mentions) {
      await this.sendNotification(mentionedUser, message.clientId, {
        type: 'mention',
        title: 'You were mentioned',
        body: `${message.userId} mentioned you in a message`,
        data: {
          channelId: message.channelId,
          messageId: message.messageId
        }
      });
    }
  }

  async publishNotification(userId, clientId, notification) {
    const topicArn = `arn:aws:sns:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:stackpro-notifications-${clientId}`;
    
    try {
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify({
          userId,
          clientId,
          ...notification
        }),
        Subject: notification.title
      });
      await this.sns.send(command);
    } catch (error) {
      logger.warn('Failed to publish notification to SNS', {
        userId,
        clientId,
        error: error.message
      });
    }
  }

  generateChannelId(clientId) {
    return `${clientId}-ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateNotificationId() {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = MessagingService;
