import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://ainfragg.com', 
    'https://www.ainfragg.com',
    'https://extraordinary-monstera-e00408.netlify.app',
    'https://development--extraordinary-monstera-e00408.netlify.app', // Development preview URL (free deploys)
    'https://melodic-zabaione-57cf44.netlify.app',
    'http://localhost:5173', 
    'http://localhost:5174'
  ],
  credentials: true
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BESS Chat API server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});