-- StackPro Circle Engine Database Schema
-- Compliance-first CRM with AI-powered occasion outreach
-- Created: 2025-08-14

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- CORE CONTACT MANAGEMENT
-- ==========================================

-- Main contacts table with enhanced schema
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  primary_email TEXT,
  primary_phone TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  birthday_date DATE,                  -- nullable until confirmed
  home_close_date DATE,                -- realtor-specific
  relationship_strength SMALLINT DEFAULT 50, -- 0-100 scale
  source TEXT NOT NULL,                -- 'google', 'csv', 'manual'
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT contacts_strength_range CHECK (relationship_strength >= 0 AND relationship_strength <= 100),
  CONSTRAINT contacts_source_valid CHECK (source IN ('google', 'csv', 'manual', 'import', 'api'))
);

-- Create indices for performance and fuzzy search
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(primary_email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(primary_phone);
CREATE INDEX IF NOT EXISTS idx_contacts_birthday ON contacts(birthday_date) WHERE birthday_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING gin(tags);

-- ==========================================
-- CONSENT MANAGEMENT (TCPA/CAN-SPAM COMPLIANCE)
-- ==========================================

-- Consent status enum
CREATE TYPE consent_status AS ENUM ('pending','opt_in','opt_out');

-- Per-channel consent tracking
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','social_dm')),
  status consent_status NOT NULL DEFAULT 'pending',
  proof TEXT,                          -- JSON with consent details
  opt_in_timestamp TIMESTAMPTZ,
  opt_in_source TEXT,                  -- 'web_form','sms','import','manual'
  opt_out_timestamp TIMESTAMPTZ,
  opt_out_reason TEXT,
  last_interaction_at TIMESTAMPTZ,
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint per contact per channel
  UNIQUE (contact_id, channel)
);

-- Indices for consent management
CREATE INDEX IF NOT EXISTS idx_consents_owner_id ON consents(owner_id);
CREATE INDEX IF NOT EXISTS idx_consents_contact_channel ON consents(contact_id, channel);
CREATE INDEX IF NOT EXISTS idx_consents_status ON consents(status);
CREATE INDEX IF NOT EXISTS idx_consents_opt_in_source ON consents(opt_in_source);

-- ==========================================
-- OCCASION & EVENT MANAGEMENT
-- ==========================================

-- Event type enum
CREATE TYPE event_type AS ENUM ('birthday','home_anniversary','holiday','custom','business_anniversary','follow_up');

-- Events/occasions registry
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  event_date DATE NOT NULL,            -- next occurrence if recurring
  original_date DATE,                  -- original date for anniversaries
  recurrence TEXT DEFAULT 'yearly',   -- 'yearly','once','monthly', RFC RRULE optional
  title TEXT,                          -- custom event title
  notes TEXT,
  priority INTEGER DEFAULT 5,         -- 1-10 scale, 10 = highest
  auto_send BOOLEAN DEFAULT false,     -- auto-approve sends for this event
  created_by TEXT DEFAULT 'system',   -- 'system','user','import'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT events_priority_range CHECK (priority >= 1 AND priority <= 10)
);

