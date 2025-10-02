-- BESS Datasheets Database Schema

CREATE TABLE IF NOT EXISTS bess_datasheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Technical Specifications
    nominal_power_mw REAL,
    nominal_energy_mwh REAL,
    discharge_duration_h REAL,
    round_trip_efficiency_pct REAL,
    response_time_s REAL,
    
    -- Battery Specifications
    chemistry TEXT,
    cycle_life_cycles INTEGER,
    calendar_life_years INTEGER,
    depth_of_discharge_pct REAL,
    operating_temp_min_c REAL,
    operating_temp_max_c REAL,
    degradation_capacity_fade_pct_per_year REAL,
    
    -- System Configuration
    configuration TEXT,
    enclosure_type TEXT,
    environmental_protection TEXT,
    fire_suppression_system TEXT,
    
    -- Performance Metrics
    c_rate REAL,
    daily_cycles_max INTEGER,
    grid_code_compliance TEXT,
    certifications TEXT,
    
    -- Commercial Information
    application_types TEXT, -- JSON array of suitable applications
    delivery_scope TEXT,
    warranty_years INTEGER,
    
    -- Extracted Content
    full_text_content TEXT,
    extracted_specifications TEXT, -- JSON object with all extracted specs
    
    -- Metadata
    processed BOOLEAN DEFAULT FALSE,
    processing_errors TEXT
);

CREATE INDEX IF NOT EXISTS idx_manufacturer ON bess_datasheets(manufacturer);
CREATE INDEX IF NOT EXISTS idx_model ON bess_datasheets(model);
CREATE INDEX IF NOT EXISTS idx_power_range ON bess_datasheets(nominal_power_mw);
CREATE INDEX IF NOT EXISTS idx_energy_range ON bess_datasheets(nominal_energy_mwh);
CREATE INDEX IF NOT EXISTS idx_chemistry ON bess_datasheets(chemistry);
CREATE INDEX IF NOT EXISTS idx_application_types ON bess_datasheets(application_types);

-- Create a table for storing processed project requirements for comparison
CREATE TABLE IF NOT EXISTS project_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Project Requirements
    nominal_power_mw REAL,
    nominal_energy_mwh REAL,
    discharge_duration_h REAL,
    application TEXT,
    expected_daily_cycles INTEGER,
    delivery_date TEXT,
    incoterms TEXT,
    
    -- Technical Requirements
    chemistry_preference TEXT,
    grid_code_compliance TEXT,
    environmental_conditions TEXT,
    certifications_required TEXT,
    
    -- Generated Recommendations
    recommended_systems TEXT, -- JSON array of recommended BESS systems
    comparison_analysis TEXT,
    
    -- Form Data
    extracted_info TEXT -- JSON of complete form data
);