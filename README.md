# BESS RFQ Chat Application

A modern React application for creating Battery Energy Storage System (BESS) requests for quotes through conversational AI.

## Features

- **AI-Powered Chat**: Interactive conversation with BESS specialist
- **Smart Form Population**: Automatic extraction of technical specifications
- **Cloud Database**: Persistent data storage with Supabase
- **Session Management**: Resume conversations across visits
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Frontend (React + Vite)
- Modern React 19 with ES modules
- Real-time form updates from chat conversation
- Floating specification cards
- Session-based user tracking

### Backend (Express API)
- OpenAI GPT-4 integration for chat
- JSON extraction from AI responses
- CORS-enabled for cross-origin requests
- Environment-based configuration

### Database (Supabase PostgreSQL)
- Project data persistence
- Session management
- Analytics and reporting
- Real-time subscriptions support

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   # Supabase Configuration
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # OpenAI API Configuration  
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Run development servers**:
   ```bash
   # Start both frontend and API
   npm run dev-full

   # Or run separately:
   npm run dev    # Frontend only
   npm run api    # Backend API only
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment

### Frontend (Static Files)
The frontend builds to static files that can be hosted on:
- ainfragg.com (current target)
- Netlify, Vercel, or any static hosting
- CDN with custom domain

### Backend API
The Express server can be deployed to:
- Railway, Render, or similar Node.js hosting
- Serverless functions (Vercel, Netlify Functions)
- Traditional VPS or cloud servers

### Database Setup (Supabase)
1. Create a new Supabase project
2. Run the SQL schema (see `docs/database-schema.sql`)
3. Configure Row Level Security (RLS) policies
4. Get your project URL and anon key

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-xxx...` |
| `VITE_API_BASE_URL` | API server URL | `https://api.ainfragg.com` |

## Project Structure

```
src/
├── services/           # API and database services
│   ├── api.js         # Main API service
│   ├── supabase.js    # Database operations
│   └── openai.js      # OpenAI integration
├── components/        # React components
│   ├── ChatWindow.jsx # AI chat interface
│   └── AutoFilledForm.jsx # Dynamic form
├── App.jsx           # Main application
└── main.jsx          # Entry point

api/
└── server.js         # Express API server

public/               # Static assets
```

## Key Features

### Smart Conversation Flow
- Recognizes BESS terminology (MW, MWh, C-rates, chemistry types)
- Validates technical specifications automatically
- Guides users through required information systematically

### Real-time Form Updates
- Form fields populate as you chat
- Visual feedback for extracted information
- Missing field detection and prompts

### Session Persistence
- Conversations saved automatically
- Resume from any device with session ID
- Project data stored in cloud database

### Technical Validation
- Physics-based validation (daily cycles × duration ≤ 24h)
- Industry standard ranges for power, energy, efficiency
- Application-specific recommendations

## API Endpoints

- `POST /api/chat` - Send message to AI assistant
- `POST /api/extract-specs` - Extract specs from text documents
- `POST /api/validate-specs` - Validate technical specifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private project for ainfragg.com