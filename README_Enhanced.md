# Enhanced BESS Chat Application

An intelligent Battery Energy Storage System (BESS) consultant application with database-driven recommendations and datasheet analysis.

## New Features

### 🗄️ BESS Datasheet Database
- Upload and parse PDF, DOCX, and TXT datasheets
- AI-powered specification extraction
- Structured database storage for easy comparison

### 🔍 Intelligent BESS Recommendations
- Compare user requirements against database of real BESS systems
- Generate compatibility scores and detailed analysis
- Provide sizing optimization suggestions

### 📊 Advanced Comparison Tools
- Side-by-side system comparison matrix
- Performance analysis and recommendations
- Technical specification validation

## Quick Start

### 1. Environment Setup
Create a `.env` file in the root directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Application
```bash
# Run both frontend and backend together
npm run dev-full

# Or run separately:
# Frontend only: npm run dev
# Backend only: npm run server
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Using the Enhanced Features

### Upload BESS Datasheets
1. Click "📁 Upload BESS Datasheets" button
2. Drag & drop or select PDF/DOCX/TXT files
3. System automatically extracts specifications
4. View processing results and extracted data

### Get BESS Recommendations
1. Complete the chat to generate project requirements
2. Click "🔍 Compare BESS Systems" button
3. View top recommendations with compatibility scores
4. Review detailed analysis and comparison matrix

### Chat with Database Integration
- The AI now has access to your uploaded BESS datasheets
- Ask for recommendations like "What's the best system for my requirements?"
- Get specific comparisons and detailed technical analysis

## Sample Data

Sample BESS datasheets are included in `/sample-datasheets/`:
- Tesla Megapack 2XL (4MW/8MWh)
- BYD Battery-Box C100 (1MW/2.5MWh)  
- Fluence GridStack Pro (10MW/20MWh)

Upload these to test the system functionality.

## API Endpoints

### Chat Integration
- `POST /api/chat` - Enhanced chat with BESS database integration
- Automatically provides recommendations when user requirements are detected

### Datasheet Management
- `POST /api/upload-datasheet` - Upload and process BESS datasheets
- `GET /api/datasheets` - List all processed datasheets
- `DELETE /api/datasheets/:id` - Remove datasheet from database

### Recommendations
- `POST /api/recommendations` - Generate BESS system recommendations
- `POST /api/comparison-matrix` - Create system comparison matrix

### Health Check
- `GET /api/health` - Server and database status

## Database Schema

The SQLite database stores:
- **BESS Datasheets**: Technical specifications, manufacturer info, extracted content
- **Project Requirements**: User requirements and generated recommendations
- **Processing Metadata**: Upload status, errors, and processing results

## Technical Features

### Document Parsing
- **PDF Parsing**: Extracts text from technical datasheets
- **DOCX Support**: Processes Word documents
- **Pattern Matching**: Intelligent specification extraction
- **AI Enhancement**: OpenAI GPT-4 powered specification extraction

### Recommendation Engine
- **Compatibility Scoring**: Multi-factor compatibility analysis
- **Requirement Matching**: Power, energy, duration, and application matching
- **Performance Analysis**: Efficiency, lifecycle, and economic analysis
- **Sizing Optimization**: Multiple system configurations and validation

### Advanced Features
- **Real-time Processing**: Live document parsing and database updates
- **Error Handling**: Comprehensive error tracking and recovery
- **Validation**: Technical specification validation and conflict detection
- **Scalability**: Modular architecture for easy expansion

## Development

### File Structure
```
├── src/                          # React frontend
│   ├── DatasheetUpload.jsx      # File upload interface
│   ├── BESSComparison.jsx       # Recommendations display
│   └── ...
├── database/                     # Database layer
│   ├── BESSDatabase.js          # Database operations
│   └── schema.sql               # Database schema
├── services/                     # Backend services
│   ├── DocumentParser.js        # Document processing
│   └── BESSRecommendationEngine.js # Recommendation logic
├── enhanced-server.js           # Enhanced Express server
└── sample-datasheets/           # Sample data files
```

### Adding New BESS Systems
1. Upload datasheet via the web interface, or
2. Manually add to database using the API, or
3. Bulk import via database scripts

### Customizing Recommendations
- Modify `BESSRecommendationEngine.js` to adjust scoring algorithms
- Update `DocumentParser.js` to add new specification patterns
- Extend database schema for additional fields

## Troubleshooting

### Database Issues
- Database file: `database/bess_database.db`
- Check logs for SQL errors
- Recreate database: Delete `.db` file and restart server

### Upload Problems
- Supported formats: PDF, DOCX, TXT (max 10MB)
- Ensure files contain readable text (not scanned images)
- Check server logs for parsing errors

### API Connection Issues
- Verify `.env` file contains valid OpenAI API key
- Check network connectivity
- Review server console for API errors

## Future Enhancements

- [ ] Excel/CSV datasheet support
- [ ] Advanced filtering and search
- [ ] Economic analysis and ROI calculations
- [ ] Multi-language document support
- [ ] Integration with manufacturer APIs
- [ ] Advanced visualization dashboards
- [ ] Export capabilities (PDF reports, Excel comparisons)

## Support

For issues or questions:
1. Check the console logs (both browser and server)
2. Verify all dependencies are installed
3. Ensure database permissions are correct
4. Test with sample datasheets first