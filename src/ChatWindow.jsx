import React, { useState, useRef, useEffect } from 'react';
import { apiService } from './services/api.js';

const ChatWindow = ({ onExtractInfo, requestMissingFields, onMissingFieldsHandled, onChatUpdate, sessionId }) => {
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [messages, setMessages] = useState([]); // Start with empty messages - Assistant API manages conversation
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // OpenAI Assistant configuration
  const ASSISTANT_ID = import.meta.env.VITE_OPENAI_ASSISTANT_ID || 'asst_gkRgQtlA0WWreiRl3y6acyGC';
  const [threadId, setThreadId] = useState(null);

  // Generate random example prompts for each visit
  const [examplePrompts] = useState(() => {
    const allPrompts = [
      "I need a 20MW BESS for energy arbitrage",
      "Help me design a frequency regulation system", 
      "What LFP chemistry options do you recommend?",
      "I want a 4-hour duration system for peak shaving",
      "Design a 50MW grid-scale battery storage project",
      "What's the best chemistry for cold weather operation?",
      "I need a backup power system for 8 hours duration",
      "Help with AC-coupled vs DC-coupled configuration",
      "Quote me a turnkey BESS with DDP delivery terms",
      "What C-rate should I use for energy arbitrage?",
      "I want NMC batteries for high energy density",
      "Design a 100MWh system for renewable integration",
      "What's the typical round-trip efficiency for LFP?",
      "I need Swedish grid code compliance",
      "Help me size a system for 2 cycles per day",
      "What warranty terms do you typically offer?",
      "I want a containerized outdoor installation",
      "Design a BESS for frequency response services",
      "What's the difference between LTO and LFP?",
      "I need delivery by Q2 2026"
    ];
    
    // Randomly select 4 prompts
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  });

  const sendMessage = async () => {
    if (!input.trim()) return;
    await processMessage(input, messages);
  };

  // Helper function to process messages using OpenAI Assistant API
  const processMessage = async (messageContent, currentMessages) => {
    setLoading(true);
    let newMessages;
    try {
      newMessages = [...currentMessages, { role: 'user', content: messageContent }];
      setMessages(newMessages);
      setInput(''); // Clear input only if this was a user-initiated message
      
      // Notify parent about chat update
      if (onChatUpdate) {
        onChatUpdate(newMessages);
      }
      
      // Use Assistant API through our backend
      const result = await apiService.processChatMessage(
        newMessages, 
        extractedInfo, 
        sessionId,
        ASSISTANT_ID,
        threadId
      );
      
      if (result.success) {
        const displayMessage = result.data.reply;
        const finalMessages = [...newMessages, { role: 'assistant', content: displayMessage }];
        setMessages(finalMessages);
        
        // Store thread ID for conversation continuity
        if (result.data.threadId) {
          setThreadId(result.data.threadId);
        }
        
        // Extract BESS project data from the response
        if (result.data.extractedInfo && onExtractInfo) {
          console.log('📋 Extracted BESS data:', result.data.extractedInfo);
          setExtractedInfo(result.data.extractedInfo);
          onExtractInfo(result.data.extractedInfo);
        }
        
        // Notify parent about final chat update
        if (onChatUpdate) {
          onChatUpdate(finalMessages);
        }
      } else {
        const errorMessage = result.fallback || result.error || 'Sorry, I encountered an error. Please try again.';
        const finalMessages = [...newMessages, { role: 'assistant', content: errorMessage }];
        setMessages(finalMessages);
      }
    } catch (error) {
      console.error('Error:', error);
      const fallbackMessage = 'Sorry, I encountered an error. Please try again.';
      const finalMessages = [...newMessages, { role: 'assistant', content: fallbackMessage }];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  // Handle missing fields request from form OR automatic recommendation requests
  useEffect(() => {
    if (requestMissingFields) {
      if (Array.isArray(requestMissingFields) && requestMissingFields.length > 0) {
        // Handle missing fields (original functionality)
        const missingFieldsText = requestMissingFields.join(', ');
        const autoMessage = `I notice we're missing some important information for your BESS project. Could you please provide the ${missingFieldsText}? This will help me complete your specifications and enable the submit functionality.`;
        
        // Add the assistant message asking for missing fields
        setMessages(prev => [...prev, { role: 'assistant', content: autoMessage }]);
        
      } else if (typeof requestMissingFields === 'string') {
        // Handle automatic recommendation request (new functionality)
        console.log('🤖 Processing automatic recommendation request...');
        
        // Automatically process the recommendation request
        processMessage(requestMissingFields, messages);
      }
      
      // Clear the request
      if (onMissingFieldsHandled) {
        onMissingFieldsHandled();
      }
    }
  }, [requestMissingFields, onMissingFieldsHandled]);

  // Scroll to bottom when new messages arrive
  const messagesContainerRef = useRef(null);
  useEffect(() => {
    // Only scroll within the messages container, not the viewport
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Calculate dynamic height based on content like ChatGPT
  const visibleMessages = messages; // No system messages with Assistant API
  const messageCount = visibleMessages.length;
  
  // Calculate approximate content height more naturally
  let dynamicHeight;
  if (messageCount === 0) {
    // Welcome screen with prompts needs more space
    dynamicHeight = '500px'; // Increased to better accommodate 4 example prompts
  } else {
    // Calculate based on content: each message ~80px + padding + input area
    const baseInputHeight = 80; // Input area height
    const messageHeight = 80; // More realistic average message height
    const padding = 60; // Top/bottom padding
    
    const contentHeight = (messageCount * messageHeight) + baseInputHeight + padding;
    // Account for instruction box (~100px) + container padding (~8vh + 2vh = ~100px)
    const reservedSpace = 200; // Reserved space for instruction box and padding
    const availableHeight = window.innerHeight - reservedSpace;
    
    // Start smaller and grow more noticeably
    const minChatHeight = 500; // Minimum chat height - same as welcome screen
    const maxChatHeight = Math.min(availableHeight, window.innerHeight * 0.65); // Cap at 65vh
    
    // Natural growth with smooth scaling
    if (contentHeight <= minChatHeight) {
      // Small conversations - maintain welcome screen size
      dynamicHeight = `${minChatHeight}px`;
    } else if (contentHeight <= maxChatHeight) {
      // Normal growth - expand with content
      dynamicHeight = `${contentHeight}px`;
    } else {
      // Cap at max height and use internal scrolling
      dynamicHeight = `${maxChatHeight}px`;
    }
  }

  return (
    <div style={{
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      maxWidth: '900px',
      width: '100%',
      minWidth: '350px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0px)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)';
    }}
    >
      {/* Subtle gradient overlay for Railway-style depth */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)'
      }} />
      
      <div ref={messagesContainerRef} style={{
        height: dynamicHeight,
        overflowY: messageCount === 0 ? 'hidden' : 'auto',
        overflowX: 'hidden',
        padding: '24px',
        paddingBottom: messageCount === 0 ? '24px' : '16px'
      }}>
        {messageCount === 0 ? (
          // Welcome screen with Railway-style cards
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '18px',
            marginBottom: '32px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Welcome to BESS RFQ Architect
            </div>
            <div style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '40px',
              lineHeight: '1.5'
            }}>
              I'll help you design your Battery Energy Storage System. Try one of these examples:
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(prompt);
                    setTimeout(() => {
                      setInput(prompt);
                      sendMessage();
                    }, 100);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat messages with Railway-style bubbles
          <>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 16
              }}>
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: msg.role === 'user' 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.95)',
                  border: `1px solid ${msg.role === 'user' 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : 'rgba(255, 255, 255, 0.15)'}`,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  fontSize: 15,
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* Railway-style input area */}
      <div style={{
        padding: '20px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' ? sendMessage() : null}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: 15,
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            e.target.style.boxShadow = 'none';
          }}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
            color: loading || !input.trim() ? 'rgba(255, 255, 255, 0.4)' : '#ffffff',
            border: `1px solid ${loading || !input.trim() 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(59, 130, 246, 0.3)'}`,
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: loading || !input.trim() 
              ? 'none' 
              : '0 4px 16px rgba(59, 130, 246, 0.2)'
          }}
          onMouseEnter={(e) => {
            if (!loading && input.trim()) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && input.trim()) {
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.2)';
            }
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;