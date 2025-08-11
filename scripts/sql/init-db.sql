-- StackPro Development Database Initialization
-- This script sets up the basic database structure for local development

-- Create database if not exists (handled by Docker environment)
-- CREATE DATABASE IF NOT EXISTS stackpro_dev;

-- Create additional databases for testing
CREATE DATABASE stackpro_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE stackpro_dev TO stackpro;
GRANT ALL PRIVILEGES ON DATABASE stackpro_test TO stackpro;

-- Connect to the main database
\c stackpro_dev;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic tables for local development
-- (Note: In production, these will be managed by Amplify/GraphQL)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content JSONB,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, slug)
);

CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    config JSONB,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_pages_project_id ON pages(project_id);
CREATE INDEX idx_components_page_id ON components(page_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Insert sample data for development
INSERT INTO users (email, username, password_hash, first_name, last_name) VALUES
('admin@stackpro.local', 'admin', crypt('admin123', gen_salt('bf')), 'Admin', 'User'),
('test@stackpro.local', 'testuser', crypt('test123', gen_salt('bf')), 'Test', 'User')
ON CONFLICT (email) DO NOTHING;

-- Insert sample project
INSERT INTO projects (user_id, name, description, domain) 
SELECT id, 'Sample Website', 'A sample website project', 'sample.local'
FROM users WHERE email = 'admin@stackpro.local'
ON CONFLICT DO NOTHING;

-- Insert sample page
INSERT INTO pages (project_id, name, slug, content, is_published)
SELECT p.id, 'Home Page', 'home', '{"title": "Welcome to StackPro", "content": "Your website builder"}', true
FROM projects p 
JOIN users u ON p.user_id = u.id 
WHERE u.email = 'admin@stackpro.local'
ON CONFLICT DO NOTHING;

COMMIT;
