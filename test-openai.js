// Test OpenAI API connection directly
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('🔍 Testing OpenAI API...');
console.log('Key:', OPENAI_API_KEY ? `${OPENAI_API_KEY.substring(0, 20)}...` : 'NOT SET');

async function testOpenAI() {
  try {
    console.log('\n1️⃣ Testing OpenAI API connection...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: 'Hello, just testing the API connection.' }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ OpenAI API success!');
    console.log('Response:', data.choices[0].message.content);
    return true;

  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

testOpenAI().then(success => {
  console.log(success ? '\n🎉 OpenAI API is working!' : '\n💥 OpenAI API test failed');
  process.exit(success ? 0 : 1);
});