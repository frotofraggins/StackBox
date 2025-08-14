/**
 * StackPro Circle Engine API Routes
 * Compliance-first CRM with AI-powered occasion outreach
 * RESTful endpoints for frontend integration
 */

const express = require('express');
const { CircleEngineService } = require('../../services/circle-engine-service');
const { logger } = require('../../utils/logger');

const router = express.Router();
const circleEngine = new CircleEngineService();

// ==========================================
// MIDDLEWARE & HELPERS
// ==========================================

// Mock authentication middleware (replace with real auth)
const requireAuth = (req, res, next) => {
  // For demo purposes, use a mock owner ID
  // In production, extract from JWT token or session
  req.ownerId = req.headers['x-owner-id'] || 'demo-owner-123';
  next();
};

// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// CONTACT MANAGEMENT ENDPOINTS
// ==========================================

/**
 * GET /api/circle-engine/contacts
 * Get all contacts with optional filtering
 */
router.get('/contacts', requireAuth, asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, search, tags, source } = req.query;
  
  const options = {
    limit: parseInt(limit),
    offset: parseInt(offset),
    search,
    tags: tags ? tags.split(',') : undefined,
    source
  };

  const contacts = await circleEngine.getContacts(req.ownerId, options);
  
  res.json({
    success: true,
    data: contacts,
    meta: {
      count: contacts.length,
      limit: options.limit,
      offset: options.offset
    }
  });
}));

/**
 * POST /api/circle-engine/contacts
 * Create a new contact
 */
router.post('/contacts', requireAuth, asyncHandler(async (req, res) => {
  const contactData = req.body;
  
  // Validate required fields
  if (!contactData.fullName) {
    return res.status(400).json({
      success: false,
      error: 'Full name is required'
    });
  }

  const contact = await circleEngine.createContact(req.ownerId, contactData);
  
  res.status(201).json({
    success: true,
    data: contact,
    message: 'Contact created successfully'
  });
}));

/**
 * PUT /api/circle-engine/contacts/:contactId
 * Update an existing contact
 */
router.put('/contacts/:contactId', requireAuth, asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const updates = req.body;

  const contact = await circleEngine.updateContact(req.ownerId, contactId, updates);
  
  res.json({
    success: true,
    data: contact,
    message: 'Contact updated successfully'
  });
}));

/**
 * GET /api/circle-engine/contacts/:contactId/consents
 * Get consent status for a contact
 */
router.get('/contacts/:contactId/consents', requireAuth, asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  
  const consents = await circleEngine.getContactConsents(req.ownerId, contactId);
  
  res.json({
    success: true,
    data: consents
  });
}));

/**
 * POST /api/circle-engine/contacts/:contactId/consents
 * Update consent for a contact and channel
 */
router.post('/contacts/:contactId/consents', requireAuth, asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const { channel, status, metadata = {} } = req.body;

  if (!channel || !status) {
    return res.status(400).json({
      success: false,
      error: 'Channel and status are required'
    });
  }

  if (!['email', 'sms', 'social_dm'].includes(channel)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid channel. Must be email, sms, or social_dm'
    });
  }

  if (!['pending', 'opt_in', 'opt_out'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be pending, opt_in, or opt_out'
    });
  }

  const consent = await circleEngine.updateConsent(
    req.ownerId, 
    contactId, 
    channel, 
    status, 
    metadata
  );
  
  res.json({
    success: true,
    data: consent,
    message: 'Consent updated successfully'
  });
}));

// ==========================================
// EVENT MANAGEMENT ENDPOINTS
// ==========================================

/**
 * GET /api/circle-engine/events/upcoming
 * Get upcoming events for scheduling
 */
router.get('/events/upcoming', requireAuth, asyncHandler(async (req, res) => {
  const { daysAhead = 7 } = req.query;
  
  const events = await circleEngine.getUpcomingEvents(req.ownerId, parseInt(daysAhead));
  
  res.json({
    success: true,
    data: events,
    meta: {
      daysAhead: parseInt(daysAhead),
      count: events.length
    }
  });
}));

/**
 * POST /api/circle-engine/events
 * Create a new event/occasion
 */
router.post('/events', requireAuth, asyncHandler(async (req, res) => {
  const eventData = req.body;
  
  // Validate required fields
  if (!eventData.contactId || !eventData.type || !eventData.eventDate) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID, type, and event date are required'
    });
  }

  const event = await circleEngine.createEvent(req.ownerId, eventData);
  
  res.status(201).json({
    success: true,
    data: event,
    message: 'Event created successfully'
  });
}));

// ==========================================
// AI CONTENT GENERATION ENDPOINTS
// ==========================================

/**
 * POST /api/circle-engine/ai/generate
 * Generate AI content using templates
 */
router.post('/ai/generate', requireAuth, asyncHandler(async (req, res) => {
  const { templateKey, variables } = req.body;
  
  if (!templateKey || !variables) {
    return res.status(400).json({
      success: false,
      error: 'Template key and variables are required'
    });
  }

  const result = await circleEngine.generateMessage(req.ownerId, templateKey, variables);
  
  res.json({
    success: true,
    data: result,
    message: 'AI content generated successfully'
  });
}));

