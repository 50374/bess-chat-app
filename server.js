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

// OpenAI chat endpoint
app.post('/api/chat', async (req, res) => {
  console.log('📨 Chat request received from:', req.headers.origin);
  console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
  
  try {
    const { messages, extractedInfo } = req.body;
    console.log('📝 Messages count:', messages?.length);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: messages.filter(msg => msg.role !== 'system'), // Remove system messages from array
        system: messages.find(msg => msg.role === 'system')?.content || 'You are a helpful BESS specialist.'
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

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "I'm having trouble connecting right now. Please try again in a moment."
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BESS Chat API server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});