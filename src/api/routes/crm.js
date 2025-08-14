/**
 * StackPro CRM API Routes - Phase 1
 * Multi-industry CRM with onboarding-specific defaults
 */

const express = require('express');
const crmService = require('../../services/crm-service');
const logger = require('../../utils/logger');

const router = express.Router();

// Middleware to extract owner_id from request
// In Phase 1, we'll use a simple demo owner until authentication is fully implemented
const getOwnerId = (req) => {
  // For now, use demo owner ID - in production this would come from JWT token
  return req.headers['x-owner-id'] || 'demo-owner-uuid-phase1-2025';
};

// ========================================
// CONTACT MANAGEMENT ENDPOINTS
// ========================================

/**
 * GET /api/crm/contacts
 * Get contacts with filtering
 */
router.get('/contacts', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const filters = {
      industry_profile: req.query.industry_profile,
      source: req.query.source,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      has_birthday: req.query.has_birthday === 'true' ? true : req.query.has_birthday === 'false' ? false : undefined,
      consent_status: req.query.consent_status,
      consent_channel: req.query.consent_channel,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const contacts = await crmService.getContacts(ownerId, filters);
    res.json({
      success: true,
      data: contacts,
      count: contacts.length,
      filters: filters
    });
  } catch (error) {
    logger.error('Error getting contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contacts',
      message: error.message
    });
  }
});

/**
 * GET /api/crm/contacts/:id
 * Get single contact with full details
 */
router.get('/contacts/:id', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = req.params;

    const contact = await crmService.getContact(ownerId, id);
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    logger.error('Error getting contact:', error);
    const status = error.message === 'Contact not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to get contact',
      message: error.message
    });
  }
});

/**
 * POST /api/crm/contacts
 * Create new contact
 */
router.post('/contacts', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const contactData = req.body;

    // Validate required fields
    if (!contactData.full_name) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'full_name is required'
      });
    }

    if (!contactData.industry_profile) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'industry_profile is required'
      });
    }

    const contact = await crmService.createContact(ownerId, contactData);
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact created successfully'
    });
  } catch (error) {
    logger.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create contact',
      message: error.message
    });
  }
});

/**
 * PUT /api/crm/contacts/:id
 * Update existing contact
 */
router.put('/contacts/:id', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = req.params;
    const updates = req.body;

    const contact = await crmService.updateContact(ownerId, id, updates);
    res.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    logger.error('Error updating contact:', error);
    const status = error.message === 'Contact not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to update contact',
      message: error.message
    });
  }
});

/**
 * POST /api/crm/contacts/import
 * Import multiple contacts from CSV/Google/etc
 */
