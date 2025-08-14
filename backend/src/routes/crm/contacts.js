const express = require('express');
const { query } = require('../../db/connection');
const tenantMiddleware = require('../../middleware/tenant');

const router = express.Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

/**
 * GET /api/crm/contacts
 * Retrieve all contacts for the authenticated tenant
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, tags } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE owner_id = $1';
    let params = [req.owner_id];
    let paramCount = 1;
    
    // Add search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR company ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    // Add tags filter
    if (tags) {
      paramCount++;
      whereClause += ` AND tags && $${paramCount}`;
      params.push(Array.isArray(tags) ? tags : [tags]);
    }
    
    const contactsQuery = `
      SELECT id, email, first_name, last_name, phone, company, status, tags, created_at, updated_at
      FROM contacts 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(limit, offset);
    
    const result = await query(contactsQuery, params);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM contacts ${whereClause}`;
    const countResult = await query(countQuery, params.slice(0, paramCount));
    
    res.json({
      contacts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * POST /api/crm/contacts
 * Create a new contact for the authenticated tenant
 */
router.post('/', async (req, res) => {
  try {
    const { email, first_name, last_name, phone, company, tags = [], custom_fields = {} } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const insertQuery = `
      INSERT INTO contacts (owner_id, email, first_name, last_name, phone, company, tags, custom_fields)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, phone, company, status, tags, created_at, updated_at
    `;
    
    const params = [req.owner_id, email, first_name, last_name, phone, company, tags, custom_fields];
    const result = await query(insertQuery, params);
    
    res.status(201).json({ contact: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Contact with this email already exists' });
    }
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

/**
 * GET /api/crm/contacts/:id
 * Get a specific contact by ID (tenant-scoped)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const contactQuery = `
      SELECT id, email, first_name, last_name, phone, company, status, tags, custom_fields, created_at, updated_at
      FROM contacts 
      WHERE id = $1 AND owner_id = $2
    `;
    
    const result = await query(contactQuery, [id, req.owner_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ contact: result.rows[0] });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

/**
 * PUT /api/crm/contacts/:id
 * Update a contact (tenant-scoped)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name, phone, company, status, tags, custom_fields } = req.body;
    
    const updateQuery = `
      UPDATE contacts 
      SET email = COALESCE($1, email),
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone),
          company = COALESCE($5, company),
          status = COALESCE($6, status),
          tags = COALESCE($7, tags),
          custom_fields = COALESCE($8, custom_fields),
          updated_at = NOW()
      WHERE id = $9 AND owner_id = $10
      RETURNING id, email, first_name, last_name, phone, company, status, tags, custom_fields, updated_at
    `;
    
    const params = [email, first_name, last_name, phone, company, status, tags, custom_fields, id, req.owner_id];
    const result = await query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ contact: result.rows[0] });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

/**
 * DELETE /api/crm/contacts/:id
 * Delete a contact (tenant-scoped)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteQuery = 'DELETE FROM contacts WHERE id = $1 AND owner_id = $2 RETURNING id';
    const result = await query(deleteQuery, [id, req.owner_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
