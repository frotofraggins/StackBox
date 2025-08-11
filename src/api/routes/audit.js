const express = require('express');
const router = express.Router();

// In-memory ring buffer for audit events
class AuditRingBuffer {
  constructor(maxSize = 1000) {
    this.buffer = [];
    this.maxSize = maxSize;
    this.index = 0;
    this.totalEvents = 0;
  }

  push(event) {
    // Add metadata
    const enrichedEvent = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: new Date().toISOString(),
      serverTimestamp: Date.now()
    };

    // Ring buffer logic
    this.buffer[this.index] = enrichedEvent;
    this.index = (this.index + 1) % this.maxSize;
    this.totalEvents++;

    return enrichedEvent.id;
  }

  getLast(limit = 100) {
    const actualLimit = Math.min(limit, this.buffer.length);
    const result = [];

    // Get last N events in chronological order
    let currentIndex = this.index - 1;
    if (currentIndex < 0) currentIndex = this.buffer.length - 1;

    for (let i = 0; i < actualLimit; i++) {
      if (this.buffer[currentIndex]) {
        result.unshift(this.buffer[currentIndex]);
      }
      currentIndex--;
      if (currentIndex < 0) currentIndex = this.buffer.length - 1;
      
      // Stop if we've wrapped around and hit undefined
      if (!this.buffer[currentIndex] && i < this.buffer.length - 1) break;
    }

    return result;
  }

  getStats() {
    return {
      totalEvents: this.totalEvents,
      currentBufferSize: Math.min(this.totalEvents, this.maxSize),
      maxBufferSize: this.maxSize,
      oldestEventTime: this.buffer.length > 0 ? 
        Math.min(...this.buffer.filter(e => e).map(e => new Date(e.timestamp).getTime())) : null,
      newestEventTime: this.buffer.length > 0 ? 
        Math.max(...this.buffer.filter(e => e).map(e => new Date(e.timestamp).getTime())) : null
    };
  }

  clear() {
    this.buffer = [];
    this.index = 0;
    this.totalEvents = 0;
  }
}

// Global buffer instance
let auditBuffer = null;

function getAuditBuffer() {
  if (!auditBuffer) {
    auditBuffer = new AuditRingBuffer(1000); // Keep last 1000 events
  }
  return auditBuffer;
}

// Middleware to check if audit is enabled
function checkAuditEnabled(req, res, next) {
  const isEnabled = process.env.AUDIT_ENABLED === 'true';
  
  if (!isEnabled) {
    return res.status(503).json({ 
      error: 'Audit service disabled',
      message: 'Set AUDIT_ENABLED=true to enable audit logging'
    });
  }
  
  next();
}

// POST /api/audit - Push audit event
router.post('/', checkAuditEnabled, (req, res) => {
  try {
    const event = req.body;
    
    // Basic validation
    if (!event || typeof event !== 'object') {
      return res.status(400).json({ error: 'Invalid event data' });
    }

    if (!event.eventName || typeof event.eventName !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid eventName' });
    }

    // Additional validation for required fields
    const requiredFields = ['timestamp', 'sessionId'];
    for (const field of requiredFields) {
      if (!event[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Sanitize and limit event size
    const sanitizedEvent = {
      eventName: event.eventName.slice(0, 100),
      payload: event.payload || {},
      timestamp: event.timestamp,
      sessionId: event.sessionId.slice(0, 100),
      userAgent: event.userAgent ? event.userAgent.slice(0, 500) : undefined,
      path: event.path ? event.path.slice(0, 200) : undefined,
      // Remove any potentially sensitive fields
      ...Object.fromEntries(
        Object.entries(event).filter(([key]) => 
          !['password', 'token', 'secret', 'key', 'auth'].some(sensitive => 
            key.toLowerCase().includes(sensitive)
          )
        )
      )
    };

    const buffer = getAuditBuffer();
    const eventId = buffer.push(sanitizedEvent);

    res.status(201).json({ 
      success: true, 
      eventId,
      message: 'Event recorded'
    });

  } catch (error) {
    console.error('Audit POST error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to record audit event'
    });
  }
});

// GET /api/audit - Retrieve audit events
router.get('/', checkAuditEnabled, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500); // Max 500 events
    const includeStats = req.query.stats === 'true';
    
    const buffer = getAuditBuffer();
    const events = buffer.getLast(limit);
    
    const response = {
      events,
      count: events.length,
      limit
    };

    if (includeStats) {
      response.stats = buffer.getStats();
    }

    res.json(response);

  } catch (error) {
    console.error('Audit GET error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve audit events'
    });
  }
});

// GET /api/audit/stats - Get buffer statistics
router.get('/stats', checkAuditEnabled, (req, res) => {
  try {
    const buffer = getAuditBuffer();
    const stats = buffer.getStats();
    
    res.json({
      ...stats,
      enabled: process.env.AUDIT_ENABLED === 'true',
      environment: process.env.NODE_ENV || 'unknown'
    });

  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to get audit statistics'
    });
  }
});

// DELETE /api/audit - Clear all events (dev only)
router.delete('/', checkAuditEnabled, (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        error: 'Operation not allowed in production'
      });
    }

    const buffer = getAuditBuffer();
    const stats = buffer.getStats();
    buffer.clear();

    res.json({
      success: true,
      message: 'Audit buffer cleared',
      previousStats: stats
    });

  } catch (error) {
    console.error('Audit DELETE error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to clear audit buffer'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  const isEnabled = process.env.AUDIT_ENABLED === 'true';
  
  res.json({
    service: 'audit',
    status: isEnabled ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString(),
    buffer: isEnabled ? getAuditBuffer().getStats() : null
  });
});

module.exports = router;
