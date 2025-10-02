const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/chat', async (req, res) => {
  console.log('Received request:', req.body);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: req.body.messages
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ reply: 'OpenAI API error: ' + (data.error?.message || 'Unknown error') });
    }
    const reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ reply: 'Error connecting to OpenAI.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});