import { useState, useEffect } from 'react';

const FloatingProjectCards = ({
  extractedInfo,
  projectData,
  onDataUpdate,
  onOptimize,
  isOptimizeEnabled
}) => {
  const [cards, setCards] = useState({
    // Required fields for optimization (6 essential fields)
    nominalPower: { value: '', unit: 'MW', required: true, valid: false },
    nominalEnergy: { value: '', unit: 'MWh', required: true, valid: false },
    dailyCycles: { value: '', unit: 'cycles/day', required: true, valid: false },
    incoterms: { value: '', unit: '', required: true, valid: false },
    deliverySchedule: { value: '', unit: '', required: true, valid: false },
    application: { value: '', unit: '', required: true, valid: false },
    
    // Optional fields (nice to have)
    dischargeDuration: { value: '', unit: 'hours', required: false, valid: true },
    gridCode: { value: '', unit: '', required: false, valid: true },
    chemistry: { value: '', unit: '', required: false, valid: true },
    configuration: { value: '', unit: '', required: false, valid: true },
    efficiency: { value: '', unit: '%', required: false, valid: true }
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Update cards when extractedInfo changes
  useEffect(() => {
    if (extractedInfo) {
      const updatedCards = { ...cards };
      
      // Handle all possible BESS project parameters from the Assistant
      if (extractedInfo.nominal_power_mw || extractedInfo.power_rating_mw) {
        updatedCards.nominalPower.value = extractedInfo.nominal_power_mw || extractedInfo.power_rating_mw;
        updatedCards.nominalPower.valid = true;
      }
      if (extractedInfo.nominal_energy_mwh || extractedInfo.energy_capacity_mwh) {
        updatedCards.nominalEnergy.value = extractedInfo.nominal_energy_mwh || extractedInfo.energy_capacity_mwh;
        updatedCards.nominalEnergy.valid = true;
      }
      if (extractedInfo.discharge_duration_h || extractedInfo.duration_hours) {
        updatedCards.dischargeDuration.value = extractedInfo.discharge_duration_h || extractedInfo.duration_hours;
        updatedCards.dischargeDuration.valid = true;
      }
      if (extractedInfo.expected_daily_cycles || extractedInfo.daily_cycles) {
        const cycles = extractedInfo.expected_daily_cycles || extractedInfo.daily_cycles;
        updatedCards.dailyCycles.value = cycles;
        updatedCards.dailyCycles.valid = validateDailyCycles(cycles);
      }
      if (extractedInfo.application || extractedInfo.use_case) {
        updatedCards.application.value = extractedInfo.application || extractedInfo.use_case;
        updatedCards.application.valid = true;
      }
      if (extractedInfo.delivery_schedule || extractedInfo.delivery_date || extractedInfo.timeline) {
        updatedCards.deliverySchedule.value = extractedInfo.delivery_schedule || extractedInfo.delivery_date || extractedInfo.timeline;
        updatedCards.deliverySchedule.valid = true;
      }
      if (extractedInfo.incoterms || extractedInfo.shipping_terms) {
        updatedCards.incoterms.value = extractedInfo.incoterms || extractedInfo.shipping_terms;
        updatedCards.incoterms.valid = true;
      }
      if (extractedInfo.grid_code_compliance || extractedInfo.grid_code) {
        updatedCards.gridCode.value = extractedInfo.grid_code_compliance || extractedInfo.grid_code;
        updatedCards.gridCode.valid = true;
      }
      if (extractedInfo.chemistry_preference || extractedInfo.battery_chemistry) {
        updatedCards.chemistry.value = extractedInfo.chemistry_preference || extractedInfo.battery_chemistry;
        updatedCards.chemistry.valid = true;
      }
      if (extractedInfo.configuration || extractedInfo.system_configuration) {
        updatedCards.configuration.value = extractedInfo.configuration || extractedInfo.system_configuration;
        updatedCards.configuration.valid = true;
      }
      if (extractedInfo.efficiency || extractedInfo.system_efficiency) {
        const eff = extractedInfo.efficiency || extractedInfo.system_efficiency;
        updatedCards.efficiency.value = typeof eff === 'string' ? eff.replace('%', '') : eff;
        updatedCards.efficiency.valid = true;
      }
      
      setCards(updatedCards);
      
      // Convert card data to project data format
      const projectUpdate = {
        nominal_power_mw: parseFloat(updatedCards.nominalPower.value) || 0,
        nominal_energy_mwh: parseFloat(updatedCards.nominalEnergy.value) || 0,
        discharge_duration_h: parseFloat(updatedCards.dischargeDuration.value) || 0,
        expected_daily_cycles: parseFloat(updatedCards.dailyCycles.value) || 0,
        application: updatedCards.application.value,
        delivery_schedule: updatedCards.deliverySchedule.value,
        incoterms: updatedCards.incoterms.value,
        grid_code_compliance: updatedCards.gridCode.value,
        chemistry_preference: updatedCards.chemistry.value,
        configuration: updatedCards.configuration.value,
        efficiency: parseFloat(updatedCards.efficiency.value) || 0
      };
      
      onDataUpdate(projectUpdate);
    }
  }, [extractedInfo]);

  const validateDailyCycles = (cycles) => {
    const numCycles = parseFloat(cycles);
    return numCycles >= 0.1 && numCycles <= 10; // Reasonable range for daily cycles
  };

  const validateNumericField = (value, min = 0, max = Infinity) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > min && num <= max;
  };

  const handleCardUpdate = (cardKey, newValue) => {
    const updatedCards = { ...cards };
    updatedCards[cardKey].value = newValue;
    
    // Validate the field
    switch (cardKey) {
      case 'nominalPower':
        updatedCards[cardKey].valid = validateNumericField(newValue, 0, 1000);
        break;
      case 'nominalEnergy':
        updatedCards[cardKey].valid = validateNumericField(newValue, 0, 10000);
        break;
      case 'dischargeDuration':
        updatedCards[cardKey].valid = validateNumericField(newValue, 0.1, 24);
        break;
      case 'dailyCycles':
        updatedCards[cardKey].valid = validateDailyCycles(newValue);
        break;
      case 'incoterms':
        updatedCards[cardKey].valid = newValue.trim().length > 0;
        break;
      case 'deliverySchedule':
        updatedCards[cardKey].valid = newValue.trim().length > 0;
        break;
      case 'application':
        updatedCards[cardKey].valid = newValue.trim().length > 0;
        break;
      default:
        updatedCards[cardKey].valid = true;
    }
    
    setCards(updatedCards);
    
    // Update project data
    const projectUpdate = {
      nominal_power_mw: parseFloat(updatedCards.nominalPower.value) || 0,
      nominal_energy_mwh: parseFloat(updatedCards.nominalEnergy.value) || 0,
      discharge_duration_h: parseFloat(updatedCards.dischargeDuration.value) || 0,
      expected_daily_cycles: parseFloat(updatedCards.dailyCycles.value) || 0,
      application: updatedCards.application.value,
      delivery_schedule: updatedCards.deliverySchedule.value,
      incoterms: updatedCards.incoterms.value,
      grid_code_compliance: updatedCards.gridCode.value,
      chemistry_preference: updatedCards.chemistry.value,
      configuration: updatedCards.configuration.value,
      efficiency: parseFloat(updatedCards.efficiency.value) || 0
    };
    
    onDataUpdate(projectUpdate);
  };

  const handleOptimize = () => {
    // Validate all required fields before optimization
    const requiredValid = Object.entries(cards)
      .filter(([_, card]) => card.required)
      .every(([_, card]) => card.valid && card.value);
    
    if (requiredValid) {
      onOptimize(projectData);
    }
  };

  const CardComponent = ({ cardKey, card, title, placeholder }) => (
    <div
      style={{
        background: card.valid 
          ? 'rgba(78, 205, 196, 0.15)' 
          : card.required 
            ? 'rgba(255, 107, 107, 0.15)' 
            : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: `2px solid ${
          card.valid 
            ? 'rgba(78, 205, 196, 0.5)' 
            : card.required 
              ? 'rgba(255, 107, 107, 0.5)' 
              : 'rgba(255, 255, 255, 0.2)'
        }`,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        transition: 'all 0.3s ease',
        transform: card.valid ? 'scale(1.02)' : 'scale(1)',
        boxShadow: card.valid 
          ? '0 8px 32px rgba(78, 205, 196, 0.3)' 
          : '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: card.valid ? '#4ecdc4' : card.required ? '#ff6b6b' : '#ffd93d',
            marginRight: '8px'
          }}
        />
        <h4 style={{
          color: 'white',
          margin: 0,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {title}
          {card.required && <span style={{ color: '#ff6b6b' }}>*</span>}
        </h4>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type={['nominalPower', 'nominalEnergy', 'dischargeDuration', 'dailyCycles'].includes(cardKey) ? 'number' : 'text'}
          value={card.value}
          onChange={(e) => handleCardUpdate(cardKey, e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'white',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        {card.unit && (
          <span style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            minWidth: 'fit-content'
          }}>
            {card.unit}
          </span>
        )}
      </div>
      
      {/* Validation feedback */}
      {card.required && !card.valid && card.value && (
        <div style={{
          marginTop: '4px',
          color: '#ff6b6b',
          fontSize: '11px'
        }}>
          {cardKey === 'dailyCycles' ? 'Daily cycles should be between 0.1 and 10' : 'Invalid value'}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '16px',
        textAlign: 'center'
      }}>
        <h3 style={{
          color: 'white',
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Project Requirements
        </h3>
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px'
        }}>
          Complete 6 required fields to enable optimization
        </div>
      </div>

      {/* Floating Cards */}
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
        {/* Required Fields - Only 5 needed for optimization */}
        <CardComponent
          cardKey="nominalPower"
          card={cards.nominalPower}
          title="⚡ Power Rating"
          placeholder="e.g., 10"
        />
        
        <CardComponent
          cardKey="nominalEnergy"
          card={cards.nominalEnergy}
          title="🔋 Energy Capacity"
          placeholder="e.g., 40"
        />
        
        <CardComponent
          cardKey="dailyCycles"
          card={cards.dailyCycles}
          title="🔄 Daily Cycles"
          placeholder="e.g., 1.5"
        />
        
        <CardComponent
          cardKey="incoterms"
          card={cards.incoterms}
          title="🚚 Incoterms"
          placeholder="e.g., DDP"
        />
        
        <CardComponent
          cardKey="deliverySchedule"
          card={cards.deliverySchedule}
          title="📅 Delivery Schedule"
          placeholder="e.g., Q2 2024"
        />
        
        <CardComponent
          cardKey="application"
          card={cards.application}
          title="🎯 Application"
          placeholder="e.g., Peak Shaving"
        />
        
        {/* Optional Fields - Nice to have */}
        <CardComponent
          cardKey="dischargeDuration"
          card={cards.dischargeDuration}
          title="Duration (Optional)"
          placeholder="e.g., 4"
        />
        
        <CardComponent
          cardKey="gridCode"
          card={cards.gridCode}
          title="Grid Code"
          placeholder="e.g., IEEE 1547"
        />
        
        <CardComponent
          cardKey="chemistry"
          card={cards.chemistry}
          title="Battery Chemistry"
          placeholder="e.g., LiFePO4"
        />
        
        <CardComponent
          cardKey="configuration"
          card={cards.configuration}
          title="Configuration"
          placeholder="e.g., Centralized"
        />
        
        <CardComponent
          cardKey="efficiency"
          card={cards.efficiency}
          title="Efficiency"
          placeholder="e.g., 95"
        />
      </div>

      {/* Optimize Button */}
      <button
        onClick={handleOptimize}
        disabled={!isOptimizeEnabled}
        style={{
          background: isOptimizeEnabled 
            ? 'linear-gradient(135deg, #4ecdc4, #44a08d)' 
            : 'rgba(255, 255, 255, 0.1)',
          color: isOptimizeEnabled ? 'white' : 'rgba(255, 255, 255, 0.5)',
          border: 'none',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: isOptimizeEnabled ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          transform: isOptimizeEnabled ? 'scale(1)' : 'scale(0.95)',
          boxShadow: isOptimizeEnabled 
            ? '0 8px 32px rgba(78, 205, 196, 0.4)' 
            : 'none'
        }}
      >
        {isOptimizeEnabled ? '🚀 Optimize BESS Selection' : '⏳ Complete 6 Required Fields'}
      </button>
    </div>
  );
};

export default FloatingProjectCards;