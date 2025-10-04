import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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

    const assistantId = process.env.OPENAI_ASSISTANT_ID || 'asst_gkRgQtlA0WWreiRl3y6acyGC';

    // Create optimization prompt from project data
    const optimizationPrompt = `Please optimize this BESS configuration:

PROJECT REQUIREMENTS:
${Object.entries(projectData)
  .filter(([key, value]) => value && value !== '' && value !== 0 && value !== false)
  .map(([key, value]) => `• ${key}: ${value}`)
  .join('\n')}

Please provide a comprehensive optimization analysis with:
1. System Overview (recommended configuration)
2. Technical Specifications (detailed specs)
3. Economic Analysis (cost breakdown, ROI projections)  
4. Implementation Recommendations (next steps)

Format as structured sections with clear headings for easy parsing.`;

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
    
    // Run assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
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

    res.json({
      success: true,
      data: {
        optimization,
        result: optimization, // For compatibility
        sessionId,
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BESS Chat API server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});