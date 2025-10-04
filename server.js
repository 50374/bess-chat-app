// BESS Chat API Server - Updated for clean workflow demo
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Database setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database', 'bess_database.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS project_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    nominal_power_mw REAL,
    nominal_energy_mwh REAL,
    discharge_duration_h REAL,
    application TEXT,
    expected_daily_cycles INTEGER,
    delivery_date TEXT,
    incoterms TEXT,
    chemistry_preference TEXT,
    grid_code_compliance TEXT,
    environmental_conditions TEXT,
    certifications_required TEXT,
    recommended_systems TEXT,
    comparison_analysis TEXT,
    extracted_info TEXT
  )`);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Manual CORS handler for troubleshooting
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🔍 Request from origin:', origin);
  console.log('🔍 Request method:', req.method);
  console.log('🔍 Request path:', req.path);
  
  if (origin) {
    const allowedOrigins = [
      'https://ainfragg.com', 
      'https://www.ainfragg.com',
      'https://extraordinary-monstera-e00408.netlify.app',
      'https://development--extraordinary-monstera-e00408.netlify.app',
      'https://melodic-zabaione-57cf44.netlify.app',
      'http://localhost:5173', 
      'http://localhost:5174'
    ];
    
    const deployPreviewPattern = /^https:\/\/deploy-preview-\d+--extraordinary-monstera-e00408\.netlify\.app$/;
    
    if (allowedOrigins.includes(origin) || deployPreviewPattern.test(origin)) {
      console.log('✅ Setting CORS headers for:', origin);
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
  }
  
  if (req.method === 'OPTIONS') {
    console.log('🔧 Handling OPTIONS preflight');
    return res.status(200).end();
  }
  
  next();
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS origin check:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ No origin - allowing');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'https://ainfragg.com', 
      'https://www.ainfragg.com',
      'https://extraordinary-monstera-e00408.netlify.app',
      'https://development--extraordinary-monstera-e00408.netlify.app',
      'https://melodic-zabaione-57cf44.netlify.app',
      'http://localhost:5173', 
      'http://localhost:5174'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin in allowed list:', origin);
      return callback(null, true);
    }
    
    // Check if origin matches Deploy Preview pattern
    const deployPreviewPattern = /^https:\/\/deploy-preview-\d+--extraordinary-monstera-e00408\.netlify\.app$/;
    if (deployPreviewPattern.test(origin)) {
      console.log('✅ Origin matches Deploy Preview pattern:', origin);
      return callback(null, true);
    }
    
    // Reject origin
    console.log('❌ Origin rejected:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BESS Chat API',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Market data endpoint - Real-time statistics from database
app.get('/api/market-data', (req, res) => {
  console.log('📊 Market data request received');
  
  const queries = {
    totalProjects: `SELECT COUNT(*) as count FROM project_requirements WHERE created_date >= datetime('now', '-30 days')`,
    totalCapacity: `SELECT COALESCE(SUM(nominal_power_mw), 0) as total FROM project_requirements WHERE nominal_power_mw IS NOT NULL AND created_date >= datetime('now', '-30 days')`,
    averageDuration: `SELECT COALESCE(AVG(discharge_duration_h), 0) as avg FROM project_requirements WHERE discharge_duration_h IS NOT NULL AND created_date >= datetime('now', '-30 days')`,
    topApplications: `SELECT application, COUNT(*) as count FROM project_requirements WHERE application IS NOT NULL AND application != '' AND created_date >= datetime('now', '-30 days') GROUP BY application ORDER BY count DESC LIMIT 5`,
    regionDistribution: `SELECT 
      CASE 
        WHEN grid_code_compliance LIKE '%IEEE%' THEN 'North America'
        WHEN grid_code_compliance LIKE '%IEC%' THEN 'Europe'
        WHEN grid_code_compliance LIKE '%GB%' THEN 'China'
        ELSE 'Other'
      END as region,
      COUNT(*) as count
      FROM project_requirements 
      WHERE grid_code_compliance IS NOT NULL AND created_date >= datetime('now', '-30 days')
      GROUP BY region`,
    recentActivity: `SELECT COUNT(*) as count FROM project_requirements WHERE created_date >= datetime('now', '-1 hour')`
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.totalProjects, (err, row) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.totalCapacity, (err, row) => {
        if (err) reject(err);
        else resolve(row.total || 0);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.averageDuration, (err, row) => {
        if (err) reject(err);
        else resolve(row.avg || 0);
      });
    }),
    new Promise((resolve, reject) => {
      db.all(queries.topApplications, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.application));
      });
    }),
    new Promise((resolve, reject) => {
      db.all(queries.regionDistribution, (err, rows) => {
        if (err) reject(err);
        else {
          const distribution = {};
          rows.forEach(row => {
            distribution[row.region] = row.count;
          });
          resolve(distribution);
        }
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.recentActivity, (err, row) => {
        if (err) reject(err);
        else resolve(row.count || 0);
      });
    })
  ]).then(([totalProjects, totalCapacityMW, averageDuration, topApplications, regionDistribution, recentActivity]) => {
    const marketData = {
      totalProjects,
      totalCapacityMW: Number(totalCapacityMW.toFixed(1)),
      averageDuration: Number(averageDuration.toFixed(1)),
      topApplications,
      regionDistribution,
      recentActivity,
      lastUpdated: new Date().toISOString(),
      trend: {
        projectsGrowth: Math.random() * 20 - 10, // Simulated growth percentage
        capacityGrowth: Math.random() * 30 - 15,
        demandScore: Math.min(100, Math.max(0, 50 + (totalProjects * 2) + (recentActivity * 10)))
      }
    };

    console.log('📊 Market data compiled:', marketData);
    res.json(marketData);
  }).catch(error => {
    console.error('❌ Market data error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      details: error.message 
    });
  });
});

// OpenAI chat endpoint - using Assistants API
app.post('/api/chat', async (req, res) => {
  console.log('📨 Chat request received from:', req.headers.origin);
  console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
  
  try {
    const { messages, extractedInfo, assistantId, threadId } = req.body;
    console.log('📝 Messages count:', messages?.length);
    console.log('🤖 Assistant ID:', assistantId);
    console.log('🧵 Thread ID:', threadId);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // If using Assistants API
    if (assistantId) {
      try {
        let currentThreadId = threadId;
        
        // Create a new thread only if we don't have one
        if (!currentThreadId) {
          const threadResponse = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({})
          });

          if (!threadResponse.ok) {
            throw new Error(`Failed to create thread: ${threadResponse.status}`);
          }

          const thread = await threadResponse.json();
          currentThreadId = thread.id;
          console.log('🆕 Created new thread:', currentThreadId);
        } else {
          console.log('♻️ Reusing existing thread:', currentThreadId);
        }

        // Add the user's message to the thread
        const userMessage = messages[messages.length - 1]; // Get the latest user message
        await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            role: 'user',
            content: userMessage.content
          })
        });

        // Run the assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            assistant_id: assistantId
          })
        });

        if (!runResponse.ok) {
          throw new Error(`Failed to run assistant: ${runResponse.status}`);
        }

        const run = await runResponse.json();

        // Poll for completion
        let runStatus = run;
        while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${run.id}`, {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          });
          
          runStatus = await statusResponse.json();
        }

        if (runStatus.status !== 'completed') {
          throw new Error(`Assistant run failed with status: ${runStatus.status}`);
        }

        // Get the assistant's response
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        const threadMessages = await messagesResponse.json();
        const assistantMessage = threadMessages.data[0]; // Latest message

        console.log('✅ Assistant response received');
        console.log('📄 Assistant message structure:', JSON.stringify(assistantMessage, null, 2));
        
        // Extract text content safely
        let responseText = '';
        if (assistantMessage && assistantMessage.content && assistantMessage.content[0]) {
          if (assistantMessage.content[0].text && assistantMessage.content[0].text.value) {
            responseText = assistantMessage.content[0].text.value;
          } else {
            responseText = 'Assistant response received but content format is unexpected.';
          }
        } else {
          responseText = 'Assistant response received but no content found.';
        }
        
        res.json({
          success: true,
          data: responseText,
          usage: runStatus.usage,
          threadId: currentThreadId // Return thread ID to frontend
        });      } catch (assistantError) {
        console.error('❌ Assistant API error:', assistantError.message);
        console.log('🔄 Falling back to regular chat completion');
        
        // Fallback to regular chat completions API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-5-mini',
            messages: messages
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Fallback response received');
        
        res.json({
          success: true,
          data: data.choices[0].message.content,
          usage: data.usage
        });
      }

    } else {
      // Fallback to regular chat completions API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: messages
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error Details:', errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ OpenAI response received');
      
      res.json({
        success: true,
        data: data.choices[0].message.content,
        usage: data.usage
      });
    }

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "I'm having trouble connecting right now. Please try again in a moment."
    });
  }
});

