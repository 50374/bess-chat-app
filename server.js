const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages
      })
    });
    const data = await response.json();
    const reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ reply: 'Error connecting to OpenAI.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});