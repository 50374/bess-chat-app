import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import AutoFilledForm from './AutoFilledForm';
import UltraGradientBackground from './components/UltraGradientBackground';
import { apiService } from './services/api.js';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [requestMissingFields, setRequestMissingFields] = useState(null);
  const [sessionId] = useState(() => apiService.generateSessionId());
  const [chatMessages, setChatMessages] = useState([]);

  // Callback to receive info from ChatWindow
  const handleExtractInfo = (info) => {
    if (info) {
      setExtractedInfo(info);
      setShowForm(true);
    }
  };

  // Callback for form to request missing fields from chat
  const handleRequestMissingFields = (missingFields) => {
    setRequestMissingFields(missingFields);
  };

  // Callback to clear the missing fields request after handling
  const handleMissingFieldsHandled = () => {
    setRequestMissingFields(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      console.log('🚀 Starting form submission...');
      console.log('📝 Form data:', formData);
      console.log('🆔 Session ID:', sessionId);
      console.log('💬 Chat messages count:', chatMessages.length);
      
      const result = await apiService.submitForm(formData, sessionId, chatMessages);
      
      console.log('📨 API response:', result);
      
      if (result.success) {
        alert(`✅ ${result.message}\n\nProject ID: ${result.projectId}`);
        
        // Hide the form
        setShowForm(false);
        
        // Get product recommendation directly (not as chat)
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
    <UltraGradientBackground
      speed={0.08}
      opacity={1}
      palette={["#0a0f1c", "#1a2332", "#2d1b3e", "#3e2a47"]} 
      quality="med"
      blobs={4}
      bandStrength={0.0}
    >
      <div style={{
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        width: '100vw',
        overflow: 'hidden'
      }}>
        {/* Left empty container for centering */}
        <div style={{ flex: 1 }} />
        
        {/* Center container for instruction box and chat window */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'flex-start', 
          alignItems: 'center',
          height: '100vh',
          overflow: 'auto',
          paddingTop: '6vh',
          paddingBottom: '2vh'
        }}>
          {/* Instruction/Title Box */}
          <div style={{
            marginBottom: '20px',
            padding: '18px 24px',
            background: 'rgba(249, 249, 249, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(229, 231, 235, 0.3)',
            maxWidth: '900px',
            width: '90%'
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: '700',
              color: '#000000',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              AI Infrastructure Aggregator
            </h2>
            <p style={{
              margin: '0',
              fontSize: '16px',
              color: '#000000',
              textAlign: 'center',
              lineHeight: '1.4',
              opacity: '0.8'
            }}>
              Describe your Battery Energy Storage System requirements and get instant specifications
            </p>
          </div>

          {/* Session ID Display */}
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '15px',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '4px 8px',
            borderRadius: '4px'
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
          padding: '6vh 20px 2vh 0',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '450px',
            height: 'calc(100vh - 8vh)',
            overflowY: 'auto',
            overflowX: 'hidden'
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
    </UltraGradientBackground>
  );
}

export default App;