-- Indices for event management
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_contact_id ON events(contact_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(event_date) WHERE event_date >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_events_priority ON events(priority);

-- ==========================================
-- MESSAGE TRACKING & DELIVERY
-- ==========================================

-- Touch status enum
CREATE TYPE touch_status AS ENUM ('draft','queued','sent','failed','skipped','cancelled','delivered','bounced','opened','clicked','replied');

-- Message touches (sent or drafted)
CREATE TABLE IF NOT EXISTS touches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','social_post','social_dm')),
  template_key TEXT NOT NULL,          -- e.g., 'birthday.ask.sms.v1'
  subject_line TEXT,                   -- for email
  message_content TEXT NOT NULL,
  status touch_status NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Provider response metadata
  meta JSONB DEFAULT '{}',             -- messageId, provider response, etc.
  
  -- Engagement metrics
  metrics JSONB DEFAULT '{}',          -- opens, clicks, replies, etc.
  
  -- Cost tracking
  cost_cents INTEGER DEFAULT 0,       -- cost in cents
  tokens_used INTEGER DEFAULT 0,      -- for AI-generated content
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for touch tracking
CREATE INDEX IF NOT EXISTS idx_touches_owner_id ON touches(owner_id);
CREATE INDEX IF NOT EXISTS idx_touches_contact_id ON touches(contact_id);
CREATE INDEX IF NOT EXISTS idx_touches_event_id ON touches(event_id);
CREATE INDEX IF NOT EXISTS idx_touches_channel ON touches(channel);
CREATE INDEX IF NOT EXISTS idx_touches_status ON touches(status);
CREATE INDEX IF NOT EXISTS idx_touches_scheduled ON touches(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_touches_template ON touches(template_key);

-- ==========================================
-- BRAND KIT & OWNER PREFERENCES
-- ==========================================

-- Owner personalization & guardrails
CREATE TABLE IF NOT EXISTS brand_kit (
  owner_id UUID PRIMARY KEY,
  business_name TEXT NOT NULL,
  tone TEXT DEFAULT 'friendly',       -- 'friendly','professional','playful','casual'
  voice_description TEXT,             -- custom voice guidelines
  allow_emojis BOOLEAN DEFAULT false,
  city TEXT,
  state TEXT,
  signature_block TEXT,
  email_footer TEXT,                   -- includes physical address for CAN-SPAM
  phone_number TEXT,
  website_url TEXT,
  
  -- Compliance settings
  quiet_hours JSONB DEFAULT '{"start":"20:00","end":"08:00","timezone":"America/New_York"}',
  max_touches_per_contact_per_month SMALLINT DEFAULT 3,
  max_touches_per_contact_per_week SMALLINT DEFAULT 1,
  auto_send_enabled BOOLEAN DEFAULT false,
  
  -- AI settings
  ai_creativity INTEGER DEFAULT 5,    -- 1-10 scale for AI creativity
  preferred_models JSONB DEFAULT '["anthropic.claude-3-5-sonnet"]',
  
  -- Feature flags
  features JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT brand_kit_tone_valid CHECK (tone IN ('friendly','professional','playful','casual','custom')),
  CONSTRAINT brand_kit_creativity_range CHECK (ai_creativity >= 1 AND ai_creativity <= 10),
  CONSTRAINT brand_kit_monthly_touches CHECK (max_touches_per_contact_per_month >= 0 AND max_touches_per_contact_per_month <= 20),
  CONSTRAINT brand_kit_weekly_touches CHECK (max_touches_per_contact_per_week >= 0 AND max_touches_per_contact_per_week <= 10)
);

-- Index for brand kit
CREATE INDEX IF NOT EXISTS idx_brand_kit_business_name ON brand_kit(business_name);

-- ==========================================
-- AI PROMPT LIBRARY & TEMPLATES
-- ==========================================

-- AI prompt templates
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID,                       -- NULL for system templates
  key TEXT NOT NULL,                   -- e.g., 'birthday.ask.sms.v1'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,              -- 'birthday','anniversary','follow_up','nurture'
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','social_post','social_dm')),
  version INTEGER DEFAULT 1,
  
  -- Prompt components
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',        -- required variables
  
  -- Output format
  expected_output_format JSONB DEFAULT '{}',
  
  -- Settings
  max_tokens INTEGER DEFAULT 500,
  temperature REAL DEFAULT 0.7,
  
  -- Metadata
  usage_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0.0,
  avg_rating REAL DEFAULT 0.0,
  
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,     -- system vs user-created
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE (key, version),
  CONSTRAINT prompt_temp_rate_range CHECK (success_rate >= 0.0 AND success_rate <= 1.0),
  CONSTRAINT prompt_temp_rating_range CHECK (avg_rating >= 0.0 AND avg_rating <= 5.0)
);

-- Indices for prompt templates
CREATE INDEX IF NOT EXISTS idx_prompt_templates_owner_id ON prompt_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_key ON prompt_templates(key);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_channel ON prompt_templates(channel);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(is_active) WHERE is_active = true;

-- ==========================================
-- SOCIAL MEDIA & EXTERNAL ACCOUNTS
-- ==========================================

-- Connected social accounts
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('facebook','instagram','linkedin','twitter','tiktok')),
  account_type TEXT NOT NULL CHECK (account_type IN ('page','profile','business')),
  handle TEXT NOT NULL,
  display_name TEXT,
  profile_url TEXT,
  
  -- OAuth tokens (encrypted)
  oauth_secret_id TEXT,               -- reference to AWS Secrets Manager
  scopes TEXT[],
  token_expires_at TIMESTAMPTZ,
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'pending',
  
  -- Usage tracking
  posts_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMPTZ,
  
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE (owner_id, provider, handle)
);

