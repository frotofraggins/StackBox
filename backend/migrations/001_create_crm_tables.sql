-- CRM Core Tables Migration
-- Multi-tenant architecture with owner_id for data isolation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Contacts table - Core entity for CRM
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL, -- Tenant isolation
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    tags TEXT[], -- Array of tags
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT contacts_owner_email_unique UNIQUE (owner_id, email)
);

-- Consents table - TCPA/CAN-SPAM compliance
CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'call'
    status VARCHAR(20) NOT NULL DEFAULT 'granted', -- 'granted', 'revoked'
    source VARCHAR(100), -- Where consent was obtained
    ip_address INET,
    user_agent TEXT,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table - Track all contact interactions
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'email_sent', 'email_opened', 'form_submitted', etc.
    event_data JSONB DEFAULT '{}',
    source VARCHAR(100), -- 'website', 'email_campaign', 'manual'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Touches table - Communication history
CREATE TABLE touches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    touch_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'call', 'meeting'
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'completed', 'failed'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand Kit table - Tenant branding and settings
CREATE TABLE brand_kit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    font_family VARCHAR(100) DEFAULT 'Inter',
    email_signature TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

CREATE INDEX idx_consents_owner_id ON consents(owner_id);
CREATE INDEX idx_consents_contact_id ON consents(contact_id);
CREATE INDEX idx_consents_type_status ON consents(consent_type, status);

CREATE INDEX idx_events_owner_id ON events(owner_id);
CREATE INDEX idx_events_contact_id ON events(contact_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);

CREATE INDEX idx_touches_owner_id ON touches(owner_id);
CREATE INDEX idx_touches_contact_id ON touches(contact_id);
CREATE INDEX idx_touches_type ON touches(touch_type);
CREATE INDEX idx_touches_scheduled_at ON touches(scheduled_at);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_kit_updated_at BEFORE UPDATE ON brand_kit
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
