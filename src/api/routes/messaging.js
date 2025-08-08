const express = require('express');
const router = express.Router();

// Import services
const MessagingService = require('../../services/messaging/messaging-service');
const { logger, performanceLogger } = require('../../services/logger');
const authMiddleware = require('../middleware/auth');

// Initialize service
const messagingService = new MessagingService();

// Authentication middleware for all messaging routes
router.use(authMiddleware);

// Helper function to get client ID from request
const getClientId = (req) => {
  return req.user?.clientId || req.headers['x-client-id'] || 'demo-client-123';
};

const getUserId = (req) => {
  return req.user?.id || req.headers['x-user-id'] || 'demo-user';
};

/**
 * @route POST /api/messaging/channels
 * @desc Create a new channel
 * @access Private
 */
router.post('/channels', async (req, res) => {
  const perf = performanceLogger('create_channel').start();
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    const { name, description, type = 'public', members = [], settings = {} } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required'
      });
    }

    const channelData = {
      name: name.trim(),
      description: description?.trim() || '',
      type,
      members: [...new Set([userId, ...members])], // Ensure creator is included
      settings
    };

    const channel = await messagingService.createChannel(clientId, userId, channelData);

    const duration = perf.end('success', {
      channelId: channel.channelId,
      channelType: type,
      memberCount: channel.members.length
    });

    logger.info('Channel created via API', {
      channelId: channel.channelId,
      clientId,
      userId,
      channelType: type
    });

    res.status(201).json({
      success: true,
      channel,
      processingTime: duration
    });

  } catch (error) {
    perf.end('error', { error: error.message });
    
    logger.error('Channel creation failed', {
      clientId,
      userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/messaging/channels
 * @desc Get client channels for user
 * @access Private
 */
router.get('/channels', async (req, res) => {
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    const channels = await messagingService.getClientChannels(clientId, userId);

    res.json({
      success: true,
      channels,
      total: channels.length
    });

  } catch (error) {
    logger.error('Failed to get channels', {
      clientId,
      userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/messaging/channels/:channelId/members
 * @desc Add user to channel
 * @access Private
 */
router.post('/channels/:channelId/members', async (req, res) => {
  const { channelId } = req.params;
  const { userId: targetUserId } = req.body;
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    await messagingService.addUserToChannel(channelId, targetUserId, userId);

    logger.info('User added to channel via API', {
      channelId,
      targetUserId,
      addedBy: userId,
      clientId
    });

    res.json({
      success: true,
      message: 'User added to channel successfully'
    });

  } catch (error) {
    logger.error('Failed to add user to channel', {
      channelId,
      targetUserId,
      addedBy: userId,
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/messaging/channels/:channelId/messages
 * @desc Get channel messages with pagination
 * @access Private
 */
router.get('/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const { limit = 50, lastKey } = req.query;
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    const parsedLimit = Math.min(parseInt(limit) || 50, 100); // Cap at 100
    const parsedLastKey = lastKey ? JSON.parse(lastKey) : null;

    const result = await messagingService.getChannelMessages(
      channelId, 
      userId, 
      parsedLimit, 
      parsedLastKey
    );

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('Failed to get channel messages', {
      channelId,
      userId,
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/messaging/channels/:channelId/messages
 * @desc Send message to channel
 * @access Private
 */
router.post('/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    const { content, type = 'text', threadId, attachments = [] } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    const messageData = {
      content: content.trim(),
      type,
      threadId,
      attachments
    };

    const message = await messagingService.sendMessage(
      channelId, 
      userId, 
      clientId, 
      messageData
    );

    logger.info('Message sent via API', {
      messageId: message.messageId,
      channelId,
      userId,
      clientId
    });

    res.status(201).json({
      success: true,
      message
    });

  } catch (error) {
    logger.error('Failed to send message', {
      channelId,
      userId,
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/messaging/messages/:messageId/reactions
 * @desc Add reaction to message
 * @access Private
 */
router.post('/messages/:messageId/reactions', async (req, res) => {
  const { messageId } = req.params;
  const { channelId, emoji } = req.body;
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    if (!channelId || !emoji) {
      return res.status(400).json({
        success: false,
        error: 'channelId and emoji are required'
      });
    }

    await messagingService.addReaction(messageId, channelId, userId, clientId, emoji);

    res.json({
      success: true,
      message: 'Reaction added successfully'
    });

  } catch (error) {
    logger.error('Failed to add reaction', {
      messageId,
      channelId,
      userId,
      clientId,
      emoji,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/messaging/presence
 * @desc Update user presence status
 * @access Private
 */
router.put('/presence', async (req, res) => {
  const { status = 'online' } = req.body;
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    const validStatuses = ['online', 'away', 'busy', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const presence = await messagingService.updateUserPresence(userId, clientId, status);

    res.json({
      success: true,
      presence
    });

  } catch (error) {
    logger.error('Failed to update presence', {
      userId,
      clientId,
      status,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/messaging/presence
 * @desc Get client user presence
 * @access Private
 */
router.get('/presence', async (req, res) => {
  const clientId = getClientId(req);

  try {
    const presence = await messagingService.getClientPresence(clientId);

    res.json({
      success: true,
      presence
    });

  } catch (error) {
    logger.error('Failed to get presence', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/messaging/documents/:documentId/channel
 * @desc Create document-specific channel
 * @access Private
 */
router.post('/documents/:documentId/channel', async (req, res) => {
  const { documentId } = req.params;
  const { documentName } = req.body;
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    if (!documentName) {
      return res.status(400).json({
        success: false,
        error: 'documentName is required'
      });
    }

    const channel = await messagingService.createDocumentChannel(
      clientId, 
      userId, 
      documentId, 
      documentName
    );

    logger.info('Document channel created', {
      channelId: channel.channelId,
      documentId,
      clientId,
      userId
    });

    res.status(201).json({
      success: true,
      channel
    });

  } catch (error) {
    logger.error('Failed to create document channel', {
      documentId,
      clientId,
      userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/messaging/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/notifications', async (req, res) => {
  const { limit = 50, status } = req.query;
  const userId = getUserId(req);

  try {
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const notifications = await messagingService.getUserNotifications(
      userId, 
      parsedLimit, 
      status
    );

    res.json({
      success: true,
      notifications,
      total: notifications.length
    });

  } catch (error) {
    logger.error('Failed to get notifications', {
      userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/messaging/notifications
 * @desc Send notification to user
 * @access Private
 */
router.post('/notifications', async (req, res) => {
  const { userId: targetUserId, type, title, body, data = {} } = req.body;
  const clientId = getClientId(req);

  try {
    if (!targetUserId || !type || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId, type, title, and body are required'
      });
    }

    const notification = await messagingService.sendNotification(
      targetUserId,
      clientId,
      { type, title, body, data }
    );

    res.status(201).json({
      success: true,
      notification
    });

  } catch (error) {
    logger.error('Failed to send notification', {
      targetUserId,
      clientId,
      type,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/messaging/stats
 * @desc Get messaging statistics for client
 * @access Private
 */
router.get('/stats', async (req, res) => {
  const clientId = getClientId(req);
  const userId = getUserId(req);

  try {
    // Get basic stats
    const channels = await messagingService.getClientChannels(clientId, userId);
    const presence = await messagingService.getClientPresence(clientId);
    const notifications = await messagingService.getUserNotifications(userId, 10);

    // Calculate additional stats
    const totalChannels = channels.length;
    const publicChannels = channels.filter(ch => ch.channelType === 'public').length;
    const privateChannels = channels.filter(ch => ch.channelType === 'private').length;
    const documentChannels = channels.filter(ch => ch.channelType === 'document').length;
    
    const onlineUsers = Object.values(presence).filter(p => p.status === 'online').length;
    const totalUsers = Object.keys(presence).length;
    
    const unreadNotifications = notifications.filter(n => n.status === 'unread').length;

    const stats = {
      channels: {
        total: totalChannels,
        public: publicChannels,
        private: privateChannels,
        document: documentChannels
      },
      users: {
        total: totalUsers,
        online: onlineUsers,
        offline: totalUsers - onlineUsers
      },
      notifications: {
        total: notifications.length,
        unread: unreadNotifications
      },
      activity: {
        activeChannels: channels.filter(ch => ch.lastActivity).length,
        recentChannels: channels.slice(0, 5).map(ch => ({
          id: ch.channelId,
          name: ch.name,
          lastActivity: ch.lastActivity
        }))
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Failed to get messaging stats', {
      clientId,
      userId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/messaging/health
 * @desc Health check for messaging services
 * @access Private
 */
router.get('/health', async (req, res) => {
  const clientId = getClientId(req);
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Test messaging service
    try {
      await messagingService.getClientPresence(clientId);
      health.services.messagingService = 'healthy';
    } catch (error) {
      health.services.messagingService = 'unhealthy';
      health.status = 'degraded';
    }

    // Test database connectivity
    try {
      await messagingService.dynamodb.scan({
        TableName: 'StackPro-Channels',
        Limit: 1
      }).promise();
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      health
    });

  } catch (error) {
    logger.error('Messaging health check failed', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      health: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Error handling middleware specific to messaging routes
router.use((error, req, res, next) => {
  logger.error('Messaging API Error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    clientId: getClientId(req),
    userId: getUserId(req)
  });

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again.'
  });
});

module.exports = router;
