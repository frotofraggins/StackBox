/**
 * StackPro Circle Engine Service
 * Compliance-first CRM with AI-powered occasion outreach
 * Integrates with AWS Bedrock for content generation
 */

const { logger } = require('../utils/logger');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const { PinpointClient, SendMessagesCommand } = require('@aws-sdk/client-pinpoint');
const { v4: uuidv4 } = require('uuid');
const { DatabaseService } = require('./database-service');

class CircleEngineService {
  constructor() {
    this.dbService = new DatabaseService();
    this.bedrockClient = new BedrockRuntimeClient({ 
      region: process.env.AWS_REGION || 'us-west-2'
    });
    this.sesClient = new SESv2Client({ 
      region: process.env.AWS_REGION || 'us-west-2'
    });
    this.pinpointClient = new PinpointClient({ 
      region: process.env.AWS_REGION || 'us-west-2'
    });
    this.defaultModel = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  }

  // ==========================================
  // CONTACT MANAGEMENT
  // ==========================================

  async createContact(ownerId, contactData) {
    try {
      const contactId = uuidv4();
      const contact = {
        id: contactId,
        owner_id: ownerId,
        full_name: contactData.fullName,
        primary_email: contactData.email,
        primary_phone: contactData.phone,
        city: contactData.city,
        state: contactData.state,
        postal_code: contactData.postalCode,
        country: contactData.country || 'US',
        birthday_date: contactData.birthdayDate,
        home_close_date: contactData.homeCloseDate,
        relationship_strength: contactData.relationshipStrength || 50,
        source: contactData.source || 'manual',
        tags: contactData.tags || [],
        notes: contactData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.dbService.query(
        `INSERT INTO contacts (
          id, owner_id, full_name, primary_email, primary_phone, 
          city, state, postal_code, country, birthday_date, 
          home_close_date, relationship_strength, source, tags, notes,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          contact.id, contact.owner_id, contact.full_name, contact.primary_email, 
          contact.primary_phone, contact.city, contact.state, contact.postal_code, 
          contact.country, contact.birthday_date, contact.home_close_date, 
          contact.relationship_strength, contact.source, contact.tags, contact.notes,
          contact.created_at, contact.updated_at
        ]
      );

      // Auto-create birthday event if birthday provided
      if (contactData.birthdayDate) {
        await this.createEvent(ownerId, {
          contactId: contactId,
          type: 'birthday',
          eventDate: contactData.birthdayDate,
          recurrence: 'yearly',
          priority: 8,
          createdBy: 'system'
        });
      }

      // Auto-create home anniversary event if home close date provided
      if (contactData.homeCloseDate) {
        await this.createEvent(ownerId, {
          contactId: contactId,
          type: 'home_anniversary',
          eventDate: contactData.homeCloseDate,
          originalDate: contactData.homeCloseDate,
          recurrence: 'yearly',
          priority: 7,
          createdBy: 'system'
        });
      }

      logger.info('✅ Contact created successfully', { 
        contactId, 
        ownerId, 
        name: contact.full_name 
      });

      return contact;
    } catch (error) {
      logger.error('❌ Failed to create contact', { error, ownerId, contactData });
      throw error;
    }
  }

  async getContacts(ownerId, options = {}) {
    try {
      const { limit = 50, offset = 0, search, tags, source } = options;
      
      let query = `
        SELECT c.*, 
               COUNT(e.id) as events_count,
               COUNT(t.id) as touches_count,
               MAX(t.sent_at) as last_touch_at
        FROM contacts c
        LEFT JOIN events e ON e.contact_id = c.id
        LEFT JOIN touches t ON t.contact_id = c.id AND t.status IN ('sent', 'delivered')
        WHERE c.owner_id = $1
      `;
      
      const params = [ownerId];
      let paramIndex = 2;

      if (search) {
        query += ` AND (c.full_name ILIKE $${paramIndex} OR c.primary_email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (tags && tags.length > 0) {
        query += ` AND c.tags && $${paramIndex}`;
        params.push(tags);
        paramIndex++;
      }

      if (source) {
        query += ` AND c.source = $${paramIndex}`;
        params.push(source);
        paramIndex++;
      }

      query += `
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const result = await this.dbService.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('❌ Failed to get contacts', { error, ownerId });
      throw error;
    }
  }

  async updateContact(ownerId, contactId, updates) {
    try {
      const updateFields = [];
      const params = [ownerId, contactId];
      let paramIndex = 3;

      const allowedFields = [
        'full_name', 'primary_email', 'primary_phone', 'city', 'state', 
        'postal_code', 'country', 'birthday_date', 'home_close_date',
        'relationship_strength', 'tags', 'notes'
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = $${paramIndex}`);
      params.push(new Date().toISOString());

      const query = `
        UPDATE contacts 
        SET ${updateFields.join(', ')}
        WHERE owner_id = $1 AND id = $2
        RETURNING *
      `;

      const result = await this.dbService.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error('Contact not found or access denied');
      }

      logger.info('✅ Contact updated successfully', { contactId, ownerId });
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Failed to update contact', { error, ownerId, contactId });
      throw error;
    }
  }

  // ==========================================
  // CONSENT MANAGEMENT
  // ==========================================

  async updateConsent(ownerId, contactId, channel, status, metadata = {}) {
    try {
      const consentData = {
        owner_id: ownerId,
        contact_id: contactId,
        channel: channel,
        status: status,
        proof: JSON.stringify(metadata),
        updated_at: new Date().toISOString()
      };

      if (status === 'opt_in') {
        consentData.opt_in_timestamp = new Date().toISOString();
        consentData.opt_in_source = metadata.source || 'manual';
      } else if (status === 'opt_out') {
        consentData.opt_out_timestamp = new Date().toISOString();
        consentData.opt_out_reason = metadata.reason || 'user_request';
      }

      const query = `
        INSERT INTO consents (
          owner_id, contact_id, channel, status, proof, 
          opt_in_timestamp, opt_in_source, opt_out_timestamp, opt_out_reason,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (contact_id, channel) DO UPDATE SET
          status = EXCLUDED.status,
          proof = EXCLUDED.proof,
          opt_in_timestamp = EXCLUDED.opt_in_timestamp,
          opt_in_source = EXCLUDED.opt_in_source,
          opt_out_timestamp = EXCLUDED.opt_out_timestamp,
          opt_out_reason = EXCLUDED.opt_out_reason,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        consentData.owner_id, consentData.contact_id, consentData.channel, 
        consentData.status, consentData.proof, consentData.opt_in_timestamp,
        consentData.opt_in_source, consentData.opt_out_timestamp, 
        consentData.opt_out_reason, new Date().toISOString(), consentData.updated_at
      ]);

      logger.info('✅ Consent updated successfully', { 
        contactId, 
        channel, 
        status, 
        ownerId 
      });

      return result.rows[0];
    } catch (error) {
      logger.error('❌ Failed to update consent', { error, ownerId, contactId, channel });
      throw error;
    }
  }

  async getContactConsents(ownerId, contactId) {
    try {
      const result = await this.dbService.query(
        `SELECT * FROM consents WHERE owner_id = $1 AND contact_id = $2`,
        [ownerId, contactId]
      );
      return result.rows;
    } catch (error) {
      logger.error('❌ Failed to get contact consents', { error, ownerId, contactId });
      throw error;
    }
  }

  // ==========================================
  // EVENT MANAGEMENT
  // ==========================================

  async createEvent(ownerId, eventData) {
    try {
      const eventId = uuidv4();
      const event = {
        id: eventId,
        owner_id: ownerId,
        contact_id: eventData.contactId,
        type: eventData.type,
        event_date: eventData.eventDate,
        original_date: eventData.originalDate,
        recurrence: eventData.recurrence || 'yearly',
        title: eventData.title,
        notes: eventData.notes,
        priority: eventData.priority || 5,
        auto_send: eventData.autoSend || false,
        created_by: eventData.createdBy || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.dbService.query(
        `INSERT INTO events (
          id, owner_id, contact_id, type, event_date, original_date,
          recurrence, title, notes, priority, auto_send, created_by,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          event.id, event.owner_id, event.contact_id, event.type,
          event.event_date, event.original_date, event.recurrence,
          event.title, event.notes, event.priority, event.auto_send,
          event.created_by, event.created_at, event.updated_at
        ]
      );

      logger.info('✅ Event created successfully', { eventId, ownerId, type: event.type });
      return event;
    } catch (error) {
      logger.error('❌ Failed to create event', { error, ownerId, eventData });
      throw error;
    }
  }