router.post('/contacts/import', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { contacts, source = 'manual' } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'contacts array is required and must not be empty'
      });
    }

    const results = await crmService.importContacts(ownerId, contacts, source);
    res.json({
      success: true,
      data: results,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`
    });
  } catch (error) {
    logger.error('Error importing contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import contacts',
      message: error.message
    });
  }
});

// ========================================
// CONSENT MANAGEMENT ENDPOINTS
// ========================================

/**
 * GET /api/crm/contacts/:id/consents
 * Get consent status for a contact
 */
router.get('/contacts/:id/consents', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = req.params;

    const consents = await crmService.getConsents(ownerId, id);
    res.json({
      success: true,
      data: consents
    });
  } catch (error) {
    logger.error('Error getting consents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consents',
      message: error.message
    });
  }
});

/**
 * PUT /api/crm/contacts/:id/consents/:channel
 * Update consent for specific channel
 */
router.put('/contacts/:id/consents/:channel', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { id, channel } = req.params;
    const { status, proof } = req.body;

    if (!['pending', 'opt_in', 'opt_out'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'status must be one of: pending, opt_in, opt_out'
      });
    }

    if (!['email', 'sms', 'social_dm'].includes(channel)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'channel must be one of: email, sms, social_dm'
      });
    }

    const consent = await crmService.updateConsent(ownerId, id, channel, status, proof);
    res.json({
      success: true,
      data: consent,
      message: 'Consent updated successfully'
    });
  } catch (error) {
    logger.error('Error updating consent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update consent',
      message: error.message
    });
  }
});

// ========================================
// EVENT MANAGEMENT ENDPOINTS
// ========================================

/**
 * GET /api/crm/events/upcoming
 * Get upcoming events (birthdays, anniversaries, milestones)
 */
router.get('/events/upcoming', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const days = parseInt(req.query.days) || 30;

    if (days > 365) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'days cannot exceed 365'
      });
    }

    const events = await crmService.getUpcomingEvents(ownerId, days);
    res.json({
      success: true,
      data: events,
      count: events.length,
      days_ahead: days
    });
  } catch (error) {
    logger.error('Error getting upcoming events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming events',
      message: error.message
    });
  }
});

/**
 * POST /api/crm/events
 * Create new event
 */
router.post('/events', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const eventData = req.body;

    // Validate required fields
    if (!eventData.contact_id || !eventData.type || !eventData.event_date) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'contact_id, type, and event_date are required'
      });
    }

    if (!['birthday', 'anniversary', 'milestone', 'custom'].includes(eventData.type)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'type must be one of: birthday, anniversary, milestone, custom'
      });
    }

    const event = await crmService.createEvent(ownerId, eventData);
    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully'
    });
  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
      message: error.message
    });
  }
});

// ========================================
// TOUCH/INTERACTION ENDPOINTS
// ========================================

/**
 * GET /api/crm/contacts/:id/touches
 * Get interaction history for a contact
 */
router.get('/contacts/:id/touches', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const touches = await crmService.getTouches(ownerId, id, limit);
    res.json({
      success: true,
      data: touches,
      count: touches.length
    });
  } catch (error) {
    logger.error('Error getting touches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get touches',
      message: error.message
    });
  }
});

/**
 * POST /api/crm/touches
 * Log new interaction/touch
 */
router.post('/touches', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const touchData = req.body;

    // Validate required fields
    if (!touchData.contact_id || !touchData.channel) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'contact_id and channel are required'
      });
    }

    if (!['email', 'sms', 'call', 'meeting', 'note'].includes(touchData.channel)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'channel must be one of: email, sms, call, meeting, note'
      });
    }

    const touch = await crmService.logTouch(ownerId, touchData);
    res.status(201).json({
      success: true,
      data: touch,
      message: 'Touch logged successfully'
    });
  } catch (error) {
    logger.error('Error logging touch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log touch',
      message: error.message
    });
  }
});

// ========================================
// INDUSTRY PROFILE ENDPOINTS
// ========================================

/**
 * GET /api/crm/industry-profiles
 * Get all available industry profiles
 */
router.get('/industry-profiles', async (req, res) => {
  try {
    const profiles = await crmService.getIndustryProfiles();
    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    logger.error('Error getting industry profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get industry profiles',
      message: error.message
    });
  }
});

/**
 * GET /api/crm/industry-profiles/:key
 * Get specific industry profile details
 */
router.get('/industry-profiles/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const profile = await crmService.getIndustryProfile(key);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error getting industry profile:', error);
    const status = error.message === 'Industry profile not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to get industry profile',
      message: error.message
    });
  }
});

/**
 * POST /api/crm/apply-industry-defaults/:key
 * Apply industry defaults to owner account
 */
router.post('/apply-industry-defaults/:key', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { key } = req.params;

    const result = await crmService.applyIndustryDefaults(ownerId, key);
    res.json({
      success: true,
      data: result,
      message: `Industry defaults applied for ${key}`
    });
  } catch (error) {
    logger.error('Error applying industry defaults:', error);
    const status = error.message === 'Industry profile not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: 'Failed to apply industry defaults',
      message: error.message
    });
  }
});

// ========================================
// ANALYTICS & DASHBOARD ENDPOINTS
// ========================================

/**
 * GET /api/crm/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const stats = await crmService.getDashboardStats(ownerId);
    
    res.json({
      success: true,
      data: {
        ...stats,
        // Convert string numbers to integers for frontend
        total_contacts: parseInt(stats.total_contacts) || 0,
        new_contacts_30d: parseInt(stats.new_contacts_30d) || 0,
        contacts_with_birthdays: parseInt(stats.contacts_with_birthdays) || 0,
        total_events: parseInt(stats.total_events) || 0,
        upcoming_events_7d: parseInt(stats.upcoming_events_7d) || 0,
        total_touches: parseInt(stats.total_touches) || 0,
        touches_30d: parseInt(stats.touches_30d) || 0,
        email_opt_ins: parseInt(stats.email_opt_ins) || 0
      }
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard stats',
      message: error.message
    });
  }
});

// ========================================
// HEALTH CHECK
// ========================================

/**
 * GET /api/crm/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await crmService.healthCheck();
    res.json({
      success: true,
      service: 'crm',
      ...health
    });
  } catch (error) {
    logger.error('CRM health check failed:', error);
    res.status(503).json({
      success: false,
      service: 'crm',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