// Product recommendation endpoint - using specialized BESS assistant
app.post('/api/product-recommendation', async (req, res) => {
  console.log('🎯 Product recommendation request received');
  
  try {
    const { projectData, projectSummary, sessionId } = req.body;
    console.log('📊 Project data for recommendation:', projectData);
    
    if (!process.env.OPENAI_PRODUCT_ASSISTANT_ID) {
      throw new Error('Product recommendation assistant not configured');
    }

    // Create a focused recommendation prompt
    const recommendationPrompt = `Provide specific BESS product recommendations for this project:

${projectSummary}

Contact Information:
- Company: ${projectData.company_name}
- Email: ${projectData.contact_email}
- Project: ${projectData.project_name}

Please provide detailed product recommendations with exact model numbers, quantities, and configurations.`;

    // Create a new thread for this recommendation (separate from main chat)
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: recommendationPrompt
          }
        ]
      })
    });

    if (!threadResponse.ok) {
      throw new Error(`Failed to create thread: ${threadResponse.status}`);
    }

    const thread = await threadResponse.json();
    console.log('🧵 Created recommendation thread:', thread.id);

    // Run the product recommendation assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: process.env.OPENAI_PRODUCT_ASSISTANT_ID
      })
    });

    if (!runResponse.ok) {
      throw new Error(`Failed to run product assistant: ${runResponse.status}`);
    }

    const run = await runResponse.json();

    // Poll for completion
    let runStatus = run;
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      runStatus = await statusResponse.json();
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Product recommendation failed with status: ${runStatus.status}`);
    }

    // Get the recommendation
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const threadMessages = await messagesResponse.json();
    const recommendationMessage = threadMessages.data[0];

    console.log('✅ Product recommendation received');

    // Extract text content
    const messageContent = recommendationMessage.content[0];
    const recommendation = messageContent.type === 'text' 
      ? messageContent.text.value 
      : 'Unable to generate recommendation';

    res.json({
      success: true,
      data: {
        recommendation,
        sessionId,
        threadId: thread.id
      }
    });

  } catch (error) {
    console.error('❌ Product recommendation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to generate product recommendation. Please try again."
    });
  }
});

// BESS Optimization endpoint - using OpenAI Assistant for secure optimization
app.post('/api/optimization', async (req, res) => {
  console.log('🎯 BESS optimization request received');
  
  try {
    const { projectData, sessionId } = req.body;
    console.log('📊 Project data for optimization:', projectData);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Use the specialized BESS optimization assistant, not the chat assistant
    const assistantId = process.env.OPENAI_OPTIMIZATION_ASSISTANT_ID || 'asst_UbiZGczApr3xadJlGTruMV8J';
    console.log('🎯 Using optimization assistant ID:', assistantId);
    console.log('🔍 Environment variable OPENAI_OPTIMIZATION_ASSISTANT_ID:', process.env.OPENAI_OPTIMIZATION_ASSISTANT_ID);

    // Simple project requirements - let the assistant's system instructions handle the rest
    const optimizationPrompt = `project_power_ac_mw: ${projectData.nominal_power_mw}