-- Indices for social accounts
CREATE INDEX IF NOT EXISTS idx_social_accounts_owner_id ON social_accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON social_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(is_active) WHERE is_active = true;

-- ==========================================
-- EMAIL IDENTITY & CONFIGURATION
-- ==========================================

-- Email sending identities
CREATE TABLE IF NOT EXISTS email_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to_email TEXT,
  
  -- Verification status
  dkim_verified BOOLEAN DEFAULT false,
  spf_verified BOOLEAN DEFAULT false,
  domain_verified BOOLEAN DEFAULT false,
  
  -- AWS SES configuration
  ses_identity_arn TEXT,
  ses_configuration_set TEXT,
  
  -- Alternative SMTP configuration
  smtp_config_secret_id TEXT,         -- reference to AWS Secrets Manager
  
  -- Usage tracking
  emails_sent_count INTEGER DEFAULT 0,
  emails_bounced_count INTEGER DEFAULT 0,
  emails_complained_count INTEGER DEFAULT 0,
  reputation_score REAL DEFAULT 1.0,
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE (owner_id, from_email),
  CONSTRAINT email_ident_reputation_range CHECK (reputation_score >= 0.0 AND reputation_score <= 1.0)
);

-- Indices for email identities
CREATE INDEX IF NOT EXISTS idx_email_identities_owner_id ON email_identities(owner_id);
CREATE INDEX IF NOT EXISTS idx_email_identities_from_email ON email_identities(from_email);
CREATE INDEX IF NOT EXISTS idx_email_identities_default ON email_identities(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_email_identities_active ON email_identities(is_active) WHERE is_active = true;

-- ==========================================
-- COMPLIANCE & AUDIT TRAIL
-- ==========================================

-- Audit log for compliance tracking
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  entity_type TEXT NOT NULL,           -- 'contact','consent','touch','event'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,                -- 'create','update','delete','opt_in','opt_out'
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  performed_by UUID,                   -- user who performed action
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_owner_id ON audit_log(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON audit_log(performed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_log(performed_by);

-- ==========================================
-- SYSTEM CONFIGURATION & FEATURE FLAGS
-- ==========================================

-- System-wide configuration
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,     -- can be read by frontend
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Owner-specific feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  owner_id UUID NOT NULL,
  flag_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  PRIMARY KEY (owner_id, flag_name)
);

-- Index for feature flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_name ON feature_flags(flag_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled) WHERE is_enabled = true;

-- ==========================================
-- SEED DATA & SYSTEM DEFAULTS
-- ==========================================

-- Insert default system prompt templates
INSERT INTO prompt_templates (key, name, description, category, channel, system_prompt, user_prompt_template, variables, is_system) VALUES

-- Birthday Ask SMS Template
('birthday.ask.sms.v1', 'Birthday Ask SMS', 'Compliant SMS template to ask for birthday with opt-in', 'birthday', 'sms', 
'You write concise, sincere texts that never feel salesy. Keep under 160 characters. Always include explicit consent request. Never assume consent exists.',
'Write a text message to {contact_name} from {owner_name} requesting SMS opt-in and asking for their birthday. Use a {tone} tone. Include business context: {business_name} from {city}, {state}. Make it feel personal but professional.',
'["contact_name", "owner_name", "business_name", "city", "state", "tone"]', true),

-- Birthday Collection SMS Template  
('birthday.collect.sms.v1', 'Birthday Collection SMS', 'Follow-up SMS to collect birthday after opt-in', 'birthday', 'sms',
'You write brief, friendly follow-up messages. Be grateful for the opt-in and make the birthday request clear and simple.',
'Write a brief follow-up text thanking {contact_name} for opting in and asking for their birthday month and day (MM/DD format). Keep it under 120 characters.',
'["contact_name"]', true),

-- Birthday Wish SMS Template
('birthday.wish.sms.v1', 'Birthday Wish SMS', 'Birthday greeting SMS message', 'birthday', 'sms',
'You write warm, genuine birthday messages that feel personal. Include the sender name. Keep it brief but heartfelt.',
'Write a warm birthday message to {contact_name} from {owner_name}. Use a {tone} tone. Keep under 120 characters. {emoji_allowed}',
'["contact_name", "owner_name", "tone", "emoji_allowed"]', true),

-- Birthday Email Template
('birthday.wish.email.v1', 'Birthday Wish Email', 'Birthday greeting email with CAN-SPAM compliance', 'birthday', 'email',
'You write warm, professional birthday emails. Include proper email structure with subject and body. Maintain {tone} throughout.',
'Write a birthday email to {contact_name} from {owner_name} at {business_name}. Make it warm but professional. Include a subtle business touch without being salesy.',
'["contact_name", "owner_name", "business_name", "tone"]', true),

-- Home Anniversary Email Template
('home.anniversary.email.v1', 'Home Anniversary Email', 'Home purchase anniversary email for realtors', 'anniversary', 'email',
'You write warm emails celebrating home purchase anniversaries. Focus on the milestone and memories, with a subtle service reminder.',
'Write an email to {contact_name} celebrating the {years} year anniversary of their home purchase at {property_address}. From {owner_name} at {business_name}. Include warm wishes and a subtle offer to help with future real estate needs.',
'["contact_name", "years", "property_address", "owner_name", "business_name"]', true),

-- Social Post Template
('market.post.facebook.v1', 'Market Update Facebook Post', 'Local market update social media post', 'nurture', 'social_post',
'You write engaging social media posts about local real estate markets. Be informative but not salesy. Include local flavor and insights.',
'Write a Facebook post about the {city}, {state} real estate market. Share an interesting insight or trend. Include a gentle call-to-action for homeowners or buyers. Keep it under 200 words with 3-5 relevant hashtags.',
'["city", "state", "business_name"]', true)

ON CONFLICT (key, version) DO NOTHING;

-- Insert default system configuration
INSERT INTO system_config (key, value, description, is_public) VALUES
('circle_engine.enabled', 'true', 'Enable Circle Engine features', true),
('circle_engine.sms_enabled', 'false', 'Enable SMS functionality (requires Pinpoint setup)', false),
('circle_engine.social_enabled', 'false', 'Enable social media posting', false),
('circle_engine.ai_enabled', 'true', 'Enable AI content generation', true),
('circle_engine.default_quiet_hours', '{"start":"20:00","end":"08:00","timezone":"America/New_York"}', 'Default quiet hours for all users', true),
('circle_engine.max_daily_touches_per_owner', '50', 'Maximum daily touches per owner', false),
('circle_engine.ai_cost_limit_daily_cents', '1000', 'Daily AI cost limit in cents per owner', false),
('bedrock.default_model', 'anthropic.claude-3-5-sonnet-20241022-v2:0', 'Default Bedrock model for AI generation', false),
('pinpoint.application_id', '', 'Amazon Pinpoint Application ID', false),
('ses.configuration_set', 'stackpro-circle-engine', 'SES Configuration Set for tracking', false)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for updated_at columns (for change tracking)
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at);
CREATE INDEX IF NOT EXISTS idx_consents_updated_at ON consents(updated_at);
CREATE INDEX IF NOT EXISTS idx_events_updated_at ON events(updated_at);
CREATE INDEX IF NOT EXISTS idx_touches_updated_at ON touches(updated_at);
CREATE INDEX IF NOT EXISTS idx_brand_kit_updated_at ON brand_kit(updated_at);

-- ==========================================
-- TRIGGERS FOR AUDIT LOGGING
-- ==========================================

-- Function to automatically log changes
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log for non-audit tables
  IF TG_TABLE_NAME = 'audit_log' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Insert audit record
  INSERT INTO audit_log (
    owner_id,
    entity_type, 
    entity_id,
    action,
    old_values,
    new_values,
    performed_at
  ) VALUES (
    COALESCE(NEW.owner_id, OLD.owner_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN 'delete'
      WHEN TG_OP = 'UPDATE' THEN 'update'  
      WHEN TG_OP = 'INSERT' THEN 'create'
    END,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) END,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for main tables
DROP TRIGGER IF EXISTS audit_contacts_trigger ON contacts;
CREATE TRIGGER audit_contacts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_consents_trigger ON consents;  
CREATE TRIGGER audit_consents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON consents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_touches_trigger ON touches;
CREATE TRIGGER audit_touches_trigger
  AFTER INSERT OR UPDATE OR DELETE ON touches
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ==========================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ==========================================

-- Function to check if contact can be messaged (respects consent & frequency caps)
CREATE OR REPLACE FUNCTION can_message_contact(
  p_contact_id UUID,
  p_channel TEXT,
  p_owner_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_consent_status consent_status;
  v_brand_settings RECORD;
  v_recent_touches INTEGER;
  v_quiet_hours JSONB;
  v_current_time TIME;
  v_owner_id UUID;
BEGIN
  -- Get owner_id if not provided
  IF p_owner_id IS NULL THEN
    SELECT owner_id INTO v_owner_id FROM contacts WHERE id = p_contact_id;
  ELSE
    v_owner_id := p_owner_id;
  END IF;
  
  -- Check consent status
  SELECT status INTO v_consent_status 
  FROM consents 
  WHERE contact_id = p_contact_id AND channel = p_channel;
  
  IF v_consent_status IS NULL OR v_consent_status != 'opt_in' THEN
    RETURN FALSE;
  END IF;
  
  -- Get brand settings
  SELECT * INTO v_brand_settings FROM brand_kit WHERE owner_id = v_owner_id;
  
  -- Check quiet hours
  v_quiet_hours := COALESCE(v_brand_settings.quiet_hours, '{"start":"20:00","end":"08:00"}'::jsonb);
  v_current_time := CURRENT_TIME;
  
  -- Simple quiet hours check (doesn't handle timezone conversion)
  IF v_current_time >= (v_quiet_hours->>'start')::TIME 
     OR v_current_time <= (v_quiet_hours->>'end')::TIME THEN
    RETURN FALSE;
  END IF;
  
  -- Check monthly frequency cap
  SELECT COUNT(*) INTO v_recent_touches
  FROM touches 
  WHERE contact_id = p_contact_id 
    AND channel = p_channel
    AND status IN ('sent', 'delivered')
    AND sent_at >= (CURRENT_DATE - INTERVAL '30 days');
    
  IF v_recent_touches >= COALESCE(v_brand_settings.max_touches_per_contact_per_month, 3) THEN
    RETURN FALSE;
  END IF;
  
  -- Check weekly frequency cap  
  SELECT COUNT(*) INTO v_recent_touches
  FROM touches 
  WHERE contact_id = p_contact_id 
    AND channel = p_channel
    AND status IN ('sent', 'delivered')
    AND sent_at >= (CURRENT_DATE - INTERVAL '7 days');
    
  IF v_recent_touches >= COALESCE(v_brand_settings.max_touches_per_contact_per_week, 1) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to find upcoming events (for birthday/anniversary scheduling)
CREATE OR REPLACE FUNCTION get_upcoming_events(
  p_owner_id UUID,
  p_days_ahead INTEGER DEFAULT 7,
  p_event_types event_type[] DEFAULT ARRAY['birthday','home_anniversary']::event_type[]
) RETURNS TABLE (
  event_id UUID,
  contact_id UUID,
  contact_name TEXT,
  event_type event_type,
  event_date DATE,
  days_until INTEGER,
  can_email BOOLEAN,
  can_sms BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as event_id,
    e.contact_id,
    c.full_name as contact_name,
    e.type as event_type,
    e.event_date,
    (e.event_date - CURRENT_DATE)::INTEGER as days_until,
    can_message_contact(c.id, 'email', p_owner_id) as can_email,
    can_message_contact(c.id, 'sms', p_owner_id) as can_sms
  FROM events e
  JOIN contacts c ON c.id = e.contact_id
  WHERE e.owner_id = p_owner_id
    AND e.event_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + p_days_ahead)
    AND e.type = ANY(p_event_types)
  ORDER BY e.event_date ASC, c.full_name ASC;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- COMPLETION LOG
-- ==========================================

-- Log the completion of this migration
INSERT INTO system_config (key, value, description, is_public) VALUES 
('circle_engine.schema_version', '"001"', 'Circle Engine database schema version', false),
('circle_engine.schema_created_at', to_jsonb(now()), 'When Circle Engine schema was created', false)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Circle Engine database schema created successfully';
  RAISE NOTICE '📊 Tables created: contacts, consents, events, touches, brand_kit, prompt_templates, social_accounts, email_identities, audit_log, system_config, feature_flags';
  RAISE NOTICE '🔧 Functions created: can_message_contact(), get_upcoming_events()';
  RAISE NOTICE '📝 Audit triggers enabled for compliance tracking';
  RAISE NOTICE '🎯 Ready for Circle Engine backend implementation';
END $$;
