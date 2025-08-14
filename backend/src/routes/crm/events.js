const express = require('express');
const { query } = require('../../db/connection');
const tenantMiddleware = require('../../middleware/tenant');

const router = express.Router();
router.use(tenantMiddleware);

/**
 * POST /api/crm/events
 * Track a new event for a contact
 */
router.post('/', async (req, res) => {
  try {
    const { contact_id, event_type, event_data = {}, source } = req.body;
    
    if (!contact_id || !event_type) {
      return res.status(400).json({ error: 'contact_id and event_type are required' });
    }
    
    // Verify contact belongs to tenant
    const contactCheck = await query(
      'SELECT id FROM contacts WHERE id = $1 AND owner_id = $2',
      [contact_id, req.owner_id]
    );
    
    if (contactCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const insertQuery = `
      INSERT INTO events (owner_id, contact_id, event_type, event_data, source)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, contact_id, event_type, event_data, source, created_at
    `;
    
    const result = await query(insertQuery, [req.owner_id, contact_id, event_type, event_data, source]);
    
    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * GET /api/crm/events
 * Get events for tenant (optionally filtered by contact)
 */
router.get('/', async (req, res) => {
  try {
    const { contact_id, event_type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE e.owner_id = $1';
    let params = [req.owner_id];
    let paramCount = 1;
    
    if (contact_id) {
      paramCount++;
      whereClause += ` AND e.contact_id = $${paramCount}`;
      params.push(contact_id);
    }
    
    if (event_type) {
      paramCount++;
      whereClause += ` AND e.event_type = $${paramCount}`;
      params.push(event_type);
    }
    
    const eventsQuery = `
      SELECT e.id, e.contact_id, e.event_type, e.event_data, e.source, e.created_at,
             c.email, c.first_name, c.last_name
      FROM events e
      JOIN contacts c ON e.contact_id = c.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(limit, offset);
    const result = await query(eventsQuery, params);
    
    res.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;