/**
 * GET /api/circle-engine/ai/templates
 * Get available prompt templates
 */
router.get('/ai/templates', requireAuth, asyncHandler(async (req, res) => {
  const { category, channel, isActive } = req.query;
  
  const options = {
    category,
    channel,
    isActive: isActive !== undefined ? isActive === 'true' : true
  };

  const templates = await circleEngine.getPromptTemplates(req.ownerId, options);
  
  res.json({
    success: true,
    data: templates,
    meta: {
      count: templates.length
    }
  });
}));

// ==========================================
// MESSAGE DELIVERY ENDPOINTS
// ==========================================

/**
 * POST /api/circle-engine/messages/send
 * Send a message to a contact
 */
router.post('/messages/send', requireAuth, asyncHandler(async (req, res) => {
  const { 
    contactId, 
    channel, 
    content, 
    subjectLine, 
    templateKey,
    eventId,
    scheduledFor 
  } = req.body;
  
  if (!contactId || !channel || !content) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID, channel, and content are required'
    });
  }

  if (!['email', 'sms'].includes(channel)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid channel. Must be email or sms'
    });
  }

  const options = {
    subjectLine,
    templateKey,
    eventId,
    scheduledFor
  };

  const result = await circleEngine.sendMessage(
    req.ownerId, 
    contactId, 
    channel, 
    content, 
    options
  );
  
  res.json({
    success: true,
    data: result,
    message: result.success ? 'Message sent successfully' : 'Message failed to send'
  });
}));

/**
 * GET /api/circle-engine/messages/recent
 * Get recent message touches
 */
router.get('/messages/recent', requireAuth, asyncHandler(async (req, res) => {
  const { limit = 20, contactId, channel, status } = req.query;
  
  const options = {
    limit: parseInt(limit),
    contactId,
    channel,
    status
  };

  const touches = await circleEngine.getRecentTouches(req.ownerId, options);
  
  res.json({
    success: true,
    data: touches,
    meta: {
      count: touches.length,
      limit: options.limit
    }
  });
}));

/**
 * POST /api/circle-engine/messages/check-eligibility
 * Check if a contact can be messaged
 */
router.post('/messages/check-eligibility', requireAuth, asyncHandler(async (req, res) => {
  const { contactId, channel } = req.body;
  
  if (!contactId || !channel) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID and channel are required'
    });
  }

  const canMessage = await circleEngine.canMessageContact(contactId, channel, req.ownerId);
  
  res.json({
    success: true,
    data: {
      contactId,
      channel,
      canMessage,
      eligible: canMessage
    }
  });
}));

// ==========================================
// BRAND KIT MANAGEMENT ENDPOINTS
// ==========================================

/**
 * GET /api/circle-engine/brand-kit
 * Get owner's brand kit settings
 */
router.get('/brand-kit', requireAuth, asyncHandler(async (req, res) => {
  const brandKit = await circleEngine.getBrandKit(req.ownerId);
  
  res.json({
    success: true,
    data: brandKit
  });
}));

/**
 * PUT /api/circle-engine/brand-kit
 * Update owner's brand kit settings
 */
router.put('/brand-kit', requireAuth, asyncHandler(async (req, res) => {
  const brandData = req.body;
  
  // Validate required fields
  if (!brandData.businessName) {
    return res.status(400).json({
      success: false,
      error: 'Business name is required'
    });
  }

  const brandKit = await circleEngine.updateBrandKit(req.ownerId, brandData);
  
  res.json({
    success: true,
    data: brandKit,
    message: 'Brand kit updated successfully'
  });
}));

// ==========================================
// DASHBOARD & ANALYTICS ENDPOINTS
// ==========================================

/**
 * GET /api/circle-engine/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', requireAuth, asyncHandler(async (req, res) => {
  const stats = await circleEngine.getDashboardStats(req.ownerId);
  
  res.json({
    success: true,
    data: stats,
    generatedAt: new Date().toISOString()
  });
}));

/**
 * GET /api/circle-engine/dashboard/overview
 * Get dashboard overview with key metrics
 */
