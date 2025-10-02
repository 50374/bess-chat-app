// import pdfParse from 'pdf-parse';  // Temporarily disabled
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

class DocumentParser {
    constructor() {        
        this.specificationPatterns = {
            // Power specifications
            nominal_power_mw: [
                /(?:nominal\s+power|rated\s+power|power\s+rating)[:\s]*(\d+(?:\.\d+)?)\s*(?:mw|megawatt)/i,
                /power[:\s]*(\d+(?:\.\d+)?)\s*mw/i,
                /(\d+(?:\.\d+)?)\s*mw\s*(?:power|rating)/i
            ],
            
            // Energy specifications
            nominal_energy_mwh: [
                /(?:nominal\s+energy|energy\s+capacity|rated\s+energy)[:\s]*(\d+(?:\.\d+)?)\s*(?:mwh|megawatt.hour)/i,
                /energy[:\s]*(\d+(?:\.\d+)?)\s*mwh/i,
                /(\d+(?:\.\d+)?)\s*mwh\s*(?:energy|capacity)/i
            ],
            
            // Duration
            discharge_duration_h: [
                /(?:discharge\s+duration|duration)[:\s]*(\d+(?:\.\d+)?)\s*(?:h|hour|hr)/i,
                /(\d+(?:\.\d+)?)\s*hour\s*(?:discharge|duration)/i,
                /duration[:\s]*(\d+(?:\.\d+)?)\s*h/i
            ],
            
            // Efficiency
            round_trip_efficiency_pct: [
                /(?:round.trip\s+efficiency|efficiency|rte)[:\s]*(\d+(?:\.\d+)?)\s*%/i,
                /efficiency[:\s]*(\d+(?:\.\d+)?)\s*%/i,
                /(\d+(?:\.\d+)?)\s*%\s*efficiency/i
            ],
            
            // Response time
            response_time_s: [
                /(?:response\s+time)[:\s]*(\d+(?:\.\d+)?)\s*(?:s|sec|second|ms|millisecond)/i,
                /response[:\s]*(?:<|≤|less\s+than\s+)?(\d+(?:\.\d+)?)\s*(?:s|ms)/i
            ],
            
            // Chemistry
            chemistry: [
                /(?:chemistry|technology)[:\s]*(lf?p|lithium\s+iron\s+phosphate|lifepo4)/i,
                /(?:chemistry|technology)[:\s]*(nmc|lithium\s+nickel\s+manganese\s+cobalt)/i,
                /(?:chemistry|technology)[:\s]*(lto|lithium\s+titanate)/i,
                /(?:chemistry|technology)[:\s]*(nca|lithium\s+nickel\s+cobalt\s+aluminum)/i,
                /(lfp|nmc|lto|nca|lithium\s+ion)/i
            ],
            
            // Cycle life
            cycle_life_cycles: [
                /(?:cycle\s+life|cycles)[:\s]*(\d+(?:,\d+)*)\s*(?:cycles?|@)/i,
                /(\d+(?:,\d+)*)\s*cycles?\s*(?:life|warranty)/i
            ],
            
            // Calendar life
            calendar_life_years: [
                /(?:calendar\s+life|design\s+life)[:\s]*(\d+(?:\.\d+)?)\s*years?/i,
                /(\d+(?:\.\d+)?)\s*years?\s*(?:life|lifetime)/i
            ],
            
            // Operating temperature
            operating_temp_min_c: [
                /(?:operating\s+temperature|temperature\s+range)[:\s]*(-?\d+(?:\.\d+)?)(?:\s*°?c)?\s*to/i,
                /temperature[:\s]*(-?\d+(?:\.\d+)?)(?:\s*°?c)?\s*to/i
            ],
            
            operating_temp_max_c: [
                /(?:operating\s+temperature|temperature\s+range)[:\s]*-?\d+(?:\.\d+)?(?:\s*°?c)?\s*to\s*(\d+(?:\.\d+)?)(?:\s*°?c)?/i,
                /temperature[:\s]*-?\d+(?:\.\d+)?(?:\s*°?c)?\s*to\s*(\d+(?:\.\d+)?)(?:\s*°?c)?/i
            ],
            
            // Manufacturer and model
            manufacturer: [
                /(?:manufacturer|company)[:\s]*([a-z\s&]+)/i,
                /(?:made\s+by|by)[:\s]*([a-z\s&]+)/i
            ],
            
            model: [
                /(?:model|type|series)[:\s]*([a-z0-9\-\s]+)/i,
                /(?:system|product)[:\s]*([a-z0-9\-\s]+)/i
            ],
            
            // Configuration
            configuration: [
                /(?:configuration|type)[:\s]*(ac.coupled|dc.coupled|standalone)/i,
                /(ac.coupled|dc.coupled|standalone)/i
            ],
            
            // Certifications
            certifications: [
                /(?:certifications?|standards?)[:\s]*([a-z0-9\s,\-/]+)/i,
                /(iec\s+\d+|ul\s+\d+|ieee\s+\d+|ce|fcc)/i
            ]
        };
    }

