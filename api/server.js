// Simple Express API for hosting on ainfragg.com
// This can be deployed as serverless functions or a simple Node.js server

import express from 'express';
import cors from 'cors';

// Note: Railway provides environment variables directly, no need for dotenv in production

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://ainfragg.com', 
    'https://www.ainfragg.com',
    'https://melodic-zabaione-57cf44.netlify.app',
    'http://localhost:5173', 
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// OpenAI chat endpoint
app.post('/api/chat', async (req, res) => {
  console.log('📨 Chat request received from:', req.headers.origin);
  console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
  
  try {
    const { messages, extractedInfo } = req.body;
    console.log('📝 Messages count:', messages?.length);
    
    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.7
      })
    });

    console.log('🤖 OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const fullReply = data.choices[0].message.content;
    
    // Extract JSON and clean the reply for display
    let extractedFormInfo = null;
    let displayReply = fullReply;
    
    // Try to extract BESS JSON if present
    if (fullReply.includes('===BESS_JSON===')) {
      try {
        const jsonStart = fullReply.indexOf('===BESS_JSON===');
        // Hide everything from ===BESS_JSON=== onwards from the user
        displayReply = fullReply.substring(0, jsonStart).trim();
        
        const jsonString = fullReply.substring(jsonStart + '===BESS_JSON==='.length).trim();
        const jsonMatch = jsonString.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          extractedFormInfo = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // If JSON parsing fails, try to extract from any JSON block in the response
        try {
          const fallbackMatch = fullReply.match(/\{[\s\S]*?"application"[\s\S]*?\}/);
          if (fallbackMatch) {
            extractedFormInfo = JSON.parse(fallbackMatch[0]);
            // Also clean the display message of any JSON blocks
            displayReply = fullReply.replace(/\{[\s\S]*?\}/g, '').replace(/===BESS_JSON===/g, '').trim();
          }
        } catch (e2) {
          console.log('JSON extraction failed:', e2);
        }
      }
    }
    
    res.json({ 
      reply: displayReply,
      extractedInfo: extractedFormInfo
    });
  } catch (error) {
    console.error('💥 Chat API error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      message: `API Error: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Extract specifications from text (for future datasheet uploads)
app.post('/api/extract-specs', async (req, res) => {
  try {
    const { text } = req.body;
    
    const prompt = `Extract BESS specifications from this text and return as JSON:
    {
      "manufacturer": "string",
      "model": "string", 
      "nominal_power_mw": number,
      "nominal_energy_mwh": number,
      "discharge_duration_h": number,
      "chemistry": "string",
      "round_trip_efficiency_pct": number,
      "applications": ["array of applications"]
    }
    
    Text: ${text}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    });

    const data = await response.json();
    const extracted = JSON.parse(data.choices[0].message.content);
    
    res.json({ specifications: extracted });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ error: 'Failed to extract specifications' });
  }
});

// Validate BESS specifications
app.post('/api/validate-specs', async (req, res) => {
  try {
    const { specs } = req.body;
    
    // Simple validation logic
    const validation = {
      valid: true,
      warnings: [],
      errors: []
    };

    // Power-Energy-Duration validation
    if (specs.nominal_power_mw && specs.nominal_energy_mwh) {
      const calculatedDuration = specs.nominal_energy_mwh / specs.nominal_power_mw;
      if (specs.discharge_duration_h && Math.abs(calculatedDuration - specs.discharge_duration_h) > 0.1) {
        validation.warnings.push(`Duration mismatch: ${calculatedDuration.toFixed(1)}h calculated vs ${specs.discharge_duration_h}h specified`);
      }
    }

    // Daily cycling validation
    if (specs.expected_daily_cycles && specs.discharge_duration_h) {
      const dailyHours = specs.expected_daily_cycles * specs.discharge_duration_h;
      if (dailyHours > 24) {
        validation.errors.push(`Impossible cycling: ${dailyHours}h/day exceeds 24 hours`);
        validation.valid = false;
      }
    }

    res.json({ validation });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Failed to validate specifications' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'BESS Chat API',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV
  });
});

// Debug endpoint to check environment variables
app.get('/api/debug', (req, res) => {
  res.json({
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasOpenAIKey2: !!process.env.OPENAI_KEY,
    keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    keyLength2: process.env.OPENAI_KEY ? process.env.OPENAI_KEY.length : 0,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('OPENAI'))
  });
});

// Analytics endpoint (optional)
app.get('/api/stats', (req, res) => {
  // This would typically fetch from Supabase
  res.json({
    message: 'Stats endpoint - integrate with Supabase for real data',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong. Please try again.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BESS API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI Key present: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`🔑 OpenAI Key length: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0}`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
});

export default app;