project_energy_mwh: ${projectData.nominal_energy_mwh}
duration_hr: ${projectData.discharge_duration_h || (projectData.nominal_energy_mwh / projectData.nominal_power_mw)}
cycles_per_day: ${projectData.expected_daily_cycles}
warranty_years: 20
ambient_temp_range_c: {"min": -20, "max": 40}
overbuild_limit_pct: 15
application: ${projectData.application}
delivery_schedule: ${projectData.delivery_schedule}
incoterms: ${projectData.incoterms}`;

    console.log('🤖 Creating thread for optimization...');
    
    // Create thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    if (!threadResponse.ok) {
      throw new Error(`Failed to create thread: ${threadResponse.status}`);
    }

    const thread = await threadResponse.json();
    console.log('📝 Thread created:', thread.id);

    // Add message to thread
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: optimizationPrompt
      })
    });

    console.log('🚀 Running optimization assistant...');
    
    // Run assistant with JSON response format to get structured BESS configuration
    console.log('🚀 Making API call with assistant_id:', assistantId);
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        response_format: { type: "json_object" }
      })
    });

    if (!runResponse.ok) {
      throw new Error(`Failed to run optimization assistant: ${runResponse.status}`);
    }

    const run = await runResponse.json();
    console.log('⏳ Waiting for optimization completion...');

    // Poll for completion
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 30;

    while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`);
      }
      
      runStatus = await statusResponse.json();
      console.log(`🔄 Status: ${runStatus.status} (attempt ${attempts}/${maxAttempts})`);
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Optimization failed with status: ${runStatus.status}`);
    }

    // Get the optimization results
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.status}`);
    }

    const messages = await messagesResponse.json();
    const optimizationMessage = messages.data.find(msg => msg.role === 'assistant');
    
    if (!optimizationMessage) {
      throw new Error('No optimization response found');
    }

    const messageContent = optimizationMessage.content[0];
    const optimization = messageContent.type === 'text' 
      ? messageContent.text.value 
      : 'Unable to generate optimization';

    console.log('✅ Optimization completed successfully');
    console.log('📋 Final optimization response preview:', optimization.substring(0, 200) + '...');

    res.json({
      success: true,
      data: {
        optimization,
        result: optimization, // For compatibility
        sessionId,
        debugInfo: {
          assistantIdUsed: assistantId,
          threadId: thread.id,
          hasEnvironmentVariable: !!process.env.OPENAI_OPTIMIZATION_ASSISTANT_ID
        },
        threadId: thread.id,
        runId: run.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Optimization error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to optimize BESS configuration. Please try again."
    });
  }
});

