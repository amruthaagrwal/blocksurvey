-- Blockage Survey Supabase Schema
-- Run this in the Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create tables

-- Respondents table
CREATE TABLE respondents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Demographics
    full_name TEXT NOT NULL,
    employee_id TEXT NOT NULL UNIQUE,
    education_level TEXT,
    stream TEXT,
    course_name TEXT,
    year_of_passing TEXT,
    percentage_cgpa TEXT,
    certifications TEXT,
    current_designation TEXT,
    current_branch TEXT,
    department TEXT,
    experience_at_agarwal TEXT,
    previous_roles TEXT,
    total_experience TEXT,
    previous_designations TEXT,
    key_responsibilities TEXT,
    
    -- Arrays for checkboxes
    languages_known TEXT[],
    computer_skills TEXT[],
    
    -- Assessment Metadata
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    total_score INTEGER,
    
    -- Quality check flags
    quality_flag TEXT DEFAULT 'Good', -- Good, Moderate, Suspicious
    
    -- User ID mapping (if authenticated, though usually respondents are anonymous)
    user_id UUID REFERENCES auth.users(id)
);

-- Responses table (Stores individual question answers)
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    respondent_id UUID NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    answer INTEGER NOT NULL, -- 1 for Yes, 0 for No
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dimension Scores table
CREATE TABLE dimension_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    respondent_id UUID NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
    dimension_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    interpretation TEXT NOT NULL, -- Strength Area, Moderate, Potential Blockage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Sessions tracking for auto-save and incomplete survey tracking
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token TEXT NOT NULL UNIQUE,
    employee_id TEXT, -- Might be null initially
    last_saved_at TIMESTAMPTZ DEFAULT NOW(),
    progress_percentage INTEGER DEFAULT 0,
    state_data JSONB -- Stores the current local storage state
);

-- Admin Logs
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey Settings
CREATE TABLE settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    survey_title TEXT DEFAULT 'Blockage Survey',
    is_active BOOLEAN DEFAULT true,
    announcement_banner TEXT,
    deadline TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (id, survey_title, is_active) 
VALUES ('global_settings', 'Blockage Survey', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Anonymous users (respondents) can read settings
CREATE POLICY "Enable read for public on settings" 
ON settings FOR SELECT 
TO public 
USING (true);

-- Authenticated Users (Admins) can update settings
CREATE POLICY "Enable update for authenticated users on settings" 
ON settings FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Anonymous users (respondents) can insert their own data
CREATE POLICY "Enable insert for anonymous users on respondents" 
ON respondents FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Enable insert for anonymous users on responses" 
ON responses FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Enable insert for anonymous users on dimension_scores" 
ON dimension_scores FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Enable insert, update for public on sessions" 
ON sessions FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- Authenticated Users (Admins) can read all data
CREATE POLICY "Enable read for authenticated users on respondents" 
ON respondents FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable read for authenticated users on responses" 
ON responses FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable read for authenticated users on dimension_scores" 
ON dimension_scores FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable all for authenticated users on admin_logs" 
ON admin_logs FOR ALL 
TO authenticated 
USING (true);

-- Indexes for performance
CREATE INDEX idx_responses_respondent_id ON responses(respondent_id);
CREATE INDEX idx_dimension_scores_respondent_id ON dimension_scores(respondent_id);
CREATE INDEX idx_respondents_employee_id ON respondents(employee_id);
