-- Supabase Database Schema for BESS Chat Application
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create the main projects table
CREATE TABLE bess_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User identification
    user_ip TEXT,
    
    -- Basic project specifications
    application TEXT,
    configuration TEXT,
    delivery_scope TEXT,
    
    -- Power and energy specifications
    nominal_power_mw DECIMAL,
    nominal_energy_mwh DECIMAL,
    discharge_duration_h DECIMAL,
    expected_daily_cycles DECIMAL,
    
    -- Performance specifications
    round_trip_efficiency_pct DECIMAL,
    response_time_s DECIMAL,
    grid_code_compliance TEXT,
    
    -- Technical specifications
    chemistry TEXT,
    cycle_life_cycles_at_dod TEXT,
    calendar_life_years INTEGER,
    operating_temperature_range_c TEXT,
    degradation_capacity_fade_pct_per_year DECIMAL,
    
    -- Safety and environmental
    certifications TEXT,
    bms_capabilities TEXT,
    fire_suppression_system TEXT,
    thermal_runaway_prevention TEXT,
    enclosure_type TEXT,
    environmental_protection TEXT,
    
    -- Grid integration
    ems_scada_protocols TEXT,
    black_start_capability BOOLEAN DEFAULT FALSE,
    
    -- Commercial terms
    performance_warranty TEXT,
    availability_guarantee_pct DECIMAL,
    service_om_package TEXT,
    end_of_life_recycling TEXT,
    delivery_schedule TEXT,
    price_breakdown TEXT,
    payment_terms TEXT,
    incoterms TEXT,
    
    -- Contact information
    company_name TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    project_location TEXT,
    
    -- Additional fields
    supplier_references TEXT,
    assumptions TEXT,
    open_questions TEXT,
    
    -- System fields
    form_data JSONB,
    chat_messages JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft' -- draft, submitted, reviewed, quoted
);

-- Create an index for better performance
CREATE INDEX idx_bess_projects_session_id ON bess_projects(session_id);
CREATE INDEX idx_bess_projects_created_at ON bess_projects(created_at);
CREATE INDEX idx_bess_projects_status ON bess_projects(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bess_projects_updated_at
    BEFORE UPDATE ON bess_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE bess_projects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- You can modify this based on your security requirements
CREATE POLICY "Allow all operations for everyone" ON bess_projects
    FOR ALL USING (true);

-- Optional: Create a view for submitted projects only
CREATE VIEW submitted_projects AS
SELECT 
    id,
    session_id,
    created_at,
    submitted_at,
    company_name,
    contact_person,
    email,
    application,
    nominal_power_mw,
    nominal_energy_mwh,
    discharge_duration_h,
    delivery_schedule,
    incoterms,
    status
FROM bess_projects
WHERE submitted_at IS NOT NULL
ORDER BY submitted_at DESC;

-- Create an analytics view for dashboard purposes
CREATE VIEW project_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_projects,
    COUNT(CASE WHEN submitted_at IS NOT NULL THEN 1 END) as submitted_projects,
    AVG(nominal_power_mw) as avg_power_mw,
    MODE() WITHIN GROUP (ORDER BY application) as popular_application,
    MODE() WITHIN GROUP (ORDER BY chemistry) as popular_chemistry
FROM bess_projects
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;