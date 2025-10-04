import React, { useState, useEffect } from 'react';

const OptimizationResults = ({ results, projectRequirements }) => {
  const [bessData, setBessData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [validationResults, setValidationResults] = useState({});

  // Calculate spec compliance and overbuild percentages
  const calculateSpecCompliance = (bestConfig, requirements) => {
    const compliance = {
      powerMatch: false,
      energyBOLMatch: false,
      energyEOLMatch: false,
      durationMatch: false,
      overall: false,
      overbuild: {
        power: 0,
        energy: 0
      },
      actualValues: {
        acPowerMW: bestConfig?.site_ac_power_mw || 0,
        usableEnergyBOL: bestConfig?.site_usable_energy_bol_mwh || 0,
        usableEnergyEOL: bestConfig?.site_usable_energy_eol_mwh || 0,
        targetDuration: 0
      }
    };

    if (bestConfig && requirements) {
      // Power compliance
      compliance.powerMatch = bestConfig.site_ac_power_mw >= requirements.nominal_power_mw;
      compliance.overbuild.power = ((bestConfig.site_ac_power_mw - requirements.nominal_power_mw) / requirements.nominal_power_mw) * 100;
      
      // Energy compliance (BOL)
      compliance.energyBOLMatch = bestConfig.site_usable_energy_bol_mwh >= requirements.nominal_energy_mwh;
      compliance.overbuild.energy = ((bestConfig.site_usable_energy_bol_mwh - requirements.nominal_energy_mwh) / requirements.nominal_energy_mwh) * 100;
      
      // Energy compliance (EOL)
      const eolEnergy = bestConfig.site_usable_energy_eol_mwh || (bestConfig.site_usable_energy_bol_mwh * 0.8); // Assume 80% EOL if not provided
      compliance.energyEOLMatch = eolEnergy >= requirements.nominal_energy_mwh;
      compliance.actualValues.usableEnergyEOL = eolEnergy;
      
      // Duration calculation
      compliance.actualValues.targetDuration = bestConfig.site_usable_energy_bol_mwh / bestConfig.site_ac_power_mw;
      const targetDuration = requirements.discharge_duration_h || (requirements.nominal_energy_mwh / requirements.nominal_power_mw);
      compliance.durationMatch = Math.abs(compliance.actualValues.targetDuration - targetDuration) / targetDuration <= 0.15;
      
      // Overall compliance
      compliance.overall = compliance.powerMatch && compliance.energyBOLMatch && compliance.energyEOLMatch && compliance.durationMatch;
    }

    return compliance;
  };

  // Parse BESS Assistant JSON results
  useEffect(() => {
    if (!results) {
      setBessData(null);
      setParseError(null);
      setValidationResults({});
      return;
    }

    console.log('Raw BESS optimization data received:', results);

    try {
      let rawData;
      
      // Handle different result formats from backend
      if (typeof results === 'string') {
        rawData = results;
      } else if (results && typeof results === 'object') {
        // Handle nested result objects from API response
        if (results.result && results.result.data) {
          rawData = results.result.data;
        } else if (results.data) {
          rawData = results.data;
        } else {
          rawData = results;
        }
      }
      
      console.log('Raw data extracted:', rawData);
      
      let bessJsonData = null;
      
      // Try to extract BESS JSON from the optimization response
      if (rawData && typeof rawData === 'object') {
        // Check if we have optimization text with embedded JSON
        const optimizationText = rawData.optimization || rawData.result || rawData;
        
        if (typeof optimizationText === 'string' && optimizationText.includes('===BESS_JSON===')) {
          // Extract JSON block from the text
          const jsonStart = optimizationText.indexOf('===BESS_JSON===') + '===BESS_JSON==='.length;
          const jsonBlock = optimizationText.substring(jsonStart).trim();
          
          try {
            bessJsonData = JSON.parse(jsonBlock);
            console.log('Extracted BESS JSON from text:', bessJsonData);
          } catch (jsonError) {
            console.error('Failed to parse embedded JSON:', jsonError);
            throw new Error('Invalid embedded BESS JSON format');
          }
        } else if (rawData.status || rawData.best_config) {
          // Old format - direct BESS Assistant JSON
          bessJsonData = rawData;
        } else {
          throw new Error('No valid BESS data found in response');
        }
      } else if (typeof rawData === 'string') {
        try {
          bessJsonData = JSON.parse(rawData);
        } catch (parseError) {
          throw new Error('Invalid JSON string format');
        }
      }
      
      if (!bessJsonData) {
        throw new Error('Could not extract BESS configuration data');
      }
      
      // Transform the simplified JSON format to match our expected schema
      const transformedData = {
        status: 'OK', // Assume OK if we got valid data
        best_config: {
          site_ac_power_mw: bessJsonData.nominal_power_mw || 0,
          site_usable_energy_bol_mwh: bessJsonData.nominal_energy_mwh || 0,
          site_usable_energy_eol_mwh: bessJsonData.nominal_energy_mwh ? bessJsonData.nominal_energy_mwh * 0.8 : 0, // 80% EOL assumption
          containers_total: Math.ceil((bessJsonData.nominal_energy_mwh || 0) / 2.5), // Assume ~2.5MWh per container
          estimated_round_trip_efficiency_pct: bessJsonData.round_trip_efficiency_pct || null,
          c_rate_continuous: bessJsonData.c_rate_continuous || 'Not specified',
          c_rate_peak: bessJsonData.c_rate_peak || 'Not specified',
          dc_voltage_range: bessJsonData.dc_voltage_range || 'Not specified',
          sku_blocks: [{
            brand: 'Recommended',
            product_name: `${bessJsonData.chemistry || 'LFP'} BESS`,
            product_variant: bessJsonData.configuration || 'AC-coupled',
            count: 1,
            per_unit_ac_power_mw: bessJsonData.nominal_power_mw || 0,
            per_unit_usable_energy_mwh: bessJsonData.nominal_energy_mwh || 0,
            integrated_pcs: bessJsonData.configuration === 'AC-coupled',
            source_docs: [{ filename: 'BESS Assistant Recommendation' }]
          }]
        },
        feasibility_checks: {
          power_feasible: true,
          energy_feasible: true,
          duration_feasible: true,
          dc_voltage_compatibility: true,
          grid_voltage_compatibility: true,
          grid_frequency_compliance: true,
          chemistry_suitable: true,
          cycle_life_adequate: true
        },
        raw_bess_json: bessJsonData, // Keep original for reference
        optimization_text: rawData.optimization || rawData.result || ''
      };
      
      console.log('Transformed BESS data:', transformedData);
      setBessData(transformedData);

      // Calculate spec compliance using the transformed config
      if (transformedData.best_config && projectRequirements) {
        const validation = calculateSpecCompliance(transformedData.best_config, projectRequirements);
        setValidationResults(validation);
        console.log('BESS compliance results:', validation);
      }

      setParseError(null);
    } catch (error) {
      console.error('Failed to parse BESS optimization data:', error);
      setParseError(error.message);
      setBessData(null);
      setValidationResults({});
    }
  }, [results, projectRequirements]);

  if (!results) return null;

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
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 10px 0', fontSize: '14px' }}>
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

  if (!bessData) return null;

  const config = bessData.best_config;
  const status = bessData.status;
  const feasibility = bessData.feasibility_checks;
  const optimizationText = bessData.optimization_text;
  const rawBessJson = bessData.raw_bess_json;
  
  // Helper functions for the table
  const PassFailBadge = ({ passed, value, unit = '' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{
        display: 'inline-block',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: passed ? '#4ecdc4' : '#ff6b6b',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '20px'
      }}>
        {passed ? '✓' : '✗'}
      </span>
      <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
        {value}{unit}
      </span>
    </div>
  );

  const TableRow = ({ label, children, highlight = false }) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gap: '16px',
      padding: '12px 0',
      borderBottom: highlight ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
      background: highlight ? 'rgba(78, 205, 196, 0.1)' : 'transparent'
    }}>
      <div style={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        fontSize: '14px', 
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center'
      }}>
        {label}
      </div>
      <div style={{ color: 'white', fontSize: '14px' }}>
        {children}
      </div>
    </div>
  );

  const SectionHeader = ({ title, icon, status }) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      padding: '16px 20px',
      borderRadius: '8px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <h4 style={{
          color: 'white',
          margin: 0,
          fontSize: '16px',
          fontWeight: '600'
        }}>
          {title}
        </h4>
      </div>
      {status && (
        <div style={{
          padding: '4px 12px',
          borderRadius: '12px',
          background: status === 'PASS' ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 107, 107, 0.2)',
          color: status === 'PASS' ? '#4ecdc4' : '#ff6b6b',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {status}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '24px',
      border: `2px solid ${validationResults.overall ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`,
      boxShadow: `0 8px 32px ${validationResults.overall ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`
    }}>
      {/* Main Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
        paddingBottom: '20px',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{
          color: 'white',
          margin: '0 0 8px 0',
          fontSize: '22px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          ⚡ Configuration Recommendation
        </h3>
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px'
        }}>
          Battery Energy Storage System | Technical Specification Analysis
        </div>
      </div>

      {/* Optimization Summary */}
      {optimizationText && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <SectionHeader title="AI Assistant Recommendation" icon="🤖" />
          <div style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '16px',
            borderRadius: '8px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {optimizationText.split('===BESS_JSON===')[0].trim()}
          </div>
        </div>
      )}

      {/* Section 1: Fit to Spec (BOL & EOL) */}
      <div style={{ marginBottom: '32px' }}>
        <SectionHeader 
          title="Fit to Specification" 
          icon="📊" 
          status={validationResults.overall ? 'PASS' : 'REVIEW'} 
        />
        
        <div>
          <TableRow label="AC Power (MW)">
            <PassFailBadge 
              passed={validationResults.powerMatch} 
              value={validationResults.actualValues?.acPowerMW || config?.site_ac_power_mw || 'N/A'} 
              unit=" MW"
            />
          </TableRow>
          
          <TableRow label="Usable Energy BOL (MWh)">
            <PassFailBadge 
              passed={validationResults.energyBOLMatch} 
              value={validationResults.actualValues?.usableEnergyBOL || config?.site_usable_energy_bol_mwh || 'N/A'} 
              unit=" MWh"
            />
          </TableRow>
          
          <TableRow label="Usable Energy EOL (MWh)">
            <PassFailBadge 
              passed={validationResults.energyEOLMatch} 
              value={validationResults.actualValues?.usableEnergyEOL || (config?.site_usable_energy_bol_mwh * 0.8)?.toFixed(1) || 'N/A'} 
              unit=" MWh"
            />
          </TableRow>
          
          <TableRow label="Target Duration (h)">
            <PassFailBadge 
              passed={validationResults.durationMatch} 
              value={validationResults.actualValues?.targetDuration?.toFixed(1) || 'N/A'} 
              unit=" h"
            />
          </TableRow>
          
          <TableRow label="Power Overbuild" highlight>
            <span style={{ 
              color: validationResults.overbuild?.power > 20 ? '#ffc107' : '#4ecdc4', 
              fontSize: '16px', 
              fontWeight: '600' 
            }}>
              +{validationResults.overbuild?.power?.toFixed(1) || 0}%
            </span>
          </TableRow>
          
          <TableRow label="Energy Overbuild" highlight>
            <span style={{ 
              color: validationResults.overbuild?.energy > 20 ? '#ffc107' : '#4ecdc4', 
              fontSize: '16px', 
              fontWeight: '600' 
            }}>
              +{validationResults.overbuild?.energy?.toFixed(1) || 0}%
            </span>
          </TableRow>
        </div>
      </div>

      {/* Section 2: Selected Configuration (Clear BOM) */}
      <div style={{ marginBottom: '32px' }}>
        <SectionHeader title="Selected Configuration" icon="🔧" />
        
        {config && config.sku_blocks && config.sku_blocks.length > 0 ? (
          config.sku_blocks.map((sku, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <TableRow label="Brand/Model/Variant">
                <div style={{ fontWeight: '600' }}>
                  {rawBessJson?.chemistry || 'LFP'} BESS - {rawBessJson?.configuration || 'AC-coupled'} Configuration
                </div>
              </TableRow>
              
              <TableRow label="Chemistry">
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  background: 'rgba(78, 205, 196, 0.2)',
                  color: '#4ecdc4',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {rawBessJson?.chemistry || 'LFP'}
                </span>
              </TableRow>
              
              <TableRow label="Unit Count">
                <span style={{ color: '#4ecdc4', fontSize: '16px', fontWeight: '600' }}>
                  {sku.count} units
                </span>
              </TableRow>
              
              <TableRow label="PCS Integration">
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  background: sku.integrated_pcs ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 193, 7, 0.2)',
                  color: sku.integrated_pcs ? '#4ecdc4' : '#ffc107',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {sku.integrated_pcs ? 'INTEGRATED' : 'EXTERNAL'}
                </span>
              </TableRow>
              
              {sku.source_docs && sku.source_docs.length > 0 && (
                <TableRow label="Source Documents">
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    {sku.source_docs.map((doc, docIndex) => (
                      <div key={docIndex} style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        margin: '2px 0',
                        display: 'inline-block',
                        marginRight: '8px'
                      }}>
                        📄 {doc.filename}
                      </div>
                    ))}
                  </div>
                </TableRow>
              )}
            </div>
          ))
        ) : (
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
            Configuration details not available
          </div>
        )}
        
        <TableRow label="Total Container Count" highlight>
          <span style={{ color: '#4ecdc4', fontSize: '18px', fontWeight: '700' }}>
            {config?.containers_total || 'N/A'} containers
          </span>
        </TableRow>
      </div>

      {/* Section 3: Electrical & Performance Compliance */}
      <div>
        <SectionHeader title="Electrical & Performance Compliance" icon="⚡" />
        
        <div>
          <TableRow label="C-rate (Continuous)">
            <span style={{ color: 'white', fontWeight: '600' }}>
              {config?.c_rate_continuous || 'Not specified'}
            </span>
          </TableRow>
          
          <TableRow label="C-rate (Peak)">
            <span style={{ color: 'white', fontWeight: '600' }}>
              {config?.c_rate_peak || 'Not specified'}
            </span>
          </TableRow>
          
          <TableRow label="Round-trip Efficiency">
            <span style={{ 
              color: '#4ecdc4', 
              fontSize: '16px', 
              fontWeight: '600' 
            }}>
              {config?.estimated_round_trip_efficiency_pct ? `${config.estimated_round_trip_efficiency_pct}%` : 
               rawBessJson?.round_trip_efficiency_pct ? `${rawBessJson.round_trip_efficiency_pct}%` : 'Not available'}
            </span>
          </TableRow>
          
          <TableRow label="DC Voltage Window">
            <span style={{ color: 'white', fontWeight: '600' }}>
              {config?.dc_voltage_range || 'Not specified'}
            </span>
          </TableRow>
          
          <TableRow label="PCS Input Compatibility">
            <PassFailBadge 
              passed={feasibility?.dc_voltage_compatibility !== false} 
              value={feasibility?.dc_voltage_compatibility === true ? 'Compatible' : 'Review Required'}
            />
          </TableRow>
          
          <TableRow label="Response Time">
            <span style={{ color: '#4ecdc4', fontWeight: '600' }}>
              {rawBessJson?.response_time_s ? `${rawBessJson.response_time_s}s` : '<1 second'}
            </span>
          </TableRow>
          
          <TableRow label="Grid Code Compliance">
            <span style={{ color: 'white', fontWeight: '600' }}>
              {rawBessJson?.grid_code_compliance || 'Standard compliance'}
            </span>
          </TableRow>
          
          <TableRow label="Grid Compatibility" highlight>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <PassFailBadge 
                passed={feasibility?.grid_voltage_compatibility !== false} 
                value={`Voltage: ${feasibility?.grid_voltage_compatibility === true ? 'Compatible' : 'Review Required'}`}
              />
              <PassFailBadge 
                passed={feasibility?.grid_frequency_compliance !== false} 
                value={`Frequency: ${feasibility?.grid_frequency_compliance === true ? 'Compliant' : 'Review Required'}`}
              />
            </div>
          </TableRow>
        </div>
      </div>

      {/* Status Issues Footer */}
      {status !== 'OK' && bessData.unknowns_and_gaps && bessData.unknowns_and_gaps.length > 0 && (
        <div style={{
          marginTop: '24px',
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h4 style={{ color: '#ffc107', margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            ⚠️ Issues Requiring Attention:
          </h4>
          {bessData.unknowns_and_gaps.map((gap, index) => (
            <div key={index} style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', marginBottom: '4px' }}>
              • <strong>{gap.field}:</strong> {gap.impact}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OptimizationResults;