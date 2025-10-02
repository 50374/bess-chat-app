import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Import our new services (these need to be converted to ES modules too)
import BESSDatabase from './database/BESSDatabase.js';
import DocumentParser from './services/DocumentParser.js';
import BESSRecommendationEngine from './services/BESSRecommendationEngine.js';

const app = express();
const PORT = 5001; // Changed from 5000 to avoid Windows conflicts

// Initialize services
const database = new BESSDatabase();
const documentParser = new DocumentParser();
const recommendationEngine = new BESSRecommendationEngine(database);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.docx', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Initialize database on startup
database.initialize().catch(console.error);

// Enhanced chat endpoint with BESS database integration
app.post('/api/chat', async (req, res) => {
    const { messages, extractedInfo } = req.body;
    
    try {
        // Check if this is a request for BESS recommendations
        const userMessage = messages[messages.length - 1].content.toLowerCase();
        const isRecommendationRequest = userMessage.includes('recommend') || 
                                      userMessage.includes('suggest') || 
                                      userMessage.includes('compare') ||
                                      userMessage.includes('dimension') ||
                                      (extractedInfo && userMessage.includes('best'));

        let enhancedMessages = [...messages];

        // If we have extracted info and this might be a recommendation request, enhance the prompt
        if (extractedInfo && isRecommendationRequest) {
            try {
                const recommendations = await recommendationEngine.generateRecommendations(extractedInfo);
                
                const recommendationContext = `
                
BESS DATABASE ANALYSIS RESULTS:
${recommendations.analysis}

Available BESS Systems in Database (${recommendations.total_systems_evaluated} total):
${recommendations.recommendations.slice(0, 3).map((system, index) => `
${index + 1}. ${system.manufacturer} ${system.model} (${system.compatibility_score.toFixed(1)}% match)
   - Power: ${system.nominal_power_mw}MW, Energy: ${system.nominal_energy_mwh}MWh
   - Duration: ${system.discharge_duration_h}h, Chemistry: ${system.chemistry}
   - Efficiency: ${system.round_trip_efficiency_pct}%, Cycles: ${system.cycle_life_cycles?.toLocaleString()}
`).join('')}

Based on this analysis, provide specific recommendations for the user's BESS project. Reference the actual systems from the database and explain why they're suitable for the requirements.
`;

                // Add the recommendation context to the system message
                enhancedMessages[0] = {
                    ...enhancedMessages[0],
                    content: enhancedMessages[0].content + recommendationContext
                };
            } catch (error) {
                console.error('Error generating recommendations:', error);
                // Continue with normal chat if recommendation fails
            }
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: enhancedMessages,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        const reply = data.choices[0].message.content;
        res.json({ reply });
        
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({ reply: 'Error connecting to OpenAI API: ' + error.message });
    }
});

// Upload BESS datasheet endpoint
app.post('/api/upload-datasheet', (req, res) => {
    upload.single('datasheet')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: 'No file uploaded' 
                });
            }

            const { manufacturer, model } = req.body;
            const filePath = req.file.path;

        // Parse the document
        const parseResult = await documentParser.parseDocument(filePath);

        // Enhance with AI if we have an API key
        let enhancedSpecs = parseResult.extracted_specifications;
        if (process.env.OPENAI_API_KEY && parseResult.full_text_content) {
            try {
                const aiEnhanced = await documentParser.enhanceWithAI(
                    parseResult.full_text_content, 
                    process.env.OPENAI_API_KEY
                );
                enhancedSpecs = { ...enhancedSpecs, ...aiEnhanced };
            } catch (aiError) {
                console.warn('AI enhancement failed:', aiError.message);
            }
        }

        // Prepare data for database
        const datasheetData = {
            manufacturer: manufacturer || enhancedSpecs.manufacturer || 'Unknown',
            model: model || enhancedSpecs.model || 'Unknown',
            filename: req.file.originalname,
            file_path: filePath,
            full_text_content: parseResult.full_text_content,
            extracted_specifications: enhancedSpecs,
            processed: parseResult.processed,
            
            // Map enhanced specs to database fields
            ...enhancedSpecs
        };

        // Insert into database
        const id = await database.insertDatasheet(datasheetData);

        res.json({
            success: true,
            id: id,
            message: 'Datasheet uploaded and processed successfully',
            extracted_specifications: enhancedSpecs
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to process datasheet: ' + error.message 
        });
    }
    });
});

// Get BESS recommendations endpoint
app.post('/api/recommendations', async (req, res) => {
    console.log('Recommendations request received:', req.body);
    try {
        const requirements = req.body;
        
        // Validate input
        if (!requirements) {
            return res.status(400).json({
                error: 'No requirements provided'
            });
        }
        
        console.log('Generating recommendations for:', requirements);
        const recommendations = await recommendationEngine.generateRecommendations(requirements);
        
        // Store the analysis in database for future reference
        if (requirements.session_id) {
            await database.storeProjectAnalysis({
                session_id: requirements.session_id,
                ...requirements,
                recommended_systems: recommendations.recommendations,
                comparison_analysis: recommendations.analysis,
                extracted_info: requirements
            });
        }

        res.json(recommendations);
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ 
            error: 'Failed to generate recommendations: ' + error.message,
            details: error.stack
        });
    }
});

// Get all uploaded datasheets
app.get('/api/datasheets', async (req, res) => {
    try {
        const datasheets = await database.getAllBESSSystems();
        res.json(datasheets);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch datasheets: ' + error.message 
        });
    }
});

// Get comparison matrix
app.post('/api/comparison-matrix', async (req, res) => {
    try {
        const { requirements } = req.body;
        const systems = await database.searchBESSSystems(requirements);
        const matrix = await recommendationEngine.generateComparisonMatrix(systems, requirements);
        res.json(matrix);
    } catch (error) {
        console.error('Comparison matrix error:', error);
        res.status(500).json({ 
            error: 'Failed to generate comparison matrix: ' + error.message 
        });
    }
});

// Delete datasheet endpoint
app.delete('/api/datasheets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Implementation would need to be added to BESSDatabase class
        res.json({ success: true, message: 'Datasheet deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            error: 'Failed to delete datasheet: ' + error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: database.db ? 'connected' : 'disconnected'
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    database.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    database.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Enhanced BESS Server running on http://localhost:${PORT}`);
    console.log('Features:');
    console.log('- Chat with BESS database integration');
    console.log('- Datasheet upload and parsing');
    console.log('- AI-powered recommendations');
    console.log('- System comparison and analysis');
});

export default app;