router.get('/dashboard/overview', requireAuth, asyncHandler(async (req, res) => {
  try {
    // Get comprehensive dashboard data
    const [stats, upcomingEvents, recentTouches] = await Promise.all([
      circleEngine.getDashboardStats(req.ownerId),
      circleEngine.getUpcomingEvents(req.ownerId, 7),
      circleEngine.getRecentTouches(req.ownerId, { limit: 10 })
    ]);

    const overview = {
      stats,
      upcomingEvents: upcomingEvents.slice(0, 5), // Top 5 upcoming
      recentActivity: recentTouches.slice(0, 5),   // Last 5 touches
      alerts: []
    };

    // Generate alerts based on data
    if (upcomingEvents.length > 0) {
      const todayEvents = upcomingEvents.filter(e => e.days_until === 0);
      const tomorrowEvents = upcomingEvents.filter(e => e.days_until === 1);
      
      if (todayEvents.length > 0) {
        overview.alerts.push({
          type: 'info',
          message: `${todayEvents.length} events today - review and send messages`,
          count: todayEvents.length
        });
      }
      
      if (tomorrowEvents.length > 0) {
        overview.alerts.push({
          type: 'warning',
          message: `${tomorrowEvents.length} events tomorrow - prepare messages`,
          count: tomorrowEvents.length
        });
      }
    }

    // Check consent coverage
    const totalContacts = parseInt(stats.contacts.total_contacts);
    const emailConsents = stats.consents.find(c => c.channel === 'email');
    const emailOptIns = emailConsents ? parseInt(emailConsents.opted_in) : 0;
    
    if (totalContacts > 0 && emailOptIns < totalContacts * 0.5) {
      overview.alerts.push({
        type: 'warning',
        message: `Low email consent rate - ${emailOptIns}/${totalContacts} contacts opted in`,
        percentage: Math.round((emailOptIns / totalContacts) * 100)
      });
    }

    res.json({
      success: true,
      data: overview,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Failed to generate dashboard overview', { error, ownerId: req.ownerId });
    throw error;
  }
}));

// ==========================================
// WORKFLOW AUTOMATION ENDPOINTS
// ==========================================

/**
 * POST /api/circle-engine/workflows/birthday-campaign
 * Run automated birthday campaign for upcoming birthdays
 */
router.post('/workflows/birthday-campaign', requireAuth, asyncHandler(async (req, res) => {
  const { dryRun = true, daysAhead = 7 } = req.body;
  
  try {
    // Get upcoming birthday events
    const upcomingEvents = await circleEngine.getUpcomingEvents(req.ownerId, daysAhead);
    const birthdayEvents = upcomingEvents.filter(e => e.event_type === 'birthday');
    
    const results = {
      totalBirthdays: birthdayEvents.length,
      eligible: 0,
      messagesGenerated: 0,
      messagesSent: 0,
      errors: [],
      preview: []
    };

    for (const event of birthdayEvents) {
      try {
        // Check if we can message this contact
        if (!event.can_email && !event.can_sms) {
          results.errors.push({
            contactName: event.contact_name,
            error: 'No messaging consent available'
          });
          continue;
        }

        results.eligible++;
        
        // Choose preferred channel
        const channel = event.can_email ? 'email' : 'sms';
        const templateKey = channel === 'email' ? 'birthday.wish.email.v1' : 'birthday.wish.sms.v1';

        // Generate AI message
        const aiResult = await circleEngine.generateMessage(req.ownerId, templateKey, {
          contact_name: event.contact_name,
          owner_name: 'Your Business', // TODO: Get from brand kit
          business_name: 'Your Business',
          tone: 'friendly'
        });

        results.messagesGenerated++;
        
        const messagePreview = {
          contactName: event.contact_name,
          eventDate: event.event_date,
          daysUntil: event.days_until,
          channel: channel,
          content: aiResult.content,
          templateUsed: templateKey
        };

        if (!dryRun) {
          // Actually send the message
          const sendResult = await circleEngine.sendMessage(
            req.ownerId,
            event.contact_id,
            channel,
            aiResult.content,
            {
              templateKey: templateKey,
              eventId: event.event_id,
              tokensUsed: aiResult.tokensUsed
            }
          );

          messagePreview.sent = sendResult.success;
          messagePreview.deliveryResult = sendResult.deliveryResult;

          if (sendResult.success) {
            results.messagesSent++;
          } else {
            results.errors.push({
              contactName: event.contact_name,
              error: sendResult.deliveryResult?.error || 'Send failed'
            });
          }
        }

        results.preview.push(messagePreview);

      } catch (error) {
        results.errors.push({
          contactName: event.contact_name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: dryRun ? 
        'Birthday campaign preview generated' : 
        `Birthday campaign completed - ${results.messagesSent} messages sent`,
      dryRun: dryRun
    });

  } catch (error) {
    logger.error('❌ Birthday campaign failed', { error, ownerId: req.ownerId });
    throw error;
  }
}));

// ==========================================
// HEALTH CHECK & SYSTEM INFO
// ==========================================

/**
 * GET /api/circle-engine/health
 * Health check endpoint
 */
router.get('/health', asyncHandler(async (req, res) => {
  // Basic health check - could expand to check DB, AWS services, etc.
  res.json({
    success: true,
    service: 'Circle Engine',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      aiGeneration: true,
      emailDelivery: true,
      smsDelivery: false, // Not yet implemented
      socialPosting: false, // Not yet implemented
      complianceTracking: true,
      eventManagement: true
    }
  });
}));

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler for unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Circle Engine endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('❌ Circle Engine API Error', { 
    error: error.message, 
    stack: error.stack,
    path: req.path,
    method: req.method,
    ownerId: req.ownerId
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
});

module.exports = router;
