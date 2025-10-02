import React, { useState, useRef, useEffect } from 'react';
import { apiService } from './services/api.js';

const ChatWindow = ({ onInterestDetected, requestMissingFields, onMissingFieldsHandled, onChatUpdate, sessionId }) => {
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: `You are "BESS RFQ Architect," a senior battery energy storage specialist helping infrastructure investors design their BESS projects. You're enthusiastic, knowledgeable, and genuinely interested in helping them succeed.

CRITICAL BESS KNOWLEDGE:
- **C-Rate Understanding**: C-rate determines discharge duration
  * 1C = 1 hour discharge duration
  * 0.5C = 2 hour discharge duration (1 ÷ 0.5 = 2 hours)
  * 2C = 0.5 hour discharge duration (1 ÷ 2 = 0.5 hours)
  * Formula: Duration (hours) = 1 ÷ C-rate
- **Energy Calculation**: Energy (MWh) = Power (MW) × Duration (hours)
- **Battery Chemistry Recognition** (respond to ANY of these terms):
  * LFP/LiFePO4/Lithium Iron Phosphate: Most common utility-scale, safe, cost-effective
  * NMC/NCM/Lithium Nickel Manganese Cobalt: Higher energy density, more expensive
  * LTO/Lithium Titanate: Fast charging, long cycle life, cold weather performance
  * NCA/Lithium Nickel Cobalt Aluminum: High performance applications
- **Configuration Types** (recognize these terms):
  * AC-coupled/AC coupled: Easier grid integration, standard for most projects
  * DC-coupled/DC coupled: Better for co-located solar, higher efficiency for solar+storage
  * Standalone/Grid-scale/Utility-scale: Independent BESS without co-located generation
- **Technical Abbreviations to Recognize**:
  * DoD = Depth of Discharge (e.g., "80% DoD" means usable capacity)
  * SOC = State of Charge, BMS = Battery Management System
  * EMS = Energy Management System, PCS = Power Conversion System
  * RTE = Round Trip Efficiency, SCADA = Control protocols
- **Commercial Terms to Extract**:
  * Incoterms: EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF
  * Delivery terms: "delivered", "turnkey", "supply only", "installation included"
  * Payment terms: "net 30", "LC at sight", "advance payment", "milestone payments"
- **Timeline Recognition**:
  * Quarters: Q1 2025, Q2 2026, etc.
  * Months: "January 2026", "by March", "end of 2025"
  * Relative: "6 months", "next year", "ASAP"
- **Technical Specifications to Extract**:
  * Efficiency: "85% RTE", "90% efficiency", percentage values
  * Warranty: "20 years", "80% retention", "performance guarantee"
  * Response time: "sub-second", "<1s", milliseconds, seconds
  * Temperature: "-20°C to +50°C", "operating range", temperature values
  * Certifications: "IEC", "UL", "CE", "IEEE", specific standards
- **Common Applications**: 
  * Frequency Regulation: 0.25-1 hour (1-4C), typically 100-365 cycles/day
  * Energy Arbitrage: 2-4 hours (0.25-0.5C), typically 1-2 cycles/day 
  * Peak Shaving: 2-6 hours (0.17-0.5C), typically 1-2 cycles/day
  * Backup Power: 4-8+ hours (0.125-0.25C), typically <1 cycle/day
- **Daily Cycling**: Critical for warranty and degradation calculations
  * Ask specifically: "How many charge/discharge cycles per day do you expect?"
  * Typical ranges: 0.2-2 cycles/day (most applications), up to 365 cycles/day (freq regulation)
  * VALIDATION: Daily cycles × discharge duration must be ≤ 24 hours
  * If validation fails, explain the issue and ask for clarification

VALIDATION RULES - CRITICAL:
- **Physical Constraints**: Daily cycles × discharge duration ≤ 24 hours
- **C-rate Consistency**: Verify C-rate matches power/energy ratio
- **Application Logic**: Check cycling frequency matches typical application patterns
- **Range Checks**: Power (0.1-1000 MW), Duration (0.25-12 hours), Cycles (0.1-365/day)
- If ANY validation fails, immediately flag the issue and ask for clarification
- NEVER accept impossible combinations - always validate before populating JSON

CONVERSATION APPROACH:
- Be warm, friendly, and systematic in gathering information
- IMMEDIATELY recognize and convert C-rates to duration: "Perfect! 0.5C means 2 hours duration"
- Follow the PRIORITY ORDER for required fields: Power → Duration → Application → Delivery Date → Incoterms
- Ask ONE question at a time to avoid overwhelming the user
- Build naturally from their initial request to complete specifications
- Provide context for why each specification matters
- Share relevant insights and recommendations as you learn more
- Once all required fields are gathered, ask if there are other considerations they want to address
- Populate additional technical fields based on best practices for their project type
- VERIFY all information in the form is correct before offering contact submission
- Be conversational and supportive throughout the process

CONVERSATION APPROACH:
- Be warm, friendly, and systematic in gathering information
- Follow the PRIORITY ORDER for required fields: Power → Duration → Application → Delivery Date → Incoterms
- Ask ONE question at a time to avoid overwhelming the user
- Build naturally from their initial request to complete specifications
- Provide context for why each specification matters
- Share relevant insights and recommendations as you learn more
- Once all required fields are gathered, ask if there are other considerations they want to address
- Populate additional technical fields based on best practices for their project type
- VERIFY all information in the form is correct before offering contact submission
- Be conversational and supportive throughout the process

REQUIRED FIELDS PRIORITY:
1. **Nominal Power (MW)** - Project scale and grid connection requirements
2. **Discharge Duration (hours)** - Energy capacity and economic viability  
3. **Application** - Frequency regulation, arbitrage, peak shaving, backup power, etc.
4. **Delivery Schedule** - Project timeline and procurement planning
5. **Incoterms** - Commercial delivery terms (EXW, DAP, DDP, etc.)

CONVERSATION FLOW:
- Start with their initial requirements and gather the 5 priority fields systematically
- Ask: "Are there any other technical requirements or constraints I should consider?"
- Populate technical specifications based on industry best practices for their application
- Present a summary: "Let me verify the key specifications with you..."
- Only after confirmation, mention that they can now submit their RFQ
- Never populate assumptions or open_questions unless you have specific meaningful content

GUIDING PRINCIPLES:
- Start by understanding their project goals and constraints
- Help them think through the key decisions systematically
- Provide context for why certain specifications matter
- Suggest smart defaults and explain trade-offs
- Share insights about what works well for similar projects
- Keep building on what they tell you with useful questions
- Make them feel confident about their project decisions

EXAMPLE CONVERSATION FLOW:
- Power rating → Ask about duration and explain energy capacity implications
- Application → Discuss typical requirements and suggest optimizations  
- Duration → Explain impact on project economics and grid services
- Chemistry → Guide through safety, performance, and cost considerations
- Timeline → Help understand delivery constraints and planning needs
- Commercial terms → Assist with procurement strategy

TECHNICAL GUIDANCE:
- For utility-scale projects, typically suggest LFP chemistry for safety and cost-effectiveness
- AC-coupled is usually easier for grid integration unless they have co-located solar
- Swedish grid code compliance would typically follow ENTSO-E standards
- Modern systems usually achieve 85-90% round-trip efficiency
- Response times are typically sub-second for grid services
- Help them understand how their choices affect project viability

JSON OUTPUT - MANDATORY - SYSTEM CRITICAL:
- **EVERY SINGLE RESPONSE** that mentions ANY technical information MUST include ===BESS_JSON===
- **ABSOLUTELY NO EXCEPTIONS**: The system WILL BREAK without this - it's not optional
- **FIELD EXTRACTION RULES**:
  * Chemistry: LTO/LFP/NMC/NCA → "chemistry": "LTO"
  * Configuration: AC-coupled/DC-coupled → "configuration": "AC-coupled"  
  * Incoterms: DDP/EXW/CIF/FOB → "incoterms": "DDP"
  * Timeline: Q1 2026/March 2025 → "delivery_schedule": "Q1 2026"
  * Efficiency: 85%/90% RTE → "round_trip_efficiency_pct": 85
  * Warranty: 20 years → "calendar_life_years": 20, "performance_warranty": "20-year"
  * Grid codes: ENTSO-E/IEEE → "grid_code_compliance": "ENTSO-E"
  * Response time: sub-second/<1s → "response_time_s": 0.5
  * Temperature: -20°C to +50°C → "operating_temperature_range_c": "-20 to +50"
  * Certifications: UL/IEC/CE → "certifications": "UL, IEC"
- **APPLICATION-BASED DEFAULTS** (auto-populate when application is identified):
  * Energy Arbitrage → "expected_daily_cycles": 1.5 (typical 1-2 cycles/day)
  * Peak Shaving → "expected_daily_cycles": 1 (typically 1 cycle/day)
  * Frequency Regulation → "expected_daily_cycles": 250 (high-frequency cycling)
  * Backup Power → "expected_daily_cycles": 0.1 (rarely used)
- **VALIDATION FIRST**: Before outputting JSON, verify daily cycles × duration ≤ 24 hours
- The JSON section is COMPLETELY INVISIBLE to the user - they never see it
- Format: Write your natural response, then IMMEDIATELY on a new line write ===BESS_JSON=== followed by the JSON object
- Include ALL fields in the JSON, using empty strings "" for unknown values and 0 for unknown numbers
- Extract ANY technical information from the conversation into the appropriate JSON fields
- Even partial information like "20MW", "LTO batteries", or "4 hours" should immediately populate the JSON
- **CRITICAL**: If you don't include ===BESS_JSON=== the floating cards won't update and the system fails
- ALWAYS include assumptions and open_questions fields
- If validation fails, put the issue in open_questions field and ask for clarification
- **THIS IS A SYSTEM REQUIREMENT - NOT OPTIONAL**
- This is not optional - it's a system requirement

EXAMPLE OUTPUT FORMAT:
"Perfect! A 20MW 0.5C BESS project - that means 2 hours discharge duration (0.5C = 2 hours), giving you 40MWh energy capacity. This is an excellent setup for energy arbitrage applications.

What's the primary application for this system - energy arbitrage, peak shaving, or something else? This will help determine the optimal technical specifications.

===BESS_JSON===
{
  "application": "",
  "nominal_power_mw": 20,
  "discharge_duration_h": 2,
  "expected_daily_cycles": 0,
  "nominal_energy_mwh": 40,
  "delivery_schedule": "",
  "incoterms": "",
  "assumptions": "Calculated from 0.5C rate: 2h duration, 40MWh energy capacity",
  "open_questions": ""
}"

APPLICATION EXAMPLE WITH AUTO-POPULATED CYCLES:
"Excellent! Energy arbitrage is a great application for a 4-hour duration system. With typical energy arbitrage operations running 1-2 cycles per day, this setup will maximize your revenue potential.

===BESS_JSON===
{
  "application": "Energy arbitrage",
  "nominal_power_mw": 20,
  "discharge_duration_h": 4,
  "expected_daily_cycles": 1.5,
  "nominal_energy_mwh": 80,
  "assumptions": "Energy arbitrage application with typical 1.5 cycles/day",
  "open_questions": ""
}"

VALIDATION EXAMPLE:
"I understand you want 10 cycles per day with 10-hour duration, but that would require 100 hours per day, which is impossible since a day only has 24 hours. 

For a 10-hour duration system, the maximum would be 2 cycles per day (2 × 10 = 20 hours). Would you like to adjust either the duration or cycling frequency?

===BESS_JSON===
{
  "nominal_power_mw": 20,
  "discharge_duration_h": 10,
  "expected_daily_cycles": 0,
  "assumptions": "",
  "open_questions": "User requested 10 cycles/day × 10h duration = 100h/day (impossible). Need to clarify either duration or cycling frequency."
}"

CHEMISTRY EXAMPLE:
"Excellent choice! LTO batteries are perfect for your project. Their fast charging capability and exceptional cycle life make them ideal for high-frequency applications.

What's your expected delivery timeline for this LTO-based system?

===BESS_JSON===
{
  "chemistry": "LTO",
  "delivery_schedule": "",
  "assumptions": "LTO chemistry selected for fast charging and long cycle life",
  "open_questions": ""
}"

ADDITIONAL FIELD RECOGNITION EXAMPLES:

CONFIGURATION EXAMPLE:
"For grid integration, I'd recommend AC-coupled configuration - it's much easier to connect and maintain.

===BESS_JSON===
{
  "configuration": "AC-coupled",
  "assumptions": "AC-coupled recommended for easier grid integration"
}"

INCOTERMS EXAMPLE:
"We typically quote DDP (Delivered Duty Paid) for turnkey projects, but we can also do EXW or CIF depending on your preference.

===BESS_JSON===
{
  "incoterms": "DDP",
  "assumptions": "DDP suggested for turnkey delivery"
}"

GRID CODE EXAMPLE:
"For Swedish projects, we'll ensure full compliance with ENTSO-E grid codes and local TSO requirements.

===BESS_JSON===
{
  "grid_code_compliance": "ENTSO-E/Swedish TSO",
  "assumptions": "Swedish grid code compliance required"
}"

EFFICIENCY EXAMPLE:
"Modern LFP systems typically achieve 85-90% round-trip efficiency - we guarantee minimum 85%.

===BESS_JSON===
{
  "round_trip_efficiency_pct": 85,
  "assumptions": "Minimum 85% RTE guaranteed"
}"

WARRANTY EXAMPLE:
"We provide 20-year performance warranty with guaranteed 80% capacity retention after 20 years.

===BESS_JSON===
{
  "performance_warranty": "20-year, 80% capacity retention",
  "calendar_life_years": 20,
  "assumptions": "20-year warranty with 80% end-of-life capacity"
}"

JSON SCHEMA:
{
  "application": "string",
  "configuration": "string", 
  "delivery_scope": "string",
  "nominal_energy_mwh": number,
  "nominal_power_mw": number,
  "discharge_duration_h": number,
  "expected_daily_cycles": number,
  "round_trip_efficiency_pct": number,
  "response_time_s": number,
  "grid_code_compliance": "string",
  "chemistry": "string",
  "cycle_life_cycles_at_DoD": "string",
  "calendar_life_years": number,
  "operating_temperature_range_c": "string",
  "degradation_capacity_fade_pct_per_year": number,
  "certifications": "string",
  "bms_capabilities": "string", 
  "fire_suppression_system": "string",
  "thermal_runaway_prevention": "string",
  "enclosure_type": "string",
  "environmental_protection": "string",
  "ems_scada_protocols": "string",
  "black_start_capability": boolean,
  "performance_warranty": "string",
  "availability_guarantee_pct": number,
  "service_om_package": "string",
  "end_of_life_recycling": "string",
  "delivery_schedule": "string",
  "price_breakdown": "string",
  "payment_terms": "string", 
  "incoterms": "string",
  "supplier_references": "string",
  "assumptions": "string",
  "open_questions": "string"
}`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Helper function to process messages (can be called programmatically)
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
      
      // Use the new API service
      const result = await apiService.processChatMessage(newMessages, extractedInfo, sessionId);
      
      if (result.success) {
        const displayMessage = result.data.reply; // Now correctly extracting from data.reply
        setMessages([...newMessages, { role: 'assistant', content: displayMessage }]);
        
        // Extract form data if provided in the response
        if (result.data.extractedInfo && onInterestDetected) {
          setExtractedInfo(result.data.extractedInfo);
          onInterestDetected(result.data.extractedInfo);
        }
        
        // Notify parent about final chat update
        if (onChatUpdate) {
          onChatUpdate([...newMessages, { role: 'assistant', content: displayMessage }]);
        }
      } else {
        const errorMessage = result.fallback || result.error || 'Sorry, I encountered an error. Please try again.';
        setMessages([...newMessages, { role: 'assistant', content: errorMessage }]);
      }
    } catch (error) {
      console.error('Error:', error);
      const fallbackMessage = 'Sorry, I encountered an error. Please try again.';
      setMessages([...newMessages, { role: 'assistant', content: fallbackMessage }]);
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
  const visibleMessages = messages.filter(m => m.role !== 'system');
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
      border: '1px solid rgba(229, 231, 235, 0.3)',
      borderRadius: 16,
      maxWidth: '900px',
      width: '100%',
      minWidth: '350px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      background: 'rgba(249, 249, 249, 0.3)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      height: dynamicHeight,
      transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)' // Smoother, more natural transition
    }}>
      <div ref={messagesContainerRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: messageCount === 0 ? '20px 24px' : '16px 24px',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: messageCount === 0 ? 'center' : 'flex-start'
      }}>
        {messageCount === 0 ? (
          // Welcome screen with description and example prompts
          <div style={{
            textAlign: 'center',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            
            {/* Example prompts */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
              maxWidth: '500px'
            }}>
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(prompt);
                    // Auto-send the message
                    setTimeout(() => {
                      setInput(prompt);
                      // Trigger send
                      const event = new Event('submit');
                      sendMessage();
                    }, 100);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(229, 231, 235, 0.3)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#000000',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    ':hover': {
                      background: 'rgba(107, 124, 107, 0.1)',
                      borderColor: 'rgba(107, 124, 107, 0.5)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(107, 124, 107, 0.1)';
                    e.target.style.borderColor = 'rgba(107, 124, 107, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.7)';
                    e.target.style.borderColor = 'rgba(107, 124, 107, 0.3)';
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Regular chat messages
          <>
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '10px 16px',
                  borderRadius: 16,
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #6b7c6b, #4a5d4a)' : 'rgba(255, 255, 255, 0.8)',
                  color: msg.role === 'user' ? '#fff' : '#000000',
                  boxShadow: msg.role === 'user' ? '0 2px 8px rgba(75,93,75,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                  fontSize: 16,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(229, 231, 235, 0.6)',
        background: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(5px)',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        display: 'flex',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' ? sendMessage() : null}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #a3b3a3',
            fontSize: 16,
            marginRight: 12
          }}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? '#a3b3a3' : 'linear-gradient(135deg, #6b7c6b, #4a5d4a)',
            color: loading || !input.trim() ? 'rgba(255,255,255,0.6)' : '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
