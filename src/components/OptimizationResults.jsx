import React, { useState, useEffect } from 'react';

const OptimizationResults = ({ results, projectRequirements }) => {
  const [bessData, setBessData] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [validationResults, setValidationResults] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    configuration: false,
    feasibility: false,
    alternatives: false
  });

  // Validate BESS configuration against project requirements
  const validateBESSConfig = (bestConfig, requirements) => {
    const validation = {
      powerMatch: false,
      energyMatch: false,
      durationMatch: false,
      overall: false,
      issues: [],
      overbuild: {
        power: 0,
        energy: 0
      }
    };

    if (bestConfig && requirements) {
      // Power validation
      const powerOverbuild = ((bestConfig.site_ac_power_mw - requirements.nominal_power_mw) / requirements.nominal_power_mw) * 100;
      validation.overbuild.power = powerOverbuild;
      validation.powerMatch = bestConfig.site_ac_power_mw >= requirements.nominal_power_mw;
      if (!validation.powerMatch) {
        validation.issues.push(`Insufficient power: Required ${requirements.nominal_power_mw}MW, Provided ${bestConfig.site_ac_power_mw}MW`);
      }

      // Energy validation
      const energyOverbuild = ((bestConfig.site_usable_energy_bol_mwh - requirements.nominal_energy_mwh) / requirements.nominal_energy_mwh) * 100;
      validation.overbuild.energy = energyOverbuild;
      validation.energyMatch = bestConfig.site_usable_energy_bol_mwh >= requirements.nominal_energy_mwh;
      if (!validation.energyMatch) {
        validation.issues.push(`Insufficient energy: Required ${requirements.nominal_energy_mwh}MWh, Provided ${bestConfig.site_usable_energy_bol_mwh}MWh`);
      }

      // Duration validation
      const configDuration = bestConfig.site_usable_energy_bol_mwh / bestConfig.site_ac_power_mw;
      const durationMatch = Math.abs(configDuration - requirements.discharge_duration_h) / requirements.discharge_duration_h <= 0.15;
      validation.durationMatch = durationMatch;
      if (!durationMatch) {
        validation.issues.push(`Duration variance: Required ${requirements.discharge_duration_h}h, Configuration ${configDuration.toFixed(1)}h`);
      }

      // Overall validation
      validation.overall = validation.powerMatch && validation.energyMatch && validation.durationMatch;
    }

    return validation;
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
      let jsonData;
      
      // Handle different result formats from backend
      if (typeof results === 'string') {
        jsonData = JSON.parse(results);
      } else if (results && typeof results === 'object') {
        // Handle nested result objects from API response
        if (results.result && results.result.data) {
          jsonData = results.result.data;
        } else if (results.data) {
          jsonData = results.data;
        } else {
          jsonData = results;
        }
      }
      
      // If still string after unwrapping, parse again
      if (typeof jsonData === 'string') {
        jsonData = JSON.parse(jsonData);
      }
      
      console.log('Parsed BESS JSON:', jsonData);
      
      // Validate it matches the expected BESS Assistant schema
      if (!jsonData || !jsonData.status) {
        throw new Error('Invalid BESS Assistant JSON - missing status field');
      }
      
      setBessData(jsonData);

      // Validate configuration against requirements
      if (jsonData.best_config && projectRequirements) {
        const validation = validateBESSConfig(jsonData.best_config, projectRequirements);
        setValidationResults(validation);
        console.log('BESS validation results:', validation);
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const config = bessData.best_config;
  const status = bessData.status;
  const feasibility = bessData.feasibility_checks;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '20px',
      border: `2px solid ${validationResults.overall ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`,
      boxShadow: `0 8px 32px ${validationResults.overall ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: status === 'OK' ? '#4ecdc4' : status === 'NO_FEASIBLE_CONFIG' ? '#ff6b6b' : '#ffc107',
          marginRight: '12px'
        }} />
        <h3 style={{
          color: 'white',
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          flex: 1
        }}>
          🎯 BESS Configuration
        </h3>
        <div style={{
          padding: '4px 12px',
          borderRadius: '12px',
          background: status === 'OK' ? 'rgba(78, 205, 196, 0.2)' : status === 'NO_FEASIBLE_CONFIG' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 193, 7, 0.2)',
          color: status === 'OK' ? '#4ecdc4' : status === 'NO_FEASIBLE_CONFIG' ? '#ff6b6b' : '#ffc107',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {status === 'OK' ? '✅ Feasible' : status === 'NO_FEASIBLE_CONFIG' ? '❌ Not Feasible' : '⚠️ Needs Review'}
        </div>
      </div>

      {/* Status Issues */}
      {status !== 'OK' && bessData.unknowns_and_gaps && bessData.unknowns_and_gaps.length > 0 && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#ffc107', margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            ⚠️ Issues Found:
          </h4>
          {bessData.unknowns_and_gaps.map((gap, index) => (
            <div key={index} style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', marginBottom: '4px' }}>
              • {gap.field}: {gap.impact}
            </div>
          ))}
        </div>
      )}

      {/* Configuration Summary */}
      {config && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            📋 Configuration Summary
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>AC Power:</span>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                  {config.site_ac_power_mw} MW
                </div>
              </div>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>Usable Energy (BOL):</span>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                  {config.site_usable_energy_bol_mwh} MWh
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>Duration:</span>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                  {(config.site_usable_energy_bol_mwh / config.site_ac_power_mw).toFixed(1)} hours
                </div>
              </div>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>Total Containers:</span>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                  {config.containers_total}
                </div>
              </div>
            </div>
          </div>

          {config.estimated_round_trip_efficiency_pct && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>Round Trip Efficiency:</span>
              <div style={{ color: '#4ecdc4', fontSize: '16px', fontWeight: '600' }}>
                {config.estimated_round_trip_efficiency_pct}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* SKU Blocks */}
      {config && config.sku_blocks && config.sku_blocks.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            🔧 Equipment Configuration
          </h4>
          
          {config.sku_blocks.map((sku, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: index < config.sku_blocks.length - 1 ? '12px' : '0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                  {sku.brand} {sku.product_name} {sku.product_variant || ''}
                </div>
                <div style={{ color: '#4ecdc4', fontSize: '16px', fontWeight: '600' }}>
                  {sku.count} units
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '13px' }}>
                {sku.per_unit_ac_power_mw && (
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>AC Power:</span>
                    <div style={{ color: 'white', fontWeight: '600' }}>{sku.per_unit_ac_power_mw} MW</div>
                  </div>
                )}
                {sku.per_unit_usable_energy_mwh && (
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Energy:</span>
                    <div style={{ color: 'white', fontWeight: '600' }}>{sku.per_unit_usable_energy_mwh} MWh</div>
                  </div>
                )}
                {sku.integrated_pcs !== null && (
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>PCS:</span>
                    <div style={{ color: 'white', fontWeight: '600' }}>{sku.integrated_pcs ? 'Integrated' : 'External'}</div>
                  </div>
                )}
              </div>
              
              {sku.source_docs && sku.source_docs.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Source: </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px' }}>
                    {sku.source_docs.map(doc => doc.filename).join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feasibility Checks */}
      {feasibility && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            ✓ Feasibility Checks
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {Object.entries(feasibility).map(([key, value]) => {
              if (key === 'consistency_note' || value === null) return null;
              
              const getColor = (val) => {
                if (val === true) return '#4ecdc4';
                if (val === false) return '#ff6b6b';
                return '#ffc107';
              };
              
              const getIcon = (val) => {
                if (val === true) return '✅';
                if (val === false) return '❌';
                return '⚠️';
              };
              
              return (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px'
                }}>
                  <span style={{ fontSize: '14px' }}>{getIcon(value)}</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              );
            })}
          </div>
          
          {feasibility.consistency_note && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '13px'
            }}>
              <strong>Note:</strong> {feasibility.consistency_note}
            </div>
          )}
        </div>
      )}

      {/* Alternatives */}
      {bessData.alternatives && bessData.alternatives.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            🔄 Alternative Configurations
          </h4>
          
          {bessData.alternatives.slice(0, 3).map((alt, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: index < Math.min(bessData.alternatives.length, 3) - 1 ? '12px' : '0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                  Alternative {index + 1}
                </div>
                <div style={{ color: '#ffc107', fontSize: '14px', fontWeight: '600' }}>
                  +{alt.delta_overbuild_pct?.toFixed(1) || 0}% overbuild
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Power:</span>
                  <div style={{ color: 'white', fontWeight: '600' }}>{alt.site_ac_power_mw} MW</div>
                </div>
                <div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Energy:</span>
                  <div style={{ color: 'white', fontWeight: '600' }}>{alt.site_usable_energy_bol_mwh} MWh</div>
                </div>
                <div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Containers:</span>
                  <div style={{ color: 'white', fontWeight: '600' }}>{alt.containers_total}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OptimizationResults;