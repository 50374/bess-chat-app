import React, { useState, useEffect } from 'react';

const OptimizationResults = ({ optimizationData }) => {
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    technical: false,
    economic: false,
    implementation: false
  });

  useEffect(() => {
    if (!optimizationData) {
      setParsedData(null);
      setParseError(null);
      return;
    }

    console.log('Raw optimization data received:', optimizationData);
    console.log('Type of optimization data:', typeof optimizationData);

    try {
      // Try to parse JSON from the optimization response
      let jsonData;
      if (typeof optimizationData === 'string') {
        // First try to parse the entire string as JSON
        try {
          jsonData = JSON.parse(optimizationData);
        } catch (e) {
          // If that fails, look for JSON in the response text
          const jsonMatch = optimizationData.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        }
      } else {
        jsonData = optimizationData;
      }
      
      // If jsonData has a 'data' field that's a string, parse it again (nested JSON)
      if (jsonData && jsonData.data && typeof jsonData.data === 'string') {
        console.log('Found nested JSON data, parsing again...');
        jsonData = JSON.parse(jsonData.data);
      }
      
      console.log('Final parsed data:', jsonData);
      setParsedData(jsonData);
      setParseError(null);
    } catch (error) {
      console.error('Failed to parse optimization data:', error);
      setParseError(error.message);
      setParsedData(null);
    }
  }, [optimizationData]);

  if (!optimizationData) {
    return null;
  }

  if (parseError) {
    return (
      <div style={{
        background: 'rgba(220, 38, 38, 0.1)',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h3 style={{ color: 'rgba(220, 38, 38, 0.9)', margin: '0 0 10px 0' }}>
          ❌ Parse Error
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, fontSize: '14px' }}>
          {parseError}
        </p>
        <details style={{ marginTop: '10px' }}>
          <summary style={{ color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}>
            Raw Data
          </summary>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: '10px'
          }}>
            {JSON.stringify(optimizationData, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // If we have string data, display it formatted
  if (typeof optimizationData === 'string' && !parsedData) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{
          color: 'rgba(255, 255, 255, 0.95)',
          fontSize: '20px',
          fontWeight: '600',
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          🎯 BESS Optimization Results
        </h3>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
          lineHeight: '1.6'
        }}>
          <pre style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'pre-wrap',
            margin: 0
          }}>
            {optimizationData}
          </pre>
        </div>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderSection = (title, content, sectionKey, icon) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      marginBottom: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '16px 20px',
          color: 'rgba(255, 255, 255, 0.95)',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon} {title}
        </span>
        <span style={{
          transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▼
        </span>
      </button>
      
      {expandedSections[sectionKey] && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.03)'
        }}>
          {content}
        </div>
      )}
    </div>
  );

  const formatContent = (text) => {
    if (!text) return null;
    
    return (
      <div style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
        {text.split('\n').map((line, index) => {
          // Handle bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={index} style={{ marginBottom: '8px', paddingLeft: '16px' }}>
                <span style={{ color: 'rgba(59, 130, 246, 0.8)', marginRight: '8px' }}>•</span>
                {line.trim().substring(1).trim()}
              </div>
            );
          }
          
          // Handle headers (lines ending with :)
          if (line.trim().endsWith(':') && line.trim().length > 1) {
            return (
              <h4 key={index} style={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '16px',
                fontWeight: '600',
                margin: '16px 0 8px 0'
              }}>
                {line.trim()}
              </h4>
            );
          }
          
          // Handle empty lines
          if (line.trim() === '') {
            return <div key={index} style={{ height: '8px' }} />;
          }
          
          // Regular text
          return (
            <p key={index} style={{ margin: '8px 0', fontSize: '14px' }}>
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  // Extract sections from the optimization result
  const extractSections = (data) => {
    let text = '';
    
    if (typeof data === 'string') {
      text = data;
    } else if (data && data.result) {
      text = data.result;
    } else if (data && data.data) {
      text = typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2);
    } else {
      text = JSON.stringify(data, null, 2);
    }

    const sections = {
      overview: '',
      technical: '',
      economic: '',
      implementation: ''
    };

    // Split by sections using common headers
    const overviewMatch = text.match(/(?:1\.\s*)?(?:System\s+Overview|Overview|Recommended\s+Configuration)[\s\S]*?(?=(?:2\.\s*)?(?:Technical\s+Specifications|Technical|Specifications)|$)/i);
    const technicalMatch = text.match(/(?:2\.\s*)?(?:Technical\s+Specifications|Technical|Specifications)[\s\S]*?(?=(?:3\.\s*)?(?:Economic\s+Analysis|Economic|Cost|Pricing)|$)/i);
    const economicMatch = text.match(/(?:3\.\s*)?(?:Economic\s+Analysis|Economic|Cost|Pricing)[\s\S]*?(?=(?:4\.\s*)?(?:Implementation|Recommendations|Next\s+Steps)|$)/i);
    const implementationMatch = text.match(/(?:4\.\s*)?(?:Implementation|Recommendations|Next\s+Steps)[\s\S]*$/i);

    if (overviewMatch) sections.overview = overviewMatch[0].trim();
    if (technicalMatch) sections.technical = technicalMatch[0].trim();
    if (economicMatch) sections.economic = economicMatch[0].trim();
    if (implementationMatch) sections.implementation = implementationMatch[0].trim();

    // If no sections found, put everything in overview
    if (!sections.overview && !sections.technical && !sections.economic && !sections.implementation) {
      sections.overview = text;
    }

    return sections;
  };

  const sections = extractSections(parsedData || optimizationData);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      maxWidth: '800px'
    }}>
      <h3 style={{
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: '20px',
        fontWeight: '600',
        margin: '0 0 24px 0',
        textAlign: 'center'
      }}>
        🎯 BESS Optimization Results
      </h3>

      {sections.overview && renderSection(
        'System Overview',
        formatContent(sections.overview),
        'overview',
        '🔍'
      )}

      {sections.technical && renderSection(
        'Technical Specifications', 
        formatContent(sections.technical),
        'technical',
        '⚙️'
      )}

      {sections.economic && renderSection(
        'Economic Analysis',
        formatContent(sections.economic),
        'economic',
        '💰'
      )}

      {sections.implementation && renderSection(
        'Implementation Plan',
        formatContent(sections.implementation),
        'implementation',
        '🚀'
      )}

      {/* Timestamp */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px'
      }}>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          margin: 0
        }}>
          Generated on {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default OptimizationResults;