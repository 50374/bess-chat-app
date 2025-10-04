import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import AutoFilledForm from './AutoFilledForm';
import UltraGradientBackground from './components/UltraGradientBackground';
import AggregationAnalytics from './components/AggregationAnalytics';
import OptimizationResults from './components/OptimizationResults';
import { apiService } from './services/api.js';

function App() {
  // Core state for the 6-step workflow
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [sessionId] = useState(() => apiService.generateSessionId());
  const [chatMessages, setChatMessages] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [showSubmissionPopup, setShowSubmissionPopup] = useState(false);
  const [requestMissingFields, setRequestMissingFields] = useState(null);

  // Step 1-2: Chat extracts JSON → Floating cards populate
  const handleExtractInfo = (info) => {
    console.log('📋 Step 2: JSON extracted from chat:', info);
    setExtractedInfo(info);
  };

  // Step 3: Optimization request
  const handleOptimizationRequest = async (formData) => {
    console.log('🔧 Step 3: Optimization requested with data:', formData);
    try {
      const result = await apiService.getOptimization(formData, sessionId);
      if (result.success) {
        console.log('✅ Step 4: Optimization results received');
        setOptimizationResults(result.data);
        // Step 5: Show submission popup after successful optimization
        setShowSubmissionPopup(true);
      }
    } catch (error) {
      console.error('❌ Optimization failed:', error);
    }
  };

  // Step 5: User submission to database
  const handleProjectSubmission = async (formData) => {
    console.log('� Step 5: Submitting to database:', formData);
    try {
      const result = await apiService.submitForm(formData, sessionId, chatMessages);
      if (result.success) {
        console.log('✅ Step 6: Database updated, triggering analytics refresh');
        // Step 6: Database update triggers analytics refresh (handled by AggregationAnalytics)
        setShowSubmissionPopup(false);
        alert('Project submitted successfully!');
      }
    } catch (error) {
      console.error('❌ Submission failed:', error);
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
        console.log('🔍 Requesting product recommendation...');
        const recommendationResult = await apiService.getProductRecommendation(formData, sessionId);
        
        if (recommendationResult.success) {
          // Display the recommendation directly in the chat as an assistant message
          const recommendationMessage = {
            role: 'assistant', 
            content: `## 🎯 BESS Product Recommendation\n\n${recommendationResult.data.recommendation}`
          };
          
          setChatMessages(prev => [...prev, recommendationMessage]);
        } else {
          console.error('Failed to get product recommendation:', recommendationResult.error);
        }
        
      } else {
        console.error('❌ Form submission failed:', result);
        alert(`❌ ${result.message || 'There was an error saving your form. Please try again.'}`);
      }
    } catch (error) {
      console.error('💥 Form submission error:', error);
      alert('❌ There was an error submitting your form. Please try again.');
    }
  };

  // Update chat messages when they change
  const handleChatUpdate = (messages) => {
    setChatMessages(messages);
  };

  // Restore session on page load (optional)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const existingSessionId = params.get('session');
    
    if (existingSessionId) {
      apiService.restoreSession(existingSessionId).then(result => {
        if (result.success) {
          setExtractedInfo(result.extractedInfo);
          setChatMessages(result.chatMessages);
          if (result.extractedInfo) {
            setShowForm(true);
          }
        }
      });
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh' }}>
      {/* Fixed background with parallax effect */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '120vh', // Overdimensioned for parallax
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
      
      {/* Scrollable content */}
      <div style={{
        minHeight: '150vh', // Make content taller to enable scrolling
        display: 'flex',
        flexDirection: 'row',
        width: '100vw',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left panel for Market Aggregation Analytics */}
        <div style={{ 
          flex: 1, 
          padding: '4vh 20px 4vh 20px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          minHeight: '100vh'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '350px'
          }}>
            <AggregationAnalytics sessionId={sessionId} />
          </div>
        </div>
        
        {/* Center container for instruction box and chat window */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'flex-start', 
          alignItems: 'center',
          minHeight: '100vh',
          paddingTop: '4vh',
          paddingBottom: '4vh',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}>
          {/* Railway-style Instruction/Title Box */}
          <div style={{
            marginBottom: '20px',
            padding: '20px 28px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '900px',
            width: '90%',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0px)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)';
          }}
          >
            {/* Subtle top gradient for Railway effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
            }} />
            
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              AI Infrastructure Aggregator
            </h2>
            <p style={{
              margin: '0',
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              Describe your Battery Energy Storage System requirements and get instant specifications
            </p>
          </div>

          {/* Railway-style Session ID Display */}
          <div style={{
            fontSize: '12px',
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
        
          <ChatWindow 
            onInterestDetected={handleExtractInfo} 
            requestMissingFields={requestMissingFields}
            onMissingFieldsHandled={handleMissingFieldsHandled}
            onChatUpdate={handleChatUpdate}
            sessionId={sessionId}
          />
        
          {/* Contact form and submit button under chat window when ready */}
          {extractedInfo && (
            <AutoFilledForm 
              extractedInfo={extractedInfo} 
              onSubmit={handleFormSubmit} 
              onRequestMissingFields={handleRequestMissingFields}
              renderContactAndSubmit={true}
              maxWidth="900px"
            />
          )}
        </div>
        
        {/* Right side panel for BESS summary cards when available */}
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
            {extractedInfo && (
              <AutoFilledForm 
                extractedInfo={extractedInfo} 
                onSubmit={handleFormSubmit} 
                onRequestMissingFields={handleRequestMissingFields}
                renderSummaryOnly={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;