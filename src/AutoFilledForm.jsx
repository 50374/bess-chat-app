import React, { useState } from 'react';
import { apiService } from './services/api.js';

const AutoFilledForm = ({ extractedInfo, onOptimizationRequest, onRequestMissingFields, renderSummaryOnly = false, sessionId }) => {
  console.log('🔍 AutoFilledForm rendered with:', { extractedInfo, renderSummaryOnly });
  
  // Add CSS for floating cards
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatIn {
        0% {
          opacity: 0;
          transform: scale(0.95) translateY(20px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0px);
        }
      }

      .floating-card {
        animation: floatIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .floating-card:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      }

      .floating-card-0 { animation-delay: 0s; }
      .floating-card-1 { animation-delay: 0.1s; }
      .floating-card-2 { animation-delay: 0.2s; }
      .floating-card-3 { animation-delay: 0.3s; }
      .floating-card-4 { animation-delay: 0.4s; }
      .floating-card-5 { animation-delay: 0.5s; }
      .floating-card-6 { animation-delay: 0.6s; }
      .floating-card-7 { animation-delay: 0.7s; }
      .floating-card-8 { animation-delay: 0.8s; }
      .floating-card-9 { animation-delay: 0.9s; }
    `;
    
    if (!document.getElementById('floating-cards-styles')) {
      style.id = 'floating-cards-styles';
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById('floating-cards-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const [isOptimizing, setIsOptimizing] = useState(false);

  // Field labels for display
  const fieldLabels = {
    application: 'Application',
    nominal_power_mw: 'Power (MW)',
    nominal_energy_mwh: 'Energy (MWh)', 
    discharge_duration_h: 'Duration (hours)',
    expected_daily_cycles: 'Daily Cycles',
    chemistry: 'Battery Chemistry',
    delivery_schedule: 'Delivery Schedule',
    incoterms: 'Commercial Terms',
    grid_code_compliance: 'Grid Codes',
    round_trip_efficiency_pct: 'Efficiency (%)',
    cycle_life_cycles_at_DoD: 'Cycle Life',
    operating_temperature_range_c: 'Temperature Range (°C)',
    certifications: 'Certifications',
    performance_warranty: 'Warranty',
    price_breakdown: 'Price Structure'
  };

  // Required fields for optimization (Step 2 → Step 3)
  const requiredFields = ['nominal_power_mw', 'discharge_duration_h', 'application', 'expected_daily_cycles', 'delivery_schedule', 'incoterms'];
  
  // Check if field has meaningful value
  const hasValue = (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed !== '' && 
             trimmed !== 'N/A' && 
             trimmed !== 'TBD' && 
             trimmed !== 'To be determined' &&
             trimmed !== 'Extracted from user message via fallback parsing';
    }
    return value !== null && value !== undefined && value !== '';
  };

  // Get populated fields
  const populatedFields = extractedInfo ? 
    Object.keys(extractedInfo)
      .filter(key => hasValue(extractedInfo[key]))
      .map(key => ({
        key,
        value: extractedInfo[key],
        label: fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })) : [];

  // Check required fields completion
  const allRequiredFieldsComplete = requiredFields.every(field => 
    extractedInfo && hasValue(extractedInfo[field])
  );

  // Logic consistency validation (Step 2)
  const validateLogic = () => {
    if (!extractedInfo) return [];
    
    const issues = [];
    const power = parseFloat(extractedInfo.nominal_power_mw) || 0;
    const duration = parseFloat(extractedInfo.discharge_duration_h) || 0;
    const dailyCycles = parseFloat(extractedInfo.expected_daily_cycles) || 0;
    
    // Check daily cycling hours
    if (power > 0 && duration > 0 && dailyCycles > 0) {
      const totalDailyHours = duration * dailyCycles;
      if (totalDailyHours > 24) {
        issues.push(`Invalid cycling: ${dailyCycles} cycles × ${duration}h = ${totalDailyHours.toFixed(1)}h/day (max 24h)`);
      }
    }
    
    return issues;
  };

  const validationIssues = validateLogic();

  // Step 3: Handle optimization request
  const handleOptimize = async () => {
    if (!allRequiredFieldsComplete || isOptimizing || validationIssues.length > 0) {
      return;
    }

    setIsOptimizing(true);
    
    try {
      console.log('🔧 Step 3: Requesting optimization for:', extractedInfo);
      await onOptimizationRequest(extractedInfo);
    } catch (error) {
      console.error('❌ Optimization failed:', error);
      alert('Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Count populated specifications
  const specCount = populatedFields.length;

  console.log('🔍 AutoFilledForm check:', { 
    hasExtractedInfo: !!extractedInfo, 
    populatedFieldsCount: populatedFields.length,
    populatedFields: populatedFields.map(f => f.key)
  });

  if (!extractedInfo) {
    console.log('❌ No extractedInfo, not rendering AutoFilledForm');
    return null;
  }

  if (populatedFields.length === 0) {
    console.log('❌ No populated fields, not rendering AutoFilledForm');
    return null;
  }

  console.log('✅ AutoFilledForm rendering with', specCount, 'specifications');

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Container with glass morphism */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            BESS Summary
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            margin: 0
          }}>
            {specCount} specifications collected
          </p>
        </div>

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <h4 style={{
              color: 'rgba(239, 68, 68, 0.9)',
              fontSize: '14px',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              ⚠️ Issues Detected:
            </h4>
            {validationIssues.map((issue, index) => (
              <div key={index} style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '13px',
                marginBottom: '4px'
              }}>
                • {issue}
              </div>
            ))}
          </div>
        )}

        {/* Floating Cards Grid */}
        <div style={{
          display: 'grid',
          gap: '12px',
          marginBottom: '20px',
          width: '100%',
          overflow: 'hidden'
        }}>
          {populatedFields.map(({ key, value, label }, index) => (
            <div
              key={key}
              className={`floating-card floating-card-${index}`}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                fontWeight: '500',
                flex: '0 0 auto',
                marginRight: '8px'
              }}>
                {label}:
              </span>
              <span style={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '12px',
                fontWeight: '600',
                textAlign: 'right',
                flex: '1 1 auto',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Required Fields Status */}
        <div style={{
          background: allRequiredFieldsComplete 
            ? 'rgba(34, 197, 94, 0.1)' 
            : 'rgba(251, 191, 36, 0.1)',
          border: `1px solid ${allRequiredFieldsComplete 
            ? 'rgba(34, 197, 94, 0.3)' 
            : 'rgba(251, 191, 36, 0.3)'}`,
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            color: allRequiredFieldsComplete 
              ? 'rgba(34, 197, 94, 0.9)' 
              : 'rgba(251, 191, 36, 0.9)',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {allRequiredFieldsComplete 
              ? '✅ Ready for Optimization' 
              : '⏳ Collecting Requirements...'}
          </div>
          {!allRequiredFieldsComplete && (
            <div style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              marginTop: '4px'
            }}>
              Missing: {requiredFields
                .filter(field => !extractedInfo || !hasValue(extractedInfo[field]))
                .map(field => fieldLabels[field] || field)
                .join(', ')}
            </div>
          )}
        </div>

        {/* Step 3: Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={!allRequiredFieldsComplete || isOptimizing || validationIssues.length > 0}
          style={{
            width: '100%',
            padding: '16px',
            background: (allRequiredFieldsComplete && validationIssues.length === 0 && !isOptimizing) 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))'
              : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: (allRequiredFieldsComplete && validationIssues.length === 0 && !isOptimizing) 
              ? 'white' 
              : 'rgba(255, 255, 255, 0.5)',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (allRequiredFieldsComplete && validationIssues.length === 0 && !isOptimizing) 
              ? 'pointer' 
              : 'not-allowed',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: (allRequiredFieldsComplete && validationIssues.length === 0 && !isOptimizing) 
              ? '0 4px 15px rgba(59, 130, 246, 0.3)' 
              : 'none'
          }}
        >
          {isOptimizing 
            ? '🔄 Optimizing BESS Configuration...' 
            : allRequiredFieldsComplete && validationIssues.length === 0
              ? '🎯 Optimize BESS Configuration'
              : '⏳ Complete Requirements First'}
        </button>

        {/* Helper text */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          textAlign: 'center',
          marginTop: '12px',
          margin: '12px 0 0 0'
        }}>
          AI will analyze your requirements and recommend optimal BESS solutions
        </p>
      </div>
    </div>
  );
};

export default AutoFilledForm;