  async getUpcomingEvents(ownerId, daysAhead = 7) {
    try {
      const result = await this.dbService.query(
        `SELECT * FROM get_upcoming_events($1, $2)`,
        [ownerId, daysAhead]
      );
      return result.rows;
    } catch (error) {
      logger.error('❌ Failed to get upcoming events', { error, ownerId, daysAhead });
      throw error;
    }
  }

  // ==========================================
  // AI CONTENT GENERATION
  // ==========================================

  async generateMessage(ownerId, templateKey, variables) {
    try {
      // Get prompt template
      const templateResult = await this.dbService.query(
        `SELECT * FROM prompt_templates 
         WHERE key = $1 AND (owner_id = $2 OR owner_id IS NULL) AND is_active = true
         ORDER BY owner_id NULLS LAST, version DESC
         LIMIT 1`,
        [templateKey, ownerId]
      );

      if (templateResult.rows.length === 0) {
        throw new Error(`Template not found: ${templateKey}`);
      }

      const template = templateResult.rows[0];

      // Get owner brand kit
      const brandResult = await this.dbService.query(
        `SELECT * FROM brand_kit WHERE owner_id = $1`,
        [ownerId]
      );

      let brandKit = null;
      if (brandResult.rows.length > 0) {
        brandKit = brandResult.rows[0];
      }

      // Prepare AI prompt
      let userPrompt = template.user_prompt_template;
      
      // Replace variables in prompt
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        userPrompt = userPrompt.replace(regex, value);
      }

      // Add brand context if available
      if (brandKit) {
        if (brandKit.tone && brandKit.tone !== 'friendly') {
          userPrompt += `\n\nTone: Use a ${brandKit.tone} tone.`;
        }
        if (brandKit.voice_description) {
          userPrompt += `\n\nVoice guidelines: ${brandKit.voice_description}`;
        }
        if (brandKit.allow_emojis) {
          variables.emoji_allowed = 'You may use emojis sparingly when appropriate.';
        } else {
          variables.emoji_allowed = 'Do not use emojis.';
        }
      }

      // Prepare Bedrock request
      const modelId = brandKit?.preferred_models?.[0] || this.defaultModel;
      const requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: template.max_tokens || 500,
        temperature: template.temperature || 0.7,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ],
        system: template.system_prompt
      };

      // Call AWS Bedrock
      const command = new InvokeModelCommand({
        modelId: modelId,
        body: JSON.stringify(requestBody),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      const generatedContent = responseBody.content[0].text;
      const tokensUsed = responseBody.usage?.input_tokens + responseBody.usage?.output_tokens || 0;

      // Update template usage stats
      await this.dbService.query(
        `UPDATE prompt_templates 
         SET usage_count = usage_count + 1, updated_at = now()
         WHERE id = $1`,
        [template.id]
      );

      logger.info('✅ AI message generated successfully', { 
        templateKey, 
        ownerId, 
        tokensUsed,
        modelId 
      });

      return {
        content: generatedContent,
        templateKey: templateKey,
        tokensUsed: tokensUsed,
        modelUsed: modelId,
        variables: variables
      };

    } catch (error) {
      logger.error('❌ Failed to generate AI message', { 
        error, 
        ownerId, 
        templateKey 
      });
      throw error;
    }
  }

  // ==========================================
  // MESSAGE DELIVERY
  // ==========================================

  async sendMessage(ownerId, contactId, channel, content, options = {}) {
    try {
      // Check if contact can be messaged
      const canMessageResult = await this.dbService.query(
        `SELECT can_message_contact($1, $2, $3) as can_message`,
        [contactId, channel, ownerId]
      );

      if (!canMessageResult.rows[0].can_message) {
        throw new Error('Contact cannot be messaged due to consent or frequency limits');
      }

      // Get contact details
      const contactResult = await this.dbService.query(
        `SELECT * FROM contacts WHERE id = $1 AND owner_id = $2`,
        [contactId, ownerId]
      );

      if (contactResult.rows.length === 0) {
        throw new Error('Contact not found');
      }

      const contact = contactResult.rows[0];
      
      // Create touch record
      const touchId = uuidv4();
      const touch = {
        id: touchId,
        owner_id: ownerId,
        contact_id: contactId,
        event_id: options.eventId || null,
        channel: channel,
        template_key: options.templateKey || 'manual',
        subject_line: options.subjectLine,
        message_content: content,
        status: 'queued',
        scheduled_for: options.scheduledFor || new Date().toISOString(),
        cost_cents: options.costCents || 0,
        tokens_used: options.tokensUsed || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.dbService.query(
        `INSERT INTO touches (
          id, owner_id, contact_id, event_id, channel, template_key,
          subject_line, message_content, status, scheduled_for,
          cost_cents, tokens_used, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          touch.id, touch.owner_id, touch.contact_id, touch.event_id,
          touch.channel, touch.template_key, touch.subject_line,
          touch.message_content, touch.status, touch.scheduled_for,
          touch.cost_cents, touch.tokens_used, touch.created_at, touch.updated_at
        ]
      );

      // Send message based on channel
      let deliveryResult;
      if (channel === 'email') {
        deliveryResult = await this.sendEmail(ownerId, contact, touch, options);
      } else if (channel === 'sms') {
        deliveryResult = await this.sendSMS(ownerId, contact, touch, options);
      } else {
        throw new Error(`Unsupported channel: ${channel}`);
      }

      // Update touch with delivery result
      await this.dbService.query(
        `UPDATE touches 
         SET status = $1, sent_at = $2, meta = $3, updated_at = $4
         WHERE id = $5`,
        [
          deliveryResult.success ? 'sent' : 'failed',
          new Date().toISOString(),
          JSON.stringify(deliveryResult.meta || {}),
          new Date().toISOString(),
          touchId
        ]
      );

      logger.info('✅ Message sent successfully', { 
        touchId, 
        contactId, 
        channel, 
        success: deliveryResult.success 
      });

      return {
        touchId: touchId,
        success: deliveryResult.success,
        deliveryResult: deliveryResult
      };

    } catch (error) {
      logger.error('❌ Failed to send message', { 
        error, 
        ownerId, 
        contactId, 
        channel 
      });
      throw error;
    }
  }

  async sendEmail(ownerId, contact, touch, options = {}) {
    try {
      // Get email identity
      const identityResult = await this.dbService.query(
        `SELECT * FROM email_identities 
         WHERE owner_id = $1 AND is_active = true 
         ORDER BY is_default DESC
         LIMIT 1`,
        [ownerId]
      );

      if (identityResult.rows.length === 0) {
        throw new Error('No email identity configured');
      }

      const identity = identityResult.rows[0];

      // Prepare email
      const emailParams = {
        FromEmailAddress: `${identity.from_name} <${identity.from_email}>`,
        ReplyToAddresses: [identity.reply_to_email || identity.from_email],
        Destination: {
          ToAddresses: [contact.primary_email]
        },
        Content: {
          Simple: {
            Subject: {
              Data: touch.subject_line || 'Message from ' + identity.business_name,
              Charset: 'UTF-8'
            },
            Body: {
              Text: {
                Data: touch.message_content,
                Charset: 'UTF-8'
              }
            }
          }
        }
      };

      // Add configuration set if available
      if (identity.ses_configuration_set) {
        emailParams.ConfigurationSetName = identity.ses_configuration_set;
      }

      // Send via SES
      const command = new SendEmailCommand(emailParams);
      const response = await this.sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        meta: {
          provider: 'ses',
          messageId: response.MessageId,
          fromEmail: identity.from_email
        }
      };

    } catch (error) {
      logger.error('❌ Failed to send email', { error, contact: contact.id });
      return {
        success: false,
        error: error.message,
        meta: {
          provider: 'ses',
          error: error.message
        }
      };
    }
  }

  async sendSMS(ownerId, contact, touch, options = {}) {
    try {
      // SMS requires Pinpoint setup - placeholder for now
      logger.warn('SMS sending not yet implemented - requires Pinpoint configuration');
      
      return {
        success: false,
        error: 'SMS not configured',
        meta: {
          provider: 'pinpoint',
          error: 'SMS functionality requires Amazon Pinpoint configuration'
        }
      };
    } catch (error) {
      logger.error('❌ Failed to send SMS', { error, contact: contact.id });
      return {
        success: false,
        error: error.message,
        meta: {
          provider: 'pinpoint',
          error: error.message
        }
      };
    }
  }

  // ==========================================
  // BRAND KIT MANAGEMENT
  // ==========================================

  async updateBrandKit(ownerId, brandData) {
    try {
      // Check if brand kit exists
      const existingResult = await this.dbService.query(
        `SELECT owner_id FROM brand_kit WHERE owner_id = $1`,
        [ownerId]
      );

      const brandKit = {
        owner_id: ownerId,
        business_name: brandData.businessName,
        tone: brandData.tone || 'friendly',
        voice_description: brandData.voiceDescription,
        allow_emojis: brandData.allowEmojis || false,
        city: brandData.city,
        state: brandData.state,
        signature_block: brandData.signatureBlock,
        email_footer: brandData.emailFooter,
        phone_number: brandData.phoneNumber,
        website_url: brandData.websiteUrl,
        quiet_hours: JSON.stringify(brandData.quietHours || {
          start: "20:00",
          end: "08:00",
          timezone: "America/New_York"
        }),
        max_touches_per_contact_per_month: brandData.maxTouchesPerMonth || 3,
        max_touches_per_contact_per_week: brandData.maxTouchesPerWeek || 1,
        auto_send_enabled: brandData.autoSendEnabled || false,
        ai_creativity: brandData.aiCreativity || 5,
        preferred_models: JSON.stringify(brandData.preferredModels || ["anthropic.claude-3-5-sonnet"]),
        features: JSON.stringify(brandData.features || {}),
        updated_at: new Date().toISOString()
      };

      let query;
      let params;

      if (existingResult.rows.length > 0) {
        // Update existing
        query = `
          UPDATE brand_kit SET
            business_name = $2, tone = $3, voice_description = $4, allow_emojis = $5,
            city = $6, state = $7, signature_block = $8, email_footer = $9,
            phone_number = $10, website_url = $11, quiet_hours = $12,
            max_touches_per_contact_per_month = $13, max_touches_per_contact_per_week = $14,
            auto_send_enabled = $15, ai_creativity = $16, preferred_models = $17,
            features = $18, updated_at = $19
          WHERE owner_id = $1
          RETURNING *
        `;
        params = [
          brandKit.owner_id, brandKit.business_name, brandKit.tone, brandKit.voice_description,
          brandKit.allow_emojis, brandKit.city, brandKit.state, brandKit.signature_block,
          brandKit.email_footer, brandKit.phone_number, brandKit.website_url,
          brandKit.quiet_hours, brandKit.max_touches_per_contact_per_month,
          brandKit.max_touches_per_contact_per_week, brandKit.auto_send_enabled,
          brandKit.ai_creativity, brandKit.preferred_models, brandKit.features,
          brandKit.updated_at
        ];
      } else {
        // Insert new
        query = `
          INSERT INTO brand_kit (
            owner_id, business_name, tone, voice_description, allow_emojis,
            city, state, signature_block, email_footer, phone_number, website_url,
            quiet_hours, max_touches_per_contact_per_month, max_touches_per_contact_per_week,
            auto_send_enabled, ai_creativity, preferred_models, features,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          RETURNING *
        `;
        params = [
          brandKit.owner_id, brandKit.business_name, brandKit.tone, brandKit.voice_description,
          brandKit.allow_emojis, brandKit.city, brandKit.state, brandKit.signature_block,
          brandKit.email_footer, brandKit.phone_number, brandKit.website_url,
          brandKit.quiet_hours, brandKit.max_touches_per_contact_per_month,
          brandKit.max_touches_per_contact_per_week, brandKit.auto_send_enabled,
          brandKit.ai_creativity, brandKit.preferred_models, brandKit.features,
          new Date().toISOString(), brandKit.updated_at
        ];
      }

      const result = await this.dbService.query(query, params);

      logger.info('✅ Brand kit updated successfully', { ownerId });
      return result.rows[0];

    } catch (error) {
      logger.error('❌ Failed to update brand kit', { error, ownerId });
      throw error;
    }
  }

  async getBrandKit(ownerId) {
    try {
      const result = await this.dbService.query(
        `SELECT * FROM brand_kit WHERE owner_id = $1`,
        [ownerId]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('❌ Failed to get brand kit', { error, ownerId });
      throw error;
    }
  }

  // ==========================================
  // DASHBOARD & ANALYTICS
  // ==========================================

  async getDashboardStats(ownerId) {
    try {
      const stats = {};

      // Contact stats
      const contactStats = await this.dbService.query(
        `SELECT 
           COUNT(*) as total_contacts,
           COUNT(CASE WHEN birthday_date IS NOT NULL THEN 1 END) as contacts_with_birthdays,
           COUNT(CASE WHEN home_close_date IS NOT NULL THEN 1 END) as contacts_with_home_dates
         FROM contacts WHERE owner_id = $1`,
        [ownerId]
      );
      stats.contacts = contactStats.rows[0];

      // Consent stats
      const consentStats = await this.dbService.query(
        `SELECT 
           channel,
           COUNT(CASE WHEN status = 'opt_in' THEN 1 END) as opted_in,
           COUNT(CASE WHEN status = 'opt_out' THEN 1 END) as opted_out,
           COUNT(*) as total
         FROM consents WHERE owner_id = $1
         GROUP BY channel`,
        [ownerId]
      );
      stats.consents = consentStats.rows;

      // Touch stats (last 30 days)
      const touchStats = await this.dbService.query(
        `SELECT 
           channel,
           COUNT(*) as total_touches,
           COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
           COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
           COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
         FROM touches 
         WHERE owner_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY channel`,
        [ownerId]
      );
      stats.touches = touchStats.rows;

      // Upcoming events (next 14 days)
      const upcomingEvents = await this.dbService.query(
        `SELECT COUNT(*) as upcoming_events
         FROM events 
         WHERE owner_id = $1 
           AND event_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '14 days')`,
        [ownerId]
      );
      stats.upcomingEvents = parseInt(upcomingEvents.rows[0].upcoming_events);

      // AI usage stats (current month)
      const aiStats = await this.dbService.query(
        `SELECT 
           COUNT(*) as ai_messages_generated,
           SUM(tokens_used) as total_tokens_used,
           SUM(cost_cents) as total_cost_cents
         FROM touches 
         WHERE owner_id = $1 
           AND tokens_used > 0 
           AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
        [ownerId]
      );
      stats.ai = aiStats.rows[0];

      return stats;
    } catch (error) {
      logger.error('❌ Failed to get dashboard stats', { error, ownerId });
      throw error;
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  async canMessageContact(contactId, channel, ownerId) {
    try {
      const result = await this.dbService.query(
        `SELECT can_message_contact($1, $2, $3) as can_message`,
        [contactId, channel, ownerId]
      );
      return result.rows[0].can_message;
    } catch (error) {
      logger.error('❌ Failed to check if contact can be messaged', { error, contactId, channel });
      return false;
    }
  }

  async getPromptTemplates(ownerId, options = {}) {
    try {
      const { category, channel, isActive = true } = options;
      
      let query = `
        SELECT * FROM prompt_templates 
        WHERE (owner_id = $1 OR owner_id IS NULL)
      `;
      const params = [ownerId];
      let paramIndex = 2;

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (channel) {
        query += ` AND channel = $${paramIndex}`;
        params.push(channel);
        paramIndex++;
      }

      if (isActive !== null) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(isActive);
        paramIndex++;
      }

      query += ` ORDER BY owner_id NULLS LAST, category, name`;

      const result = await this.dbService.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('❌ Failed to get prompt templates', { error, ownerId });
      throw error;
    }
  }

  async getRecentTouches(ownerId, options = {}) {
    try {
      const { limit = 20, contactId, channel, status } = options;
      
      let query = `
        SELECT t.*, c.full_name as contact_name, e.type as event_type
        FROM touches t
        JOIN contacts c ON c.id = t.contact_id
        LEFT JOIN events e ON e.id = t.event_id
        WHERE t.owner_id = $1
      `;
      const params = [ownerId];
      let paramIndex = 2;

      if (contactId) {
        query += ` AND t.contact_id = $${paramIndex}`;
        params.push(contactId);
        paramIndex++;
      }

      if (channel) {
        query += ` AND t.channel = $${paramIndex}`;
        params.push(channel);
        paramIndex++;
      }

      if (status) {
        query += ` AND t.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await this.dbService.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('❌ Failed to get recent touches', { error, ownerId });
      throw error;
    }
  }
}

module.exports = { CircleEngineService };
