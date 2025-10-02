import { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import AutoFilledForm from './AutoFilledForm';
import { apiService } from './services/api.js';
import backgroundImage from '/background.jpg';

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
        
        // Hide the form and request AI product recommendation
        setShowForm(false);
        
        // Create a recommendation request message
        const recommendationPrompt = `Based on the submitted BESS project requirements, please provide specific product recommendations with exact model numbers and configurations. 

Project Details:
${Object.entries(formData)
  .filter(([key, value]) => value && key !== 'form_data')
  .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
  .join('\n')}

Please analyze real product catalogs from manufacturers like Sungrow, Tesla, BYD, CATL, and others to provide:
1. Exact model numbers and specifications
2. Optimal system configuration (number of units, layout)
3. Cost optimization considerations
4. Performance characteristics matching the requirements
5. Installation and delivery timeline estimates

Focus on specific, actionable recommendations rather than general sizing advice.`;

        // Add the recommendation request to chat and trigger AI response
        const newMessages = [
          ...chatMessages,
          { role: 'user', content: recommendationPrompt }
        ];
        
        setChatMessages(newMessages);
        setRequestMissingFields(recommendationPrompt);
        
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
    <div style={{
      minHeight: '100vh',
      height: '100vh', // Fix height to prevent growing
      background: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      display: 'flex',
      flexDirection: 'row',
      width: '100vw',
      overflow: 'hidden' // Prevent any page-level scrolling
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
        overflow: 'auto', // Allow scrolling within the container if needed
        paddingTop: '6vh', // Reduced padding to give more space
        paddingBottom: '2vh' // Add bottom padding to prevent cutoff
      }}>
        {/* Glass overlay instruction box */}
        <div style={{
          background: 'rgba(249, 249, 249, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid rgba(229, 231, 235, 0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          maxWidth: '900px',
          width: '100%',
          minWidth: '350px',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          marginBottom: '16px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          WebkitBorderRadius: 16,
          MozBorderRadius: 16
        }}>
          <p style={{
            margin: 0,
            fontSize: '22px',
            color: '#2d3428',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(255,255,255,0.8)',
            letterSpacing: '0.5px',
            lineHeight: '1.4'
          }}>
            I am your AI BESS specialist. Start describing your project below.
          </p>
          
          {/* Session ID display for sharing */}
          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#6b7280',
            fontFamily: 'monospace'
          }}>
            Session: {sessionId.split('_')[1]}
          </div>
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
            renderContactAndSubmit={true} // Only render contact/submit section
            maxWidth="900px" // Match chat window width
          />
        )}
      </div>
      {/* Right container for BESS Summary only - with proper scrolling */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'flex-start',
        height: '100vh',
        padding: '6vh 0 2vh 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          height: 'calc(100vh - 8vh)', // Account for padding
          overflowY: 'auto', // Scrollable container
          overflowX: 'hidden'
        }}>
          {extractedInfo && (
            <AutoFilledForm 
              extractedInfo={extractedInfo} 
              onSubmit={handleFormSubmit} 
              onRequestMissingFields={handleRequestMissingFields}
              renderSummaryOnly={true} // Only render BESS Summary cards
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