    async parseDocument(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        let text = '';

        try {
            if (ext === '.pdf') {
                // For PDF files, we'll use a fallback approach
                // Try to read as text first (works for some PDFs)
                try {
                    text = fs.readFileSync(filePath, 'utf8');
                    // If it contains binary data, it's likely a complex PDF
                    if (text.includes('\x00') || text.includes('%PDF')) {
                        text = `PDF file detected: ${path.basename(filePath)}. Manual specification entry may be required.`;
                    }
                } catch (readError) {
                    // If reading as text fails, provide a basic message
                    text = `PDF file uploaded: ${path.basename(filePath)}. Please provide specifications manually or convert to TXT format.`;
                }
            } else if (ext === '.docx') {
                const result = await mammoth.extractRawText({ path: filePath });
                text = result.value;
            } else if (ext === '.txt') {
                text = fs.readFileSync(filePath, 'utf8');
            } else {
                throw new Error(`Unsupported file type: ${ext}`);
            }

            const specifications = this.extractSpecifications(text);
            
            return {
                full_text_content: text,
                extracted_specifications: specifications,
                processed: true
            };
        } catch (error) {
            console.error('Error parsing document:', error);
            return {
                full_text_content: '',
                extracted_specifications: {},
                processed: false,
                processing_errors: error.message
            };
        }
    }

    extractSpecifications(text) {
        const specifications = {};

        for (const [key, patterns] of Object.entries(this.specificationPatterns)) {
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    let value = match[1];
                    
                    // Clean up the value
                    if (key.includes('_mw') || key.includes('_mwh') || key.includes('_h') || key.includes('_pct') || key.includes('_s')) {
                        // Numeric values
                        value = parseFloat(value.replace(/,/g, ''));
                        if (!isNaN(value)) {
                            specifications[key] = value;
                            break;
                        }
                    } else if (key.includes('cycles')) {
                        // Handle cycle numbers with commas
                        value = parseInt(value.replace(/,/g, ''));
                        if (!isNaN(value)) {
                            specifications[key] = value;
                            break;
                        }
                    } else {
                        // Text values
                        specifications[key] = value.trim();
                        break;
                    }
                }
            }
        }

        // Calculate derived values
        if (specifications.nominal_power_mw && specifications.nominal_energy_mwh) {
            specifications.discharge_duration_h = specifications.nominal_energy_mwh / specifications.nominal_power_mw;
            specifications.c_rate = 1 / specifications.discharge_duration_h;
        }

        // Identify suitable applications based on discharge duration
        if (specifications.discharge_duration_h) {
            const duration = specifications.discharge_duration_h;
            const applications = [];
            
            if (duration <= 1) applications.push('Frequency Regulation');
            if (duration >= 1 && duration <= 4) applications.push('Energy Arbitrage');
            if (duration >= 2 && duration <= 6) applications.push('Peak Shaving');
            if (duration >= 4) applications.push('Backup Power');
            
            specifications.application_types = applications;
        }

        return specifications;
    }

    // Enhanced specification extraction using AI
    async enhanceWithAI(text, openaiApiKey) {
        const prompt = `
        Extract detailed BESS (Battery Energy Storage System) specifications from the following datasheet text. 
        Return a JSON object with the following fields (use null if not found):
        
        {
            "manufacturer": "company name",
            "model": "product model/name",
            "nominal_power_mw": number,
            "nominal_energy_mwh": number, 
            "discharge_duration_h": number,
            "round_trip_efficiency_pct": number,
            "response_time_s": number,
            "chemistry": "LFP|NMC|LTO|NCA",
            "cycle_life_cycles": number,
            "calendar_life_years": number,
            "depth_of_discharge_pct": number,
            "operating_temp_min_c": number,
            "operating_temp_max_c": number,
            "degradation_capacity_fade_pct_per_year": number,
            "configuration": "AC-coupled|DC-coupled|Standalone",
            "enclosure_type": "string",
            "environmental_protection": "IP rating",
            "fire_suppression_system": "string",
            "grid_code_compliance": "standards",
            "certifications": "certification list",
            "delivery_scope": "what's included",
            "warranty_years": number,
            "application_types": ["array of suitable applications"]
        }
        
        Text to analyze:
        ${text.substring(0, 4000)}...
        `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1
                })
            });

            const data = await response.json();
            const aiExtracted = JSON.parse(data.choices[0].message.content);
            
            return aiExtracted;
        } catch (error) {
            console.error('Error enhancing with AI:', error);
            return {};
        }
    }
}

export default DocumentParser;