// Project submission endpoint (only called when user consents)
app.post('/api/submit-project', async (req, res) => {
  console.log('📋 Project submission requested (user consented)');
  
  try {
    const { projectData, userInfo, recommendation } = req.body;
    
    if (!projectData) {
      return res.status(400).json({ error: 'Project data is required' });
    }
    
    // Save to database only when user explicitly consents
    const projectId = await saveProjectRequirements({
      ...projectData,
      userInfo,
      recommendation
    });
    
    console.log('✅ Project submitted to database with ID:', projectId);
    res.json({ 
      success: true, 
      projectId,
      message: 'Project successfully submitted to database'
    });
    
  } catch (error) {
    console.error('❌ Error submitting project:', error);
    res.status(500).json({ error: 'Failed to submit project' });
  }
});

// Aggregation API endpoints
app.get('/api/aggregation/historical', async (req, res) => {
  console.log('📊 Historical aggregation data requested');
  
  try {
    const { timeframe = '30d' } = req.query;
    
    // Get real data from database
    const realData = await getAggregationData(timeframe);
    
    res.json(realData);
  } catch (error) {
    console.error('❌ Error fetching aggregation data:', error);
    res.status(500).json({ error: 'Failed to fetch aggregation data' });
  }
});

// Current aggregation endpoint
app.get('/api/aggregation/current', async (req, res) => {
  console.log('📊 Current aggregation data requested');
  
  try {
    // Get current aggregation statistics
    const currentData = await getCurrentAggregationData();
    res.json(currentData);
  } catch (error) {
    console.error('❌ Error fetching current aggregation data:', error);
    res.status(500).json({ error: 'Failed to fetch current aggregation data' });
  }
});

