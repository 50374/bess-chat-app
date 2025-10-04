import React, { useState, useEffect } from 'react';

const OptimizationResults = ({ results, projectRequirements }) => {
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [validationResults, setValidationResults] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    technical: false,
    economic: false,
    implementation: false
  });

  // Validate BESS recommendations against project requirements
  const validateRecommendation = (recommendation, requirements) => {
    const validation = {
      powerMatch: false,
      energyMatch: false,
      durationMatch: false,
      cyclesMatch: false,
      overall: false,
      issues: []
    };

    if (recommendation && requirements) {
      // Power validation (±20% tolerance)
      const powerTolerance = 0.2;
      const powerMatch = Math.abs(recommendation.nominal_power_mw - requirements.nominal_power_mw) / requirements.nominal_power_mw <= powerTolerance;
      validation.powerMatch = powerMatch;
      if (!powerMatch) {
        validation.issues.push(`Power mismatch: Required ${requirements.nominal_power_mw}MW, Recommended ${recommendation.nominal_power_mw}MW`);
      }

      // Energy validation (±20% tolerance)
      const energyTolerance = 0.2;
      const energyMatch = Math.abs(recommendation.nominal_energy_mwh - requirements.nominal_energy_mwh) / requirements.nominal_energy_mwh <= energyTolerance;
      validation.energyMatch = energyMatch;
      if (!energyMatch) {
        validation.issues.push(`Energy mismatch: Required ${requirements.nominal_energy_mwh}MWh, Recommended ${recommendation.nominal_energy_mwh}MWh`);
      }

      // Duration validation (±15% tolerance)
      const durationTolerance = 0.15;
      const calculatedDuration = recommendation.nominal_energy_mwh / recommendation.nominal_power_mw;
      const durationMatch = Math.abs(calculatedDuration - requirements.discharge_duration_h) / requirements.discharge_duration_h <= durationTolerance;
      validation.durationMatch = durationMatch;
      if (!durationMatch) {
        validation.issues.push(`Duration mismatch: Required ${requirements.discharge_duration_h}h, Calculated ${calculatedDuration.toFixed(1)}h`);
      }

      // Daily cycles validation
      const maxCycles = recommendation.daily_cycles_max || 2;
      const cyclesMatch = requirements.expected_daily_cycles <= maxCycles;
      validation.cyclesMatch = cyclesMatch;
      if (!cyclesMatch) {
        validation.issues.push(`Cycles exceed capacity: Required ${requirements.expected_daily_cycles}/day, Max ${maxCycles}/day`);
      }

      // Overall validation
      validation.overall = validation.powerMatch && validation.energyMatch && validation.durationMatch && validation.cyclesMatch;
    }

    return validation;
  };

  useEffect(() => {
    if (!results) {
      setParsedData(null);
      setParseError(null);
      setValidationResults({});
      return;
    }

    console.log('Raw optimization data received:', results);
    console.log('Project requirements:', projectRequirements);

    try {
      // Try to parse JSON from the optimization response
      let jsonData;
      if (typeof results === 'string') {
        // First try to parse the entire string as JSON
        try {
          jsonData = JSON.parse(results);
        } catch (e) {
          // If that fails, look for JSON in the response text
          const jsonMatch = results.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        }
      } else {
        jsonData = results;
      }
      
      // If jsonData has a 'data' field that's a string, parse it again (nested JSON)
      if (jsonData && jsonData.data && typeof jsonData.data === 'string') {
        console.log('Found nested JSON data, parsing again...');
        jsonData = JSON.parse(jsonData.data);
      }
      
      console.log('Final parsed data:', jsonData);
      setParsedData(jsonData);

      // Validate recommendation against requirements
      if (jsonData && jsonData.recommendation && projectRequirements) {
        const validation = validateRecommendation(jsonData.recommendation, projectRequirements);
        setValidationResults(validation);
        console.log('Validation results:', validation);
      }

      setParseError(null);
    } catch (error) {
      console.error('Failed to parse optimization data:', error);
      setParseError(error.message);
      setParsedData(null);
      setValidationResults({});
    }
  }, [results, projectRequirements]);

  if (!results) {
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
            {JSON.stringify(results, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // Display recommendation table with validation
  if (parsedData && parsedData.recommendation) {
    const rec = parsedData.recommendation;
    
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '20px',
        border: `2px solid ${validationResults.overall ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`,
        boxShadow: `0 8px 32px ${validationResults.overall ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`
      }}>
        {/* Header with validation status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: validationResults.overall ? '#4ecdc4' : '#ffc107',
            marginRight: '12px'
          }} />
          <h3 style={{
            color: 'white',
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            flex: 1
          }}>
            🎯 BESS Recommendation
          </h3>
          <div style={{
            padding: '4px 12px',
            borderRadius: '12px',
            background: validationResults.overall 
              ? 'rgba(78, 205, 196, 0.2)' 
              : 'rgba(255, 193, 7, 0.2)',
            color: validationResults.overall ? '#4ecdc4' : '#ffc107',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {validationResults.overall ? '✅ Validated' : '⚠️ Needs Review'}
          </div>
        </div>

        {/* Validation Issues */}
        {validationResults.issues && validationResults.issues.length > 0 && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{
              color: '#ffc107',
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ⚠️ Validation Issues:
            </h4>
            {validationResults.issues.map((issue, index) => (
              <div key={index} style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '13px',
                marginBottom: '4px'
              }}>
                • {issue}
              </div>
            ))}
          </div>
        )}

        {/* Recommendation Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Manufacturer
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {rec.manufacturer || 'N/A'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Model
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {rec.model || 'N/A'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Nominal Power
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: validationResults.powerMatch ? '#4ecdc4' : '#ffc107',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {rec.nominal_power_mw} MW
                  {validationResults.powerMatch ? ' ✅' : ' ⚠️'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Nominal Energy
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: validationResults.energyMatch ? '#4ecdc4' : '#ffc107',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {rec.nominal_energy_mwh} MWh
                  {validationResults.energyMatch ? ' ✅' : ' ⚠️'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Discharge Duration
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: validationResults.durationMatch ? '#4ecdc4' : '#ffc107',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {(rec.nominal_energy_mwh / rec.nominal_power_mw).toFixed(1)} hours
                  {validationResults.durationMatch ? ' ✅' : ' ⚠️'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Chemistry
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {rec.chemistry || 'N/A'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td style={{
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Round Trip Efficiency
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {rec.round_trip_efficiency_pct ? `${rec.round_trip_efficiency_pct}%` : 'N/A'}
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '12px 16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Max Daily Cycles
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: validationResults.cyclesMatch ? '#4ecdc4' : '#ffc107',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {rec.daily_cycles_max || 'N/A'}
                  {validationResults.cyclesMatch ? ' ✅' : ' ⚠️'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Additional Information */}
        {parsedData.reasoning && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px'
          }}>
            <h4 style={{
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              💡 Recommendation Reasoning:
            </h4>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '13px',
              lineHeight: '1.5',
              margin: 0
            }}>
              {parsedData.reasoning}
            </p>
          </div>
        )}
      </div>
    );
  }

  // If we have string data, display it formatted
  if (typeof results === 'string' && !parsedData) {
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
            {results}
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
    } else if (data && data.optimization) {
      text = data.optimization;
    } else if (data && data.result) {
      text = data.result;
    } else if (data && data.data) {
      text = typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2);
    } else {
      text = JSON.stringify(data, null, 2);
    }

    // Ensure text is a string before using .match()
    if (typeof text !== 'string') {
      text = String(text);
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

  const sections = extractSections(parsedData || results);

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