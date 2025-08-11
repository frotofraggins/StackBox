const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { logger } = require('../logger');

// Initialize AWS services
const region = process.env.AWS_REGION || 'us-west-2';
const dynamoDbClient = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(dynamoDbClient);

const apigateway = new ApiGatewayManagementApiClient({
  region,
  endpoint: process.env.WEBSOCKET_API_ENDPOINT
});

class WebSocketHandler {
  constructor() {
    this.connectionsTable = 'StackPro-Connections';
    this.messagesTable = 'StackPro-Messages';
    this.channelsTable = 'StackPro-Channels';
    this.presenceTable = 'StackPro-Presence';
  }

  /**
   * Handle WebSocket connection
   */
  async handleConnect(event) {
    const { connectionId } = event.requestContext;
    const { userId, clientId } = this.extractUserInfo(event);

    logger.info('WebSocket connection request', {
      connectionId,
      userId,
      clientId
    });

    try {
      // Store connection information
      await this.storeConnection(connectionId, userId, clientId);

      // Update user presence
      await this.updatePresence(userId, clientId, 'online', connectionId);

      // Broadcast presence update to client users
      await this.broadcastPresenceUpdate(clientId, userId, 'online');

      logger.info('WebSocket connection established', {
        connectionId,
        userId,
        clientId
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Connected successfully' })
      };

    } catch (error) {
      logger.error('WebSocket connection failed', {
        connectionId,
        userId,
        clientId,
        error: error.message
      });

      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Connection failed',
          message: error.message 
        })
      };
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnect(event) {
    const { connectionId } = event.requestContext;

    logger.info('WebSocket disconnection request', { connectionId });

    try {
      // Get connection info before deletion
      const connection = await this.getConnection(connectionId);
      
      if (connection) {
        const { userId, clientId } = connection;

        // Remove connection
        await this.removeConnection(connectionId);

        // Check if user has other active connections
        const activeConnections = await this.getUserConnections(userId);
        const status = activeConnections.length > 0 ? 'online' : 'offline';

        // Update presence
        await this.updatePresence(userId, clientId, status);

        // Broadcast presence update if user went offline
        if (status === 'offline') {
          await this.broadcastPresenceUpdate(clientId, userId, 'offline');
        }

        logger.info('WebSocket disconnection processed', {
          connectionId,
          userId,
          clientId,
          status
        });
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Disconnected successfully' })
      };

    } catch (error) {
      logger.error('WebSocket disconnection failed', {
        connectionId,
        error: error.message
      });

      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Disconnection failed',
          message: error.message 
        })
      };
    }
  }

  /**
   * Handle WebSocket messages
   */
  async handleMessage(event) {
    const { connectionId } = event.requestContext;
    const body = JSON.parse(event.body || '{}');

    logger.info('WebSocket message received', {
      connectionId,
      action: body.action,
      messageType: body.type
    });

    try {
      // Get connection info
      const connection = await this.getConnection(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      const { userId, clientId } = connection;

      // Route message based on action
      switch (body.action) {
        case 'sendMessage':
          return await this.handleSendMessage(body, userId, clientId, connectionId);
        
        case 'joinChannel':
          return await this.handleJoinChannel(body, userId, clientId, connectionId);
        
        case 'leaveChannel':
          return await this.handleLeaveChannel(body, userId, clientId, connectionId);
        
        case 'typing':
          return await this.handleTyping(body, userId, clientId, connectionId);
        
        case 'markAsRead':
          return await this.handleMarkAsRead(body, userId, clientId, connectionId);
        
        case 'getMessages':
          return await this.handleGetMessages(body, userId, clientId, connectionId);
        
        case 'heartbeat':
          return await this.handleHeartbeat(userId, clientId, connectionId);
        
        default:
          throw new Error(`Unknown action: ${body.action}`);
      }

    } catch (error) {
      logger.error('WebSocket message handling failed', {
        connectionId,
        action: body.action,
        error: error.message
      });

      // Send error back to client
      await this.sendToConnection(connectionId, {
        type: 'error',
        error: error.message,
        originalAction: body.action
      });

      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Message handling failed',
          message: error.message 
        })
      };
    }
  }

  /**
   * Handle sending a message
   */
  async handleSendMessage(body, userId, clientId, connectionId) {
    const { channelId, content, messageType = 'text', threadId, attachments } = body;

    // Validate input
    if (!channelId || !content) {
      throw new Error('channelId and content are required');
    }

    // Generate message ID
    const messageId = this.generateMessageId();
    const timestamp = new Date().toISOString();

    // Create message object
    const message = {
      messageId,
      channelId,
      clientId,
      userId,
      content,
      messageType,
      timestamp,
      threadId: threadId || null,
      attachments: attachments || [],
      reactions: {},
      edited: false,
      deleted: false
    };

    // Store message in DynamoDB
    const putCommand = new PutCommand({
      TableName: this.messagesTable,
      Item: message
    });
    await dynamodb.send(putCommand);

    // Broadcast message to channel subscribers
    await this.broadcastToChannel(channelId, {
      type: 'message',
      message
    });

    // Send confirmation back to sender
    await this.sendToConnection(connectionId, {
      type: 'messageConfirmation',
      messageId,
      timestamp
    });

    logger.info('Message sent successfully', {
      messageId,
      channelId,
      userId,
      clientId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        messageId,
        timestamp 
      })
    };
  }

  /**
   * Handle joining a channel
   */
  async handleJoinChannel(body, userId, clientId, connectionId) {
    const { channelId } = body;

    if (!channelId) {
      throw new Error('channelId is required');
    }

    // Verify channel exists and user has access
    const channel = await this.getChannel(channelId);
    if (!channel || channel.clientId !== clientId) {
      throw new Error('Channel not found or access denied');
    }

    // Add user to channel subscribers (stored in connection record)
    await this.addChannelSubscription(connectionId, channelId);

    // Send channel info and recent messages
    const recentMessages = await this.getRecentMessages(channelId, 50);
    
    await this.sendToConnection(connectionId, {
      type: 'channelJoined',
      channelId,
      channel,
      messages: recentMessages
    });

    logger.info('User joined channel', {
      userId,
      clientId,
      channelId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        channelId 
      })
    };
  }

  /**
   * Handle typing indicators
   */
  async handleTyping(body, userId, clientId, connectionId) {
    const { channelId, isTyping } = body;

    if (!channelId) {
      throw new Error('channelId is required');
    }

    // Broadcast typing indicator to channel (except sender)
    await this.broadcastToChannel(channelId, {
      type: 'typing',
      channelId,
      userId,
      isTyping: Boolean(isTyping)
    }, connectionId); // Exclude sender

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }

  /**
   * Handle heartbeat to maintain connection
   */
  async handleHeartbeat(userId, clientId, connectionId) {
    // Update last seen timestamp
    await this.updatePresence(userId, clientId, 'online', connectionId);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Store WebSocket connection
   */
  async storeConnection(connectionId, userId, clientId) {
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    await dynamodb.put({
      TableName: this.connectionsTable,
      Item: {
        connectionId,
        userId,
        clientId,
        connectedAt: new Date().toISOString(),
        channels: [], // Subscribed channels
        ttl
      }
    }).promise();
  }

  /**
   * Get connection information
   */
  async getConnection(connectionId) {
    const result = await dynamodb.get({
      TableName: this.connectionsTable,
      Key: { connectionId }
    }).promise();

    return result.Item || null;
  }

  /**
   * Remove connection
   */
  async removeConnection(connectionId) {
    await dynamodb.delete({
      TableName: this.connectionsTable,
      Key: { connectionId }
    }).promise();
  }

  /**
   * Get user's active connections
   */
  async getUserConnections(userId) {
    const result = await dynamodb.query({
      TableName: this.connectionsTable,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();

    return result.Items || [];
  }

  /**
   * Update user presence
   */
  async updatePresence(userId, clientId, status, connectionId = null) {
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

    const item = {
      userId,
      clientId,
      status,
      lastSeen: now,
      connectionId,
      ttl
    };

    // Add additional status info based on status
    if (status === 'online') {
      item.connectedAt = now;
    }

    await dynamodb.put({
      TableName: this.presenceTable,
      Item: item
    }).promise();
  }

  /**
   * Broadcast presence update to client users
   */
  async broadcastPresenceUpdate(clientId, userId, status) {
    // Get all connections for the client
    const connections = await this.getClientConnections(clientId);

    const presenceUpdate = {
      type: 'presenceUpdate',
      userId,
      status,
      timestamp: new Date().toISOString()
    };

    // Send to all client connections
    await Promise.all(
      connections.map(conn => 
        this.sendToConnection(conn.connectionId, presenceUpdate)
          .catch(error => 
            logger.warn('Failed to send presence update', {
              connectionId: conn.connectionId,
              error: error.message
            })
          )
      )
    );
  }

  /**
   * Broadcast message to channel subscribers
   */
  async broadcastToChannel(channelId, message, excludeConnectionId = null) {
    // Get all connections subscribed to this channel
    const connections = await this.getChannelConnections(channelId);

    await Promise.all(
      connections
        .filter(conn => conn.connectionId !== excludeConnectionId)
        .map(conn => 
          this.sendToConnection(conn.connectionId, message)
            .catch(error => {
              logger.warn('Failed to broadcast to connection', {
                connectionId: conn.connectionId,
                channelId,
                error: error.message
              });
              // Clean up dead connections
              return this.removeConnection(conn.connectionId);
            })
        )
    );
  }

  /**
   * Get connections for a channel
   */
  async getChannelConnections(channelId) {
    // This is a simplified version - in production, you'd maintain 
    // channel subscription mappings more efficiently
    const result = await dynamodb.scan({
      TableName: this.connectionsTable,
      FilterExpression: 'contains(channels, :channelId)',
      ExpressionAttributeValues: {
        ':channelId': channelId
      }
    }).promise();

    return result.Items || [];
  }

  /**
   * Get all connections for a client
   */
  async getClientConnections(clientId) {
    const result = await dynamodb.query({
      TableName: this.connectionsTable,
      IndexName: 'ClientIndex',
      KeyConditionExpression: 'clientId = :clientId',
      ExpressionAttributeValues: {
        ':clientId': clientId
      }
    }).promise();

    return result.Items || [];
  }

  /**
   * Send message to specific connection
   */
  async sendToConnection(connectionId, message) {
    try {
      await apigateway.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(message)
      }).promise();

    } catch (error) {
      if (error.statusCode === 410) {
        // Connection is gone, remove it
        await this.removeConnection(connectionId);
      }
      throw error;
    }
  }

  /**
   * Add channel subscription to connection
   */
  async addChannelSubscription(connectionId, channelId) {
    await dynamodb.update({
      TableName: this.connectionsTable,
      Key: { connectionId },
      UpdateExpression: 'ADD channels :channelSet',
      ExpressionAttributeValues: {
        ':channelSet': dynamodb.createSet([channelId])
      }
    }).promise();
  }

  /**
   * Get channel information
   */
  async getChannel(channelId) {
    const result = await dynamodb.get({
      TableName: this.channelsTable,
      Key: { channelId }
    }).promise();

    return result.Item || null;
  }

  /**
   * Get recent messages for a channel
   */
  async getRecentMessages(channelId, limit = 50) {
    const result = await dynamodb.query({
      TableName: this.messagesTable,
      KeyConditionExpression: 'channelId = :channelId',
      ExpressionAttributeValues: {
        ':channelId': channelId
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit
    }).promise();

    return (result.Items || []).reverse(); // Return in chronological order
  }

  /**
   * Extract user info from WebSocket event
   */
  extractUserInfo(event) {
    // Extract from query string parameters or authorization header
    const queryParams = event.queryStringParameters || {};
    const headers = event.headers || {};

    // In production, you'd validate JWT token here
    const token = queryParams.token || headers.Authorization;
    
    // For now, extract from query params (replace with JWT validation)
    return {
      userId: queryParams.userId || 'anonymous',
      clientId: queryParams.clientId || 'demo-client'
    };
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Lambda handler functions
const webSocketHandler = new WebSocketHandler();

/**
 * Lambda handler for WebSocket $connect route
 */
exports.connectHandler = async (event, context) => {
  return await webSocketHandler.handleConnect(event);
};

/**
 * Lambda handler for WebSocket $disconnect route
 */
exports.disconnectHandler = async (event, context) => {
  return await webSocketHandler.handleDisconnect(event);
};

/**
 * Lambda handler for WebSocket message routing
 */
exports.messageHandler = async (event, context) => {
  return await webSocketHandler.handleMessage(event);
};

module.exports = WebSocketHandler;
