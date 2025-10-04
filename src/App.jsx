import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import AutoFilledForm from './AutoFilledForm';
import UltraGradientBackground from './components/UltraGradientBackground';
import AggregationAnalytics from './components/AggregationAnalytics';
import OptimizationResults from './components/OptimizationResults';
import MarketDemandDiagram from './components/MarketDemandDiagram';
import FloatingProjectCards from './components/FloatingProjectCards';
import { apiService } from './services/api.js';

function App() {
  // Core state for the 5-step workflow
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [sessionId] = useState(() => apiService.generateSessionId());
  const [chatMessages, setChatMessages] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [showSubmissionPopup, setShowSubmissionPopup] = useState(false);
  const [requestMissingFields, setRequestMissingFields] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [isOptimizeEnabled, setIsOptimizeEnabled] = useState(false);
  const [projectData, setProjectData] = useState({});

  // Real-time market data fetching
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const result = await apiService.getMarketData();
        if (result.success) {
          setMarketData(result.data);
        } else {
          console.warn('Market data fetch failed, using fallback data');
          setMarketData(result.data); // Fallback data is still provided
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        // Set minimal fallback data
        setMarketData({
          totalProjects: 0,
          totalCapacityMW: 0,
          averageDuration: 0,
          topApplications: ['Grid Services', 'Peak Shaving', 'Renewable Integration'],
          regionDistribution: {},
          recentActivity: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    };
    
    fetchMarketData();
    // Refresh market data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Step 1-2: Chat extracts JSON → Floating cards populate
  const handleExtractInfo = (info) => {
    console.log('📋 Step 2: JSON extracted from chat:', info);
    setExtractedInfo(info);
    setProjectData(prev => ({ ...prev, ...info }));
  };

  // Validate project data and enable optimize button
  const validateProjectData = (data) => {
    const required = ['nominal_power_mw', 'nominal_energy_mwh', 'discharge_duration_h', 'expected_daily_cycles'];
    const hasAllRequired = required.every(field => data[field] && data[field] > 0);
    
    // Logic consistency check: cycles per day should be reasonable
    const dailyCycles = data.expected_daily_cycles;
    const isLogicalCycles = dailyCycles && dailyCycles >= 0.1 && dailyCycles <= 10;
    
    setIsOptimizeEnabled(hasAllRequired && isLogicalCycles);
    return hasAllRequired && isLogicalCycles;
  };

  // Handle project data updates from floating cards
  const handleProjectDataUpdate = (updatedData) => {
    const newData = { ...projectData, ...updatedData };
    setProjectData(newData);
    validateProjectData(newData);
  };

  // Step 3: Optimization request
  const handleOptimizationRequest = async (formData) => {
    console.log('🔧 Step 3: Optimization requested with data:', formData);
    try {
      const result = await apiService.getOptimization(formData, sessionId);
      if (result.success) {
        console.log('✅ Step 4: Optimization results received');
        setOptimizationResults(result.data);
        // Step 4: Show submission popup after successful optimization
        setShowSubmissionPopup(true);
      }
    } catch (error) {
      console.error('❌ Optimization failed:', error);
    }
  };

  // Step 5: User submission to database
  const handleProjectSubmission = async (formData) => {
    console.log('💾 Step 5: Submitting to database:', formData);
    try {
      const result = await apiService.submitForm(formData, sessionId, chatMessages);
      if (result.success) {
        console.log('✅ Database updated, triggering analytics refresh');
        setShowSubmissionPopup(false);
        
        // Immediately refresh market data to reflect the new submission
        const refreshedResult = await apiService.getMarketData();
        if (refreshedResult.success) {
          setMarketData(refreshedResult.data);
        }
        
        alert('Project submitted successfully! Market statistics have been updated.');
      }
    } catch (error) {
      console.error('❌ Submission failed:', error);
      alert('Failed to submit project. Please try again.');
    }
  };

  // Chat message updates
  const handleChatUpdate = (messages) => {
    setChatMessages(messages);
  };

  // Missing fields request handling
  const handleRequestMissingFields = (missingFields) => {
    setRequestMissingFields(missingFields);
  };

  const handleMissingFieldsHandled = () => {
    setRequestMissingFields(null);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh' }}>
      {/* Fixed background with parallax effect */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '120vh',
        zIndex: -1
      }}>
        <UltraGradientBackground
          speed={0.08}
          opacity={1}
          palette={["#0a0f1c", "#1a2332", "#2d1b3e", "#3e2a47"]} 
          quality="med"
          blobs={4}
          bandStrength={0.0}
        />
      </div>
      
      {/* Main Layout: Left Panel (Diagram & Analytics), Center (Chat), Right Panel (Floating Cards) */}
      <div style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        padding: '20px',
        gap: '20px',
        boxSizing: 'border-box'
      }}>
        
        {/* Left Panel: Market Demand Diagram & Statistics */}
        <div style={{
          flex: '0 0 300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <MarketDemandDiagram data={marketData} />
          <AggregationAnalytics data={marketData} realTime={true} />
        </div>

        {/* Center Panel: Chat Window */}
        <div style={{
          flex: '1',
          minWidth: '400px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <ChatWindow
              onExtractInfo={handleExtractInfo}
              onChatUpdate={handleChatUpdate}
              requestMissingFields={requestMissingFields}
              onMissingFieldsHandled={handleMissingFieldsHandled}
              sessionId={sessionId}
            />
          </div>
        </div>

        {/* Right Panel: Floating Project Cards & Optimization */}
        <div style={{
          flex: '0 0 350px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <FloatingProjectCards
            extractedInfo={extractedInfo}
            projectData={projectData}
            onDataUpdate={handleProjectDataUpdate}
            onOptimize={handleOptimizationRequest}
            isOptimizeEnabled={isOptimizeEnabled}
          />
          
          {optimizationResults && (
            <OptimizationResults 
              results={optimizationResults}
              projectRequirements={projectData}
            />
          )}
        </div>
      </div>

      {/* Step 4: Submission Popup */}
      {showSubmissionPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(30px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h2 style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 16px 0'
            }}>
              🎯 Great! Your BESS has been optimized
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              margin: '0 0 24px 0',
              lineHeight: '1.5'
            }}>
              Submit your project to our market aggregation database to:
              <br />• Get matched with other projects
              <br />• Access bulk pricing opportunities  
              <br />• Connect with verified suppliers
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => handleProjectSubmission(extractedInfo)}
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(21, 128, 61, 0.8))',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Submit Project
              </button>
              <button
                onClick={() => setShowSubmissionPopup(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main 3-column layout */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        width: '100vw',
        position: 'relative',
        zIndex: 1
      }}>
        {/* LEFT: Step 1 & 6 - Market Analytics & Database Updates */}
        <div style={{ 
          flex: 1, 
          padding: '4vh 20px 4vh 20px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          minHeight: '100vh'
        }}>
          <div style={{ width: '100%', maxWidth: '350px' }}>
            <AggregationAnalytics sessionId={sessionId} />
          </div>
        </div>
        
        {/* CENTER: Step 1 & 2 - Chat Window with JSON Extraction */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'flex-start', 
          alignItems: 'center',
          minHeight: '100vh',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}>
          {/* Title */}
          <div style={{
            marginBottom: '20px',
            padding: '20px 28px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '900px',
            width: '90%'
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center'
            }}>
              BESS Project Configurator
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '16px',
              textAlign: 'center'
            }}>
              Describe your battery storage project requirements
            </p>
          </div>

          {/* Session indicator */}
          <div style={{
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '15px',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'inline-block'
          }}>
            Session: {sessionId.split('_')[1]}
          </div>
        
          {/* Step 1 & 2: Chat Window */}
          <ChatWindow 
            onInterestDetected={handleExtractInfo} 
            requestMissingFields={requestMissingFields}
            onMissingFieldsHandled={handleMissingFieldsHandled}
            onChatUpdate={handleChatUpdate}
            sessionId={sessionId}
          />

          {/* Step 4: Optimization Results */}
          {optimizationResults && (
            <div style={{ marginTop: '20px', width: '100%', maxWidth: '900px' }}>
              <OptimizationResults optimizationData={optimizationResults} />
            </div>
          )}
        </div>
        
        {/* RIGHT: Step 2 & 3 - Floating Cards & Optimize Button */}
        <div style={{ 
          flex: 1, 
          padding: '4vh 20px 4vh 20px',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          minHeight: '100vh'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            minHeight: '100vh',
            paddingBottom: '40px'
          }}>
            {/* Step 2 & 3: Floating Cards with Optimize Button */}
            {extractedInfo && (
              <AutoFilledForm 
                extractedInfo={extractedInfo} 
                onOptimizationRequest={handleOptimizationRequest}
                onRequestMissingFields={handleRequestMissingFields}
                renderSummaryOnly={true}
                sessionId={sessionId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;