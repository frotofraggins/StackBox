-- StackPro CRM Foundation - Phase 1
-- Multi-industry CRM with onboarding-specific defaults

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for Phase 1
CREATE TYPE consent_status AS ENUM ('pending','opt_in','opt_out');
CREATE TYPE event_type AS ENUM ('birthday','anniversary','milestone','custom');
CREATE TYPE touch_status AS ENUM ('logged','planned','skipped');

-- Main contacts table matching Phase 1 spec exactly
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  industry_profile TEXT NOT NULL, -- matches owner.industry_profile at creation
  full_name TEXT NOT NULL,
  primary_email TEXT,
  primary_phone TEXT,
  city TEXT, 
  state TEXT, 
  postal_code TEXT, 
  country TEXT,
  birthday_date DATE,
  custom_fields JSONB DEFAULT '{}',
  relationship_strength SMALLINT DEFAULT 50,
  source TEXT NOT NULL, -- 'manual', 'csv', 'google'
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consents table for GDPR compliance
CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','social_dm')),
  status consent_status NOT NULL DEFAULT 'pending',
  proof TEXT,
  opt_in_timestamp TIMESTAMPTZ,
  opt_in_source TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (contact_id, channel)
);

-- Events table for birthdays, anniversaries, etc.
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  event_date DATE NOT NULL,
  recurrence TEXT,
  notes TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Touches table for interaction logging
CREATE TABLE touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','call','meeting','note')),
  subject TEXT,
  content TEXT,
  status touch_status NOT NULL DEFAULT 'logged',
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create owners table if not exists and add required columns for Phase 1
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Phase 1 specific columns to owners
ALTER TABLE owners ADD COLUMN IF NOT EXISTS industry_profile TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS brand_kit JSONB DEFAULT '{}';

-- Industry profiles configuration table
CREATE TABLE industry_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  default_tags TEXT[] DEFAULT '{}',
  default_events JSONB DEFAULT '[]',
  extra_fields TEXT[] DEFAULT '{}',
  ai_tone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_contacts_industry_profile ON contacts(industry_profile);
CREATE INDEX idx_contacts_source ON contacts(source);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_birthday ON contacts(birthday_date);

CREATE INDEX idx_consents_owner_id ON consents(owner_id);
CREATE INDEX idx_consents_contact_id ON consents(contact_id);
CREATE INDEX idx_consents_channel ON consents(channel);
CREATE INDEX idx_consents_status ON consents(status);

CREATE INDEX idx_events_owner_id ON events(owner_id);
CREATE INDEX idx_events_contact_id ON events(contact_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_date ON events(event_date);

CREATE INDEX idx_touches_owner_id ON touches(owner_id);
CREATE INDEX idx_touches_contact_id ON touches(contact_id);
CREATE INDEX idx_touches_channel ON touches(channel);
CREATE INDEX idx_touches_status ON touches(status);
CREATE INDEX idx_touches_occurred_at ON touches(occurred_at);

CREATE INDEX idx_owners_industry_profile ON owners(industry_profile);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consents_updated_at BEFORE UPDATE ON consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_touches_updated_at BEFORE UPDATE ON touches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_profiles_updated_at BEFORE UPDATE ON industry_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Phase 1 industry profiles
INSERT INTO industry_profiles (industry_key, display_name, default_tags, default_events, extra_fields, ai_tone) VALUES
('marketing', 'Small Marketing Agencies & Consulting Firms', 
 ARRAY['Lead', 'Client', 'Vendor', 'Media Contact', 'Partner'],
 '[{"name": "Campaign Launch", "type": "milestone"}, {"name": "Contract Renewal", "type": "milestone"}, {"name": "Client Birthday", "type": "birthday"}]',
 ARRAY['Campaign Budget', 'Client Industry'],
 'Professional, solution-focused, empathetic'),

('realtor', 'Realtors & Real Estate Teams',
 ARRAY['Buyer', 'Seller', 'Past Client', 'Referral Partner', 'Lender Contact'],
 '[{"name": "Listing Date", "type": "milestone"}, {"name": "Home Closing Date", "type": "milestone"}, {"name": "Home Anniversary", "type": "anniversary"}]',
 ARRAY['MLS #', 'Property Address', 'Transaction Stage'],
 'Trust-building, friendly, local market expertise'),

('construction', 'Construction Trades & Contractors',
 ARRAY['Prospect', 'Active Job', 'Past Client', 'Subcontractor', 'Supplier'],
 '[{"name": "Project Start", "type": "milestone"}, {"name": "Project Completion", "type": "milestone"}, {"name": "Warranty End", "type": "anniversary"}]',
 ARRAY['Project Type', 'Budget Range', 'Timeline'],
 'Professional, reliable, detail-oriented'),

('insurance', 'Insurance Agents / Mortgage Brokers',
 ARRAY['Lead', 'Client', 'Policy Holder', 'Referral Source', 'Carrier Contact'],
 '[{"name": "Policy Renewal", "type": "anniversary"}, {"name": "Claim Date", "type": "milestone"}, {"name": "Review Date", "type": "milestone"}]',
 ARRAY['Policy Number', 'Coverage Amount', 'Renewal Date'],
 'Trustworthy, consultative, protective'),

('trades', 'Skilled Trades (Electricians, Plumbers, HVAC)',
 ARRAY['Service Call', 'Regular Client', 'Emergency', 'Commercial', 'Residential'],
 '[{"name": "Last Service", "type": "milestone"}, {"name": "Equipment Install Date", "type": "anniversary"}, {"name": "Maintenance Due", "type": "milestone"}]',
 ARRAY['Equipment Type', 'Service History', 'Warranty Info'],
 'Reliable, technical, service-focused'),

('events', 'Event Planners / Creative Studios',
 ARRAY['Client', 'Vendor', 'Venue', 'Past Event', 'Referral'],
 '[{"name": "Event Date", "type": "milestone"}, {"name": "Contract Signed", "type": "milestone"}, {"name": "Follow-up Date", "type": "milestone"}]',
 ARRAY['Event Type', 'Guest Count', 'Budget'],
 'Creative, organized, client-focused'),

('wellness', 'Health & Wellness Practices',
 ARRAY['Patient', 'Referral Source', 'Provider', 'Insurance', 'Vendor'],
 '[{"name": "Last Appointment", "type": "milestone"}, {"name": "Next Checkup", "type": "milestone"}, {"name": "Treatment Anniversary", "type": "anniversary"}]',
 ARRAY['Treatment Type', 'Insurance Info', 'Health Goals'],
 'Caring, professional, health-focused'),

('education', 'Education & Training Providers',
 ARRAY['Student', 'Parent', 'Corporate Client', 'Instructor', 'Partner'],
 '[{"name": "Course Start", "type": "milestone"}, {"name": "Graduation", "type": "milestone"}, {"name": "Renewal Date", "type": "anniversary"}]',
 ARRAY['Course Type', 'Skill Level', 'Certification'],
 'Educational, supportive, growth-oriented')

ON CONFLICT (industry_key) DO NOTHING;

-- Sample data for development (using demo owner)
INSERT INTO owners (id, email, first_name, last_name, company, industry_profile) VALUES
('demo-owner-uuid-phase1-2025', 'demo@stackpro.io', 'Demo', 'User', 'StackPro Demo', 'construction')
ON CONFLICT (email) DO NOTHING;

-- Sample contacts
INSERT INTO contacts (owner_id, industry_profile, full_name, primary_email, primary_phone, city, state, source, tags) VALUES
('demo-owner-uuid-phase1-2025', 'construction', 'John Smith', 'john@example.com', '555-0123', 'Austin', 'TX', 'manual', ARRAY['Prospect']),
('demo-owner-uuid-phase1-2025', 'construction', 'Sarah Johnson', 'sarah@acmecorp.com', '555-0124', 'Austin', 'TX', 'google', ARRAY['Active Job']),
('demo-owner-uuid-phase1-2025', 'construction', 'Mike Wilson', 'mike@wilson.com', '555-0125', 'Austin', 'TX', 'csv', ARRAY['Past Client', 'Referral Source'])
ON CONFLICT DO NOTHING;

-- Sample events
INSERT INTO events (owner_id, contact_id, type, event_date, notes) VALUES
('demo-owner-uuid-phase1-2025', (SELECT id FROM contacts WHERE primary_email = 'john@example.com' LIMIT 1), 'birthday', '1985-03-15', 'Birthday reminder'),
('demo-owner-uuid-phase1-2025', (SELECT id FROM contacts WHERE primary_email = 'sarah@acmecorp.com' LIMIT 1), 'milestone', '2025-09-01', 'Project completion target')
ON CONFLICT DO NOTHING;

-- Sample consents
INSERT INTO consents (owner_id, contact_id, channel, status, opt_in_timestamp, opt_in_source) VALUES
('demo-owner-uuid-phase1-2025', (SELECT id FROM contacts WHERE primary_email = 'john@example.com' LIMIT 1), 'email', 'opt_in', now(), 'signup_form'),
('demo-owner-uuid-phase1-2025', (SELECT id FROM contacts WHERE primary_email = 'sarah@acmecorp.com' LIMIT 1), 'email', 'opt_in', now(), 'manual_entry')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Phase 1 CRM Foundation created successfully! 🎯' as result;
