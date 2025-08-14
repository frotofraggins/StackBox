/**
 * StackPro CRM Service - Phase 1
 * Multi-industry CRM with onboarding-specific defaults
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

class CRMService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  // ========================================
  // CONTACT MANAGEMENT (Phase 1 Core)
  // ========================================

  async createContact(ownerId, contactData) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO contacts (
          owner_id, industry_profile, full_name, primary_email, primary_phone,
          city, state, postal_code, country, birthday_date, custom_fields,
          relationship_strength, source, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const values = [
        ownerId,
        contactData.industry_profile,
        contactData.full_name,
        contactData.primary_email || null,
        contactData.primary_phone || null,
        contactData.city || null,
        contactData.state || null,
        contactData.postal_code || null,
        contactData.country || null,
        contactData.birthday_date || null,
        contactData.custom_fields || {},
        contactData.relationship_strength || 50,
        contactData.source || 'manual',
        contactData.tags || []
      ];

      const result = await client.query(query, values);
      logger.info(`Contact created: ${result.rows[0].id} for owner ${ownerId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating contact:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getContacts(ownerId, filters = {}) {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT c.*, 
               COALESCE(array_agg(DISTINCT e.type) FILTER (WHERE e.type IS NOT NULL), '{}') as event_types,
               COUNT(DISTINCT t.id) as touch_count
        FROM contacts c
        LEFT JOIN events e ON c.id = e.contact_id
        LEFT JOIN touches t ON c.id = t.contact_id
        WHERE c.owner_id = $1
      `;
      
      const values = [ownerId];
      let paramCount = 1;

      // Apply filters
      if (filters.industry_profile) {
        paramCount++;
        query += ` AND c.industry_profile = $${paramCount}`;
        values.push(filters.industry_profile);
      }

      if (filters.source) {
        paramCount++;
        query += ` AND c.source = $${paramCount}`;
        values.push(filters.source);
      }

      if (filters.tags && filters.tags.length > 0) {
        paramCount++;
        query += ` AND c.tags && $${paramCount}`;
        values.push(filters.tags);
      }

      if (filters.has_birthday === true) {
        query += ` AND c.birthday_date IS NOT NULL`;
      } else if (filters.has_birthday === false) {
        query += ` AND c.birthday_date IS NULL`;
      }

      if (filters.consent_status) {
        query += ` AND EXISTS (
          SELECT 1 FROM consents con 
          WHERE con.contact_id = c.id 
          AND con.channel = '${filters.consent_channel || 'email'}'
          AND con.status = '${filters.consent_status}'
        )`;
      }

      query += `
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT ${filters.limit || 50}
        OFFSET ${filters.offset || 0}
      `;

      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting contacts:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getContact(ownerId, contactId) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT c.*,
               array_agg(DISTINCT jsonb_build_object(
                 'id', e.id, 'type', e.type, 'event_date', e.event_date, 'notes', e.notes
               )) FILTER (WHERE e.id IS NOT NULL) as events,
               array_agg(DISTINCT jsonb_build_object(
                 'channel', con.channel, 'status', con.status, 'updated_at', con.updated_at
               )) FILTER (WHERE con.id IS NOT NULL) as consents
        FROM contacts c
        LEFT JOIN events e ON c.id = e.contact_id
        LEFT JOIN consents con ON c.id = con.contact_id
        WHERE c.owner_id = $1 AND c.id = $2
        GROUP BY c.id
      `;
      
      const result = await client.query(query, [ownerId, contactId]);
      if (result.rows.length === 0) {
        throw new Error('Contact not found');
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting contact:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateContact(ownerId, contactId, updates) {
    const client = await this.pool.connect();
    try {
      const setClause = [];
      const values = [ownerId, contactId];
      let paramCount = 2;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          paramCount++;
          setClause.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
        }
      });

      if (setClause.length === 0) {
        throw new Error('No valid updates provided');
      }

      const query = `
        UPDATE contacts 
        SET ${setClause.join(', ')}, updated_at = now()
        WHERE owner_id = $1 AND id = $2
        RETURNING *
      `;

      const result = await client.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Contact not found');
      }
      
      logger.info(`Contact updated: ${contactId} for owner ${ownerId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating contact:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // CONSENT MANAGEMENT (GDPR Compliance)
  // ========================================

  async updateConsent(ownerId, contactId, channel, status, proof = null) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO consents (owner_id, contact_id, channel, status, proof, opt_in_timestamp, opt_in_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (contact_id, channel)
        DO UPDATE SET 
          status = EXCLUDED.status,
          proof = EXCLUDED.proof,
          opt_in_timestamp = CASE WHEN EXCLUDED.status = 'opt_in' THEN now() ELSE consents.opt_in_timestamp END,
          updated_at = now()
        RETURNING *
      `;

      const values = [
        ownerId, 
        contactId, 
        channel, 
        status, 
        proof,
        status === 'opt_in' ? new Date() : null,
        status === 'opt_in' ? 'manual_update' : null
      ];

      const result = await client.query(query, values);
      logger.info(`Consent updated: ${contactId} - ${channel} - ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating consent:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getConsents(ownerId, contactId) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM consents 
        WHERE owner_id = $1 AND contact_id = $2
        ORDER BY channel
      `;
      
      const result = await client.query(query, [ownerId, contactId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting consents:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // EVENT MANAGEMENT (Birthdays, Milestones)
  // ========================================

  async createEvent(ownerId, eventData) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO events (owner_id, contact_id, type, event_date, recurrence, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        ownerId,
        eventData.contact_id,
        eventData.type,
        eventData.event_date,
        eventData.recurrence || null,
        eventData.notes || null,
        eventData.created_by || 'manual'
      ];

      const result = await client.query(query, values);
      logger.info(`Event created: ${result.rows[0].id} for contact ${eventData.contact_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUpcomingEvents(ownerId, days = 30) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT e.*, c.full_name, c.primary_email, c.tags
        FROM events e
        JOIN contacts c ON e.contact_id = c.id
        WHERE e.owner_id = $1
        AND e.event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        ORDER BY e.event_date ASC
      `;
      
      const result = await client.query(query, [ownerId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting upcoming events:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // TOUCH MANAGEMENT (Interaction Logging)
  // ========================================

  async logTouch(ownerId, touchData) {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO touches (owner_id, contact_id, channel, subject, content, status, occurred_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        ownerId,
        touchData.contact_id,
        touchData.channel,
        touchData.subject || null,
        touchData.content || null,
        touchData.status || 'logged',
        touchData.occurred_at || new Date()
      ];

      const result = await client.query(query, values);
      logger.info(`Touch logged: ${result.rows[0].id} for contact ${touchData.contact_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error logging touch:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTouches(ownerId, contactId, limit = 20) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM touches 
        WHERE owner_id = $1 AND contact_id = $2
        ORDER BY occurred_at DESC
        LIMIT $3
      `;
      
      const result = await client.query(query, [ownerId, contactId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting touches:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // INDUSTRY PROFILE MANAGEMENT (Phase 1)
  // ========================================

  async getIndustryProfiles() {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM industry_profiles 
        ORDER BY display_name
      `;
      
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting industry profiles:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getIndustryProfile(industryKey) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM industry_profiles 
        WHERE industry_key = $1
      `;
      
      const result = await client.query(query, [industryKey]);
      if (result.rows.length === 0) {
        throw new Error('Industry profile not found');
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting industry profile:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // ONBOARDING SUPPORT (Phase 1)
  // ========================================

  async applyIndustryDefaults(ownerId, industryKey) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get industry profile defaults
      const profileQuery = `
        SELECT * FROM industry_profiles WHERE industry_key = $1
      `;
      const profileResult = await client.query(profileQuery, [industryKey]);
      
      if (profileResult.rows.length === 0) {
        throw new Error('Industry profile not found');
      }

      const profile = profileResult.rows[0];

      // Update owner's industry profile and brand kit
      const updateOwnerQuery = `
        UPDATE owners 
        SET industry_profile = $1,
            brand_kit = jsonb_build_object(
              'industry', $1,
              'default_tags', $2,
              'ai_tone', $3,
              'applied_at', now()
            )
        WHERE id = $4
        RETURNING *
      `;

      const ownerResult = await client.query(updateOwnerQuery, [
        industryKey,
        JSON.stringify(profile.default_tags),
        profile.ai_tone,
        ownerId
      ]);

      await client.query('COMMIT');
      
      logger.info(`Industry defaults applied: ${industryKey} for owner ${ownerId}`);
      return {
        owner: ownerResult.rows[0],
        profile: profile
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error applying industry defaults:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // IMPORT FUNCTIONALITY (Phase 1)
  // ========================================

  async importContacts(ownerId, contacts, source = 'csv') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const contactData of contacts) {
        try {
          // Get owner's industry profile for contact
          const ownerQuery = `SELECT industry_profile FROM owners WHERE id = $1`;
          const ownerResult = await client.query(ownerQuery, [ownerId]);
          const industryProfile = ownerResult.rows[0]?.industry_profile || 'marketing';

          const insertQuery = `
            INSERT INTO contacts (
              owner_id, industry_profile, full_name, primary_email, primary_phone,
              city, state, postal_code, country, birthday_date, source, tags
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (owner_id, primary_email) WHERE primary_email IS NOT NULL
            DO UPDATE SET 
              full_name = EXCLUDED.full_name,
              primary_phone = EXCLUDED.primary_phone,
              city = EXCLUDED.city,
              state = EXCLUDED.state,
              updated_at = now()
            RETURNING id, (xmax = 0) AS created
          `;

          const values = [
            ownerId,
            industryProfile,
            contactData.full_name || `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim(),
            contactData.primary_email || contactData.email,
            contactData.primary_phone || contactData.phone,
            contactData.city,
            contactData.state,
            contactData.postal_code || contactData.zip,
            contactData.country || 'US',
            contactData.birthday_date || contactData.birthday,
            source,
            contactData.tags || []
          ];

          const result = await client.query(insertQuery, values);
          if (result.rows[0].created) {
            results.created++;
          } else {
            results.updated++;
          }

        } catch (error) {
          results.errors.push({
            contact: contactData,
            error: error.message
          });
        }
      }

      await client.query('COMMIT');
      
      logger.info(`Import completed for owner ${ownerId}: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`);
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error importing contacts:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // ANALYTICS & REPORTING (Phase 1)
  // ========================================

  async getDashboardStats(ownerId) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT c.id) as total_contacts,
          COUNT(DISTINCT c.id) FILTER (WHERE c.created_at > CURRENT_DATE - INTERVAL '30 days') as new_contacts_30d,
          COUNT(DISTINCT c.id) FILTER (WHERE c.birthday_date IS NOT NULL) as contacts_with_birthdays,
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT e.id) FILTER (WHERE e.event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as upcoming_events_7d,
          COUNT(DISTINCT t.id) as total_touches,
          COUNT(DISTINCT t.id) FILTER (WHERE t.occurred_at > CURRENT_DATE - INTERVAL '30 days') as touches_30d,
          COUNT(DISTINCT con.id) FILTER (WHERE con.status = 'opt_in' AND con.channel = 'email') as email_opt_ins
        FROM contacts c
        LEFT JOIN events e ON c.id = e.contact_id AND e.owner_id = $1
        LEFT JOIN touches t ON c.id = t.contact_id AND t.owner_id = $1
        LEFT JOIN consents con ON c.id = con.contact_id AND con.owner_id = $1
        WHERE c.owner_id = $1
      `;
      
      const result = await client.query(query, [ownerId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async healthCheck() {
    try {
      const result = await this.pool.query('SELECT 1 as status');
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('CRM health check failed:', error);
      throw error;
    }
  }
}

module.exports = new CRMService();