// Function to get current aggregation data from database
function getCurrentAggregationData() {
  return new Promise((resolve, reject) => {
    // Get total project counts and statistics
    db.all(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(nominal_power_mw) as total_mw,
        SUM(nominal_energy_mwh) as total_mwh,
        discharge_duration_h,
        COUNT(*) as duration_count
      FROM project_submissions 
      WHERE nominal_power_mw > 0 
      GROUP BY discharge_duration_h
      ORDER BY discharge_duration_h
    `, [], (err, durationRows) => {
      if (err) {
        console.error('Database error:', err);
        reject(err);
        return;
      }

      // Get overall totals
      db.get(`
        SELECT 
          COUNT(*) as total_projects,
          COALESCE(SUM(nominal_power_mw), 0) as total_mw,
          COALESCE(SUM(nominal_energy_mwh), 0) as total_mwh
        FROM project_submissions 
        WHERE nominal_power_mw > 0
      `, [], (err, totals) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
          return;
        }

        // Process duration data
        const durationData = {
          projects_1h: 0,
          projects_2h: 0,
          projects_4h: 0,
          projects_8h: 0
        };

        durationRows.forEach(row => {
          const duration = Math.round(row.discharge_duration_h);
          if (duration === 1) durationData.projects_1h = row.duration_count;
          else if (duration === 2) durationData.projects_2h = row.duration_count;
          else if (duration === 4) durationData.projects_4h = row.duration_count;
          else if (duration === 8) durationData.projects_8h = row.duration_count;
        });

        const currentAggregation = {
          total_projects: totals?.total_projects || 0,
          total_mw: totals?.total_mw || 0,
          total_mwh: totals?.total_mwh || 0,
          current_price_eur_per_kwh: 210, // Base price
          ...durationData,
          pricing_tiers: [
            { capacity_gwh: 0, price_eur_per_kwh: 210 },
            { capacity_gwh: 4, price_eur_per_kwh: 160 },
            { capacity_gwh: 8, price_eur_per_kwh: 105 },
            { capacity_gwh: 12, price_eur_per_kwh: 50 }
          ]
        };

        resolve(currentAggregation);
      });
    });
  });
}

// Function to get real aggregation data from database
function getAggregationData(timeframe) {
  return new Promise((resolve, reject) => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    // Query project submissions over time
    db.all(`
      SELECT 
        DATE(created_date) as date,
        COUNT(*) as project_count,
        AVG(nominal_power_mw) as avg_power,
        AVG(nominal_energy_mwh) as avg_energy,
        AVG(discharge_duration_h) as avg_duration,
        application,
        chemistry_preference
      FROM project_requirements 
      WHERE created_date >= ? 
      GROUP BY DATE(created_date)
      ORDER BY date
    `, [startDate], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Query total statistics
      db.get(`
        SELECT 
          COUNT(*) as total_projects,
          AVG(nominal_power_mw) as avg_power,
          AVG(nominal_energy_mwh) as avg_energy,
          AVG(discharge_duration_h) as avg_duration
        FROM project_requirements 
        WHERE created_date >= ?
      `, [startDate], (err, stats) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Query application distribution
        db.all(`
          SELECT application, COUNT(*) as count
          FROM project_requirements 
          WHERE created_date >= ? AND application IS NOT NULL
          GROUP BY application
        `, [startDate], (err, appData) => {
          if (err) {
            reject(err);
            return;
          }
          
          const aggregationData = {
            timeframe,
            totalProjects: stats?.total_projects || 0,
            trends: {
              capacity: {
                average: stats?.avg_power || 0,
                growth: rows.length > 1 ? ((rows[rows.length-1]?.avg_power - rows[0]?.avg_power) / rows[0]?.avg_power * 100) || 0 : 0,
                data: rows.map(row => ({
                  date: row.date,
                  value: row.avg_power || 0
                }))
              },
              energy: {
                average: stats?.avg_energy || 0,
                growth: rows.length > 1 ? ((rows[rows.length-1]?.avg_energy - rows[0]?.avg_energy) / rows[0]?.avg_energy * 100) || 0 : 0,
                data: rows.map(row => ({
                  date: row.date,
                  value: row.avg_energy || 0
                }))
              },
              duration: {
                average: stats?.avg_duration || 0,
                improvement: rows.length > 1 ? ((rows[rows.length-1]?.avg_duration - rows[0]?.avg_duration) / rows[0]?.avg_duration * 100) || 0 : 0,
                data: rows.map(row => ({
                  date: row.date,
                  value: row.avg_duration || 0
                }))
              },
              projectCount: {
                total: stats?.total_projects || 0,
                data: rows.map(row => ({
                  date: row.date,
                  value: row.project_count || 0
                }))
              }
            },
            applications: appData.reduce((acc, app) => {
              acc[app.application] = app.count;
              return acc;
            }, {}),
            lastUpdated: new Date().toISOString()
          };
          
          resolve(aggregationData);
        });
      });
    });
  });
}

// Function to save project requirements to database
function saveProjectRequirements(extractedInfo) {
  return new Promise((resolve, reject) => {
    // Generate a session ID if not provided
    const sessionId = extractedInfo.sessionId || Date.now().toString();
    
    // Extract relevant fields from the extractedInfo
    const {
      nominalPower,
      nominalEnergy, 
      dischargeDuration,
      application,
      expectedDailyCycles,
      deliveryDate,
      incoterms,
      chemistryPreference,
      gridCodeCompliance,
      environmentalConditions,
      certificationsRequired
    } = extractedInfo;
    
    db.run(`
      INSERT INTO project_requirements (
        session_id, nominal_power_mw, nominal_energy_mwh, discharge_duration_h,
        application, expected_daily_cycles, delivery_date, incoterms,
        chemistry_preference, grid_code_compliance, environmental_conditions,
        certifications_required, extracted_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionId,
      parseFloat(nominalPower) || null,
      parseFloat(nominalEnergy) || null,
      parseFloat(dischargeDuration) || null,
      application || null,
      parseInt(expectedDailyCycles) || null,
      deliveryDate || null,
      incoterms || null,
      chemistryPreference || null,
      gridCodeCompliance || null,
      environmentalConditions || null,
      certificationsRequired || null,
      JSON.stringify(extractedInfo)
    ], function(err) {
      if (err) {
        console.error('❌ Error saving project requirements:', err);
        reject(err);
      } else {
        console.log('✅ Project requirements saved to database, ID:', this.lastID);
        resolve(this.lastID);
      }
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BESS Chat API server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});