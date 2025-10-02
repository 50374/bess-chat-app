# BESS Chat App - Cloud Deployment Guide

## 🌐 **Production Architecture**

### **Frontend**: ainfragg.com
- React app built with Vite
- Static files deployed to your domain
- Direct API calls to backend

### **Backend**: Serverless API 
- Simple API endpoints for chat and data storage
- OpenAI integration
- Supabase database integration

### **Database**: Supabase (PostgreSQL)
- BESS project requirements storage
- User sessions and form data
- No complex local database setup

---

## 🚀 **Deployment Steps**

### 1. Supabase Setup
```sql
-- Create projects table
CREATE TABLE bess_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  
  -- Project Requirements
  application TEXT,
  nominal_power_mw DECIMAL,
  nominal_energy_mwh DECIMAL,
  discharge_duration_h DECIMAL,
  expected_daily_cycles INTEGER,
  delivery_schedule TEXT,
  incoterms TEXT,
  
  -- Technical Specs
  chemistry TEXT,
  round_trip_efficiency_pct DECIMAL,
  response_time_s DECIMAL,
  grid_code_compliance TEXT,
  certifications TEXT,
  
  -- Complete form data (JSON)
  form_data JSONB,
  
  -- Chat context
  chat_messages JSONB,
  
  -- Metadata
  user_ip TEXT,
  user_agent TEXT
);

-- Create index for faster queries
CREATE INDEX idx_bess_projects_session ON bess_projects(session_id);
CREATE INDEX idx_bess_projects_created ON bess_projects(created_at);
```

### 2. Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://ainfragg.com/api
OPENAI_API_KEY=your_openai_key
```

### 3. Build for Production
```bash
npm run build
```

### 4. Deploy to ainfragg.com
- Upload `dist/` folder contents to your web hosting
- Configure API routes for backend functions

---

## 📁 **Simplified File Structure**

```
src/
├── components/
│   ├── ChatWindow.jsx          # OpenAI chat integration
│   ├── AutoFilledForm.jsx      # Form with floating cards
│   └── App.jsx                 # Main app component
├── services/
│   ├── supabase.js            # Supabase client
│   ├── openai.js              # OpenAI API calls
│   └── api.js                 # API service layer
├── utils/
│   └── formValidation.js      # Form validation utilities
└── styles/
    └── global.css             # Global styles

api/ (serverless functions)
├── chat.js                    # OpenAI chat endpoint
├── save-project.js            # Save project to Supabase
└── get-projects.js            # Retrieve projects
```

---

## 🔧 **Key Benefits**

✅ **No local database complexity**
✅ **Scalable cloud infrastructure** 
✅ **Professional domain hosting**
✅ **Real-time data persistence**
✅ **Easy maintenance and updates**
✅ **Production-ready security**

---

## 📊 **Data Flow**

1. **User interacts** with chat → OpenAI API
2. **AI extracts specs** → Form auto-populates 
3. **Form submission** → Supabase storage
4. **Session persistence** → User can return later
5. **Analytics ready** → Track usage and conversions