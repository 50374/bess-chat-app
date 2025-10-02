import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { verbose } = sqlite3;

class BESSDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, 'bess_database.db');
        this.db = new (verbose().Database)(this.dbPath);
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                console.log('Connected to SQLite database');
                this.createTables().then(resolve).catch(reject);
            } else {
                reject(new Error('Database connection failed'));
            }
        });
    }

    async createTables() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error creating tables:', err);
                    reject(err);
                } else {
                    console.log('Database tables created successfully');
                    resolve();
                }
            });
        });
    }

    // Insert a new BESS datasheet
    async insertDatasheet(datasheetData) {
        const query = `
            INSERT INTO bess_datasheets (
                manufacturer, model, filename, file_path, 
                nominal_power_mw, nominal_energy_mwh, discharge_duration_h,
                round_trip_efficiency_pct, response_time_s, chemistry,
                cycle_life_cycles, calendar_life_years, depth_of_discharge_pct,
                operating_temp_min_c, operating_temp_max_c, degradation_capacity_fade_pct_per_year,
                configuration, enclosure_type, environmental_protection, fire_suppression_system,
                c_rate, daily_cycles_max, grid_code_compliance, certifications,
                application_types, delivery_scope, warranty_years,
                full_text_content, extracted_specifications, processed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            this.db.run(query, [
                datasheetData.manufacturer,
                datasheetData.model,
                datasheetData.filename,
                datasheetData.file_path,
                datasheetData.nominal_power_mw,
                datasheetData.nominal_energy_mwh,
                datasheetData.discharge_duration_h,
                datasheetData.round_trip_efficiency_pct,
                datasheetData.response_time_s,
                datasheetData.chemistry,
                datasheetData.cycle_life_cycles,
                datasheetData.calendar_life_years,
                datasheetData.depth_of_discharge_pct,
                datasheetData.operating_temp_min_c,
                datasheetData.operating_temp_max_c,
                datasheetData.degradation_capacity_fade_pct_per_year,
                datasheetData.configuration,
                datasheetData.enclosure_type,
                datasheetData.environmental_protection,
                datasheetData.fire_suppression_system,
                datasheetData.c_rate,
                datasheetData.daily_cycles_max,
                datasheetData.grid_code_compliance,
                datasheetData.certifications,
                JSON.stringify(datasheetData.application_types),
                datasheetData.delivery_scope,
                datasheetData.warranty_years,
                datasheetData.full_text_content,
                JSON.stringify(datasheetData.extracted_specifications),
                datasheetData.processed || false
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Search for BESS systems based on requirements
    async searchBESSSystems(requirements) {
        let query = 'SELECT * FROM bess_datasheets WHERE processed = 1';
        let params = [];

        // Add filtering based on requirements
        if (requirements.nominal_power_mw) {
            query += ' AND nominal_power_mw >= ? AND nominal_power_mw <= ?';
            params.push(requirements.nominal_power_mw * 0.8); // Allow 20% tolerance
            params.push(requirements.nominal_power_mw * 1.2);
        }

        if (requirements.nominal_energy_mwh) {
            query += ' AND nominal_energy_mwh >= ? AND nominal_energy_mwh <= ?';
            params.push(requirements.nominal_energy_mwh * 0.8);
            params.push(requirements.nominal_energy_mwh * 1.2);
        }

        if (requirements.chemistry) {
            query += ' AND chemistry LIKE ?';
            params.push(`%${requirements.chemistry}%`);
        }

        if (requirements.application) {
            query += ' AND application_types LIKE ?';
            params.push(`%${requirements.application}%`);
        }

        query += ' ORDER BY ABS(nominal_power_mw - ?) + ABS(nominal_energy_mwh - ?) LIMIT 10';
        params.push(requirements.nominal_power_mw || 0);
        params.push(requirements.nominal_energy_mwh || 0);

        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get all BESS systems for comparison
    async getAllBESSSystems() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM bess_datasheets WHERE processed = 1', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Store project requirements and recommendations
    async storeProjectAnalysis(projectData) {
        const query = `
            INSERT INTO project_requirements (
                session_id, nominal_power_mw, nominal_energy_mwh, discharge_duration_h,
                application, expected_daily_cycles, delivery_date, incoterms,
                chemistry_preference, grid_code_compliance, environmental_conditions,
                certifications_required, recommended_systems, comparison_analysis, extracted_info
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            this.db.run(query, [
                projectData.session_id,
                projectData.nominal_power_mw,
                projectData.nominal_energy_mwh,
                projectData.discharge_duration_h,
                projectData.application,
                projectData.expected_daily_cycles,
                projectData.delivery_date,
                projectData.incoterms,
                projectData.chemistry_preference,
                projectData.grid_code_compliance,
                projectData.environmental_conditions,
                projectData.certifications_required,
                JSON.stringify(projectData.recommended_systems),
                projectData.comparison_analysis,
                JSON.stringify(projectData.extracted_info)
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // Update datasheet processing status
    async updateProcessingStatus(id, processed, errors = null) {
        const query = 'UPDATE bess_datasheets SET processed = ?, processing_errors = ? WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            this.db.run(query, [processed, errors, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

export default BESSDatabase;