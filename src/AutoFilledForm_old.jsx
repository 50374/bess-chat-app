import React, { useState } from 'react';

const AutoFilledForm = ({ extractedInfo, onSubmit }) => {
  const [form, setForm] = useState({
    // System Scope
    application: extractedInfo?.application || '',
    configuration: extractedInfo?.configuration || '',
    delivery_scope: extractedInfo?.delivery_scope || '',
    
    // Performance Requirements
    nominal_energy_mwh: extractedInfo?.nominal_energy_mwh || '',
    nominal_power_mw: extractedInfo?.nominal_power_mw || '',
    discharge_duration_h: extractedInfo?.discharge_duration_h || '',
    round_trip_efficiency_pct: extractedInfo?.round_trip_efficiency_pct || '',
    response_time_s: extractedInfo?.response_time_s || '',
    grid_code_compliance: extractedInfo?.grid_code_compliance || '',
    
    // Battery Specifications
    chemistry: extractedInfo?.chemistry || '',
    cycle_life_cycles_at_DoD: extractedInfo?.cycle_life_cycles_at_DoD || '',
    calendar_life_years: extractedInfo?.calendar_life_years || '',
    operating_temperature_range_c: extractedInfo?.operating_temperature_range_c || '',
    degradation_capacity_fade_pct_per_year: extractedInfo?.degradation_capacity_fade_pct_per_year || '',
    
    // Safety & Standards
    certifications: extractedInfo?.certifications || '',
    bms_capabilities: extractedInfo?.bms_capabilities || '',
    fire_suppression_system: extractedInfo?.fire_suppression_system || '',
    thermal_runaway_prevention: extractedInfo?.thermal_runaway_prevention || '',
    
    // Infrastructure & Integration
    enclosure_type: extractedInfo?.enclosure_type || '',
    environmental_protection: extractedInfo?.environmental_protection || '',
    ems_scada_protocols: extractedInfo?.ems_scada_protocols || '',
    black_start_capability: extractedInfo?.black_start_capability || false,
    
    // Warranty & Service
    performance_warranty: extractedInfo?.performance_warranty || '',
    availability_guarantee_pct: extractedInfo?.availability_guarantee_pct || '',
    service_om_package: extractedInfo?.service_om_package || '',
    end_of_life_recycling: extractedInfo?.end_of_life_recycling || '',
    
    // Commercial Parameters
    delivery_schedule: extractedInfo?.delivery_schedule || '',
    price_breakdown: extractedInfo?.price_breakdown || '',
    payment_terms: extractedInfo?.payment_terms || '',
    incoterms: extractedInfo?.incoterms || '',
    supplier_references: extractedInfo?.supplier_references || '',
    
    // Meta
    assumptions: extractedInfo?.assumptions || '',
    open_questions: extractedInfo?.open_questions || '',
    
    // Contact
    contact_name: '',
    contact_email: ''
  });

  // Update form state if extractedInfo changes (for subsequent chat extractions)
  React.useEffect(() => {
    if (extractedInfo) {
      setForm(prevForm => ({
        // System Scope
        application: extractedInfo?.application || prevForm.application,
        configuration: extractedInfo?.configuration || prevForm.configuration,
        delivery_scope: extractedInfo?.delivery_scope || prevForm.delivery_scope,
        
        // Performance Requirements
        nominal_energy_mwh: extractedInfo?.nominal_energy_mwh || prevForm.nominal_energy_mwh,
        nominal_power_mw: extractedInfo?.nominal_power_mw || prevForm.nominal_power_mw,
        discharge_duration_h: extractedInfo?.discharge_duration_h || prevForm.discharge_duration_h,
        round_trip_efficiency_pct: extractedInfo?.round_trip_efficiency_pct || prevForm.round_trip_efficiency_pct,
        response_time_s: extractedInfo?.response_time_s || prevForm.response_time_s,
        grid_code_compliance: extractedInfo?.grid_code_compliance || prevForm.grid_code_compliance,
        
        // Battery Specifications
        chemistry: extractedInfo?.chemistry || prevForm.chemistry,
        cycle_life_cycles_at_DoD: extractedInfo?.cycle_life_cycles_at_DoD || prevForm.cycle_life_cycles_at_DoD,
        calendar_life_years: extractedInfo?.calendar_life_years || prevForm.calendar_life_years,
        operating_temperature_range_c: extractedInfo?.operating_temperature_range_c || prevForm.operating_temperature_range_c,
        degradation_capacity_fade_pct_per_year: extractedInfo?.degradation_capacity_fade_pct_per_year || prevForm.degradation_capacity_fade_pct_per_year,
        
        // Safety & Standards
        certifications: extractedInfo?.certifications || prevForm.certifications,
        bms_capabilities: extractedInfo?.bms_capabilities || prevForm.bms_capabilities,
        fire_suppression_system: extractedInfo?.fire_suppression_system || prevForm.fire_suppression_system,
        thermal_runaway_prevention: extractedInfo?.thermal_runaway_prevention || prevForm.thermal_runaway_prevention,
        
        // Infrastructure & Integration
        enclosure_type: extractedInfo?.enclosure_type || prevForm.enclosure_type,
        environmental_protection: extractedInfo?.environmental_protection || prevForm.environmental_protection,
        ems_scada_protocols: extractedInfo?.ems_scada_protocols || prevForm.ems_scada_protocols,
        black_start_capability: extractedInfo?.black_start_capability !== undefined ? extractedInfo.black_start_capability : prevForm.black_start_capability,
        
        // Warranty & Service
        performance_warranty: extractedInfo?.performance_warranty || prevForm.performance_warranty,
        availability_guarantee_pct: extractedInfo?.availability_guarantee_pct || prevForm.availability_guarantee_pct,
        service_om_package: extractedInfo?.service_om_package || prevForm.service_om_package,
        end_of_life_recycling: extractedInfo?.end_of_life_recycling || prevForm.end_of_life_recycling,
        
        // Commercial Parameters
        delivery_schedule: extractedInfo?.delivery_schedule || prevForm.delivery_schedule,
        price_breakdown: extractedInfo?.price_breakdown || prevForm.price_breakdown,
        payment_terms: extractedInfo?.payment_terms || prevForm.payment_terms,
        incoterms: extractedInfo?.incoterms || prevForm.incoterms,
        supplier_references: extractedInfo?.supplier_references || prevForm.supplier_references,
        
        // Meta
        assumptions: extractedInfo?.assumptions || prevForm.assumptions,
        open_questions: extractedInfo?.open_questions || prevForm.open_questions,
        
        // Contact (preserve existing values)
        contact_name: prevForm.contact_name,
        contact_email: prevForm.contact_email
      }));
    }
  }, [extractedInfo]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  // Helper function to check if a field has meaningful content
  const hasValue = (value) => {
    if (typeof value === 'boolean') return value === true; // Only show true boolean values
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value > 0;
    return false;
  };

  // Helper function to get field display name
  const getFieldLabel = (key) => {
    const labels = {
      // System Scope
      application: 'Application Type',
      configuration: 'Configuration',
      delivery_scope: 'Delivery Scope',
      
      // Performance Requirements
      nominal_energy_mwh: 'Nominal Energy (MWh)',
      nominal_power_mw: 'Nominal Power (MW)',
      discharge_duration_h: 'Discharge Duration (hours)',
      round_trip_efficiency_pct: 'Round Trip Efficiency (%)',
      response_time_s: 'Response Time (seconds)',
      grid_code_compliance: 'Grid Code Compliance',
      
      // Battery Specifications
      chemistry: 'Battery Chemistry',
      cycle_life_cycles_at_DoD: 'Cycle Life (cycles at DoD)',
      calendar_life_years: 'Calendar Life (years)',
      operating_temperature_range_c: 'Operating Temperature Range (°C)',
      degradation_capacity_fade_pct_per_year: 'Capacity Fade (%/year)',
      
      // Safety & Standards
      certifications: 'Certifications Required',
      bms_capabilities: 'BMS Capabilities',
      fire_suppression_system: 'Fire Suppression System',
      thermal_runaway_prevention: 'Thermal Runaway Prevention',
      
      // Infrastructure & Integration
      enclosure_type: 'Enclosure Type',
      environmental_protection: 'Environmental Protection',
      ems_scada_protocols: 'EMS/SCADA Protocols',
      black_start_capability: 'Black Start Capability',
      
      // Warranty & Service
      performance_warranty: 'Performance Warranty',
      availability_guarantee_pct: 'Availability Guarantee (%)',
      service_om_package: 'Service & O&M Package',
      end_of_life_recycling: 'End-of-Life Recycling',
      
      // Commercial Parameters
      delivery_schedule: 'Delivery Schedule',
      price_breakdown: 'Price Breakdown',
      payment_terms: 'Payment Terms',
      incoterms: 'Incoterms',
      supplier_references: 'Supplier References',
      
      // Meta
      assumptions: 'Assumptions',
      open_questions: 'Open Questions'
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to get section for a field
  const getFieldSection = (key) => {
    const sections = {
      application: 'System Scope',
      configuration: 'System Scope',
      delivery_scope: 'System Scope',
      
      nominal_energy_mwh: 'Performance Requirements',
      nominal_power_mw: 'Performance Requirements',
      discharge_duration_h: 'Performance Requirements',
      round_trip_efficiency_pct: 'Performance Requirements',
      response_time_s: 'Performance Requirements',
      grid_code_compliance: 'Performance Requirements',
      
      chemistry: 'Battery Specifications',
      cycle_life_cycles_at_DoD: 'Battery Specifications',
      calendar_life_years: 'Battery Specifications',
      operating_temperature_range_c: 'Battery Specifications',
      degradation_capacity_fade_pct_per_year: 'Battery Specifications',
      
      certifications: 'Safety & Standards',
      bms_capabilities: 'Safety & Standards',
      fire_suppression_system: 'Safety & Standards',
      thermal_runaway_prevention: 'Safety & Standards',
      
      enclosure_type: 'Infrastructure & Integration',
      environmental_protection: 'Infrastructure & Integration',
      ems_scada_protocols: 'Infrastructure & Integration',
      black_start_capability: 'Infrastructure & Integration',
      
      performance_warranty: 'Warranty & Service',
      availability_guarantee_pct: 'Warranty & Service',
      service_om_package: 'Warranty & Service',
      end_of_life_recycling: 'Warranty & Service',
      
      delivery_schedule: 'Commercial Parameters',
      price_breakdown: 'Commercial Parameters',
      payment_terms: 'Commercial Parameters',
      incoterms: 'Commercial Parameters',
      supplier_references: 'Commercial Parameters',
      
      assumptions: 'Additional Information',
      open_questions: 'Additional Information'
    };
    return sections[key] || 'Other';
  };

  // Group fields by section that have values
  const groupedFields = {};
  Object.entries(form).forEach(([key, value]) => {
    if (hasValue(value) && key !== 'contact_name' && key !== 'contact_email') { // Exclude contact fields from floating cards
      const section = getFieldSection(key);
      if (!groupedFields[section]) {
        groupedFields[section] = [];
      }
      groupedFields[section].push({ key, value, label: getFieldLabel(key) });
    }
  });

  // If no fields have values, don't render the form
  if (Object.keys(groupedFields).length === 0) {
    return null;
  }

  return (
    <div style={{
      margin: '32px auto',
      maxWidth: '500px',
      width: '100%',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(10px)',
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid rgba(163, 179, 163, 0.3)',
      padding: 24,
      maxHeight: '85vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginBottom: 24, color: '#4a5d4a' }}>BESS RFQ Summary</h3>
      <p style={{ marginBottom: 16 }}>Review and confirm the BESS specifications gathered from our conversation.</p>
      <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* System Scope */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>System Scope</h4>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Application: *
          <input type="text" name="application" value={form.application} onChange={handleChange} 
            placeholder="e.g., peak-shaving, frequency regulation, renewable integration"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} required />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Configuration:
          <input type="text" name="configuration" value={form.configuration} onChange={handleChange} 
            placeholder="e.g., AC-coupled, DC-coupled, hybrid"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Delivery Scope:
          <textarea name="delivery_scope" value={form.delivery_scope} onChange={handleChange} 
            placeholder="Battery modules, inverters, transformers, HVAC, BMS/EMS, fire suppression, housing..."
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} rows={2} />
        </label>

        {/* Performance Requirements */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>Performance Requirements</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Energy Capacity (MWh):
            <input type="number" name="nominal_energy_mwh" value={form.nominal_energy_mwh} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Power Rating (MW): *
            <input type="number" name="nominal_power_mw" value={form.nominal_power_mw} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} required />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Duration (h): *
            <input type="number" name="discharge_duration_h" value={form.discharge_duration_h} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} required />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Efficiency (%):
            <input type="number" name="round_trip_efficiency_pct" value={form.round_trip_efficiency_pct} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Response Time (s):
            <input type="number" name="response_time_s" value={form.response_time_s} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Grid Code Compliance:
          <input type="text" name="grid_code_compliance" value={form.grid_code_compliance} onChange={handleChange} 
            placeholder="e.g., ENTSO-E, IEEE 1547, national standards"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
        </label>

        {/* Battery Specifications */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>Battery Specifications</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Chemistry:
            <input type="text" name="chemistry" value={form.chemistry} onChange={handleChange} 
              placeholder="e.g., LFP, NMC, flow battery"
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Calendar Life (years):
            <input type="number" name="calendar_life_years" value={form.calendar_life_years} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Cycle Life (cycles at DoD):
          <input type="text" name="cycle_life_cycles_at_DoD" value={form.cycle_life_cycles_at_DoD} onChange={handleChange} 
            placeholder="e.g., 6000 cycles at 80% DoD"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Operating Temp Range (°C):
            <input type="text" name="operating_temperature_range_c" value={form.operating_temperature_range_c} onChange={handleChange} 
              placeholder="e.g., -10,45"
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Degradation (% per year):
            <input type="number" name="degradation_capacity_fade_pct_per_year" value={form.degradation_capacity_fade_pct_per_year} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
        </div>

        {/* Safety & Standards */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>Safety & Standards</h4>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Certifications:
          <input type="text" name="certifications" value={form.certifications} onChange={handleChange} 
            placeholder="e.g., UL 9540/9540A, IEC 62933, NFPA 855, CE"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          BMS Capabilities:
          <textarea name="bms_capabilities" value={form.bms_capabilities} onChange={handleChange} 
            placeholder="Monitoring, protection, SoC balancing, thermal management..."
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} rows={2} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Fire Suppression:
            <input type="text" name="fire_suppression_system" value={form.fire_suppression_system} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Thermal Runaway Prevention:
            <input type="text" name="thermal_runaway_prevention" value={form.thermal_runaway_prevention} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
        </div>

        {/* Infrastructure & Integration */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>Infrastructure & Integration</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Enclosure Type:
            <input type="text" name="enclosure_type" value={form.enclosure_type} onChange={handleChange} 
              placeholder="e.g., containerized, building-integrated"
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Environmental Protection:
            <input type="text" name="environmental_protection" value={form.environmental_protection} onChange={handleChange} 
              placeholder="e.g., IP54, seismic resilient"
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          EMS/SCADA Protocols:
          <input type="text" name="ems_scada_protocols" value={form.ems_scada_protocols} onChange={handleChange} 
            placeholder="e.g., Modbus, IEC 61850, DNP3"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <input type="checkbox" name="black_start_capability" checked={form.black_start_capability} onChange={e => setForm({...form, black_start_capability: e.target.checked})} 
            style={{ marginRight: 8 }} />
          Black Start Capability Required
        </label>

        {/* Warranty & Service */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>Warranty & Service</h4>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Performance Warranty:
          <input type="text" name="performance_warranty" value={form.performance_warranty} onChange={handleChange} 
            placeholder="e.g., 80% capacity after 10 years"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Availability Guarantee (%):
            <input type="number" name="availability_guarantee_pct" value={form.availability_guarantee_pct} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            End-of-Life Recycling:
            <input type="text" name="end_of_life_recycling" value={form.end_of_life_recycling} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Service & O&M Package:
          <textarea name="service_om_package" value={form.service_om_package} onChange={handleChange} 
            placeholder="Remote monitoring, spare parts, long-term service agreements..."
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} rows={2} />
        </label>

        {/* Commercial Parameters */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>Commercial Parameters</h4>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Delivery Schedule: *
          <input type="text" name="delivery_schedule" value={form.delivery_schedule} onChange={handleChange} 
            placeholder="Lead times for manufacturing, transport, commissioning"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} required />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Price Breakdown:
          <textarea name="price_breakdown" value={form.price_breakdown} onChange={handleChange} 
            placeholder="Equipment, transport, installation, commissioning, O&M..."
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} rows={2} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Payment Terms:
            <input type="text" name="payment_terms" value={form.payment_terms} onChange={handleChange} 
              placeholder="e.g., milestones linked to delivery"
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Incoterms: *
            <input type="text" name="incoterms" value={form.incoterms} onChange={handleChange} 
              placeholder="e.g., DDP site, CIF port"
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} required />
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Supplier References:
          <textarea name="supplier_references" value={form.supplier_references} onChange={handleChange} 
            placeholder="List of comparable deployed projects..."
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} rows={2} />
        </label>

        {/* Meta Information */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>Additional Information</h4>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Assumptions Made:
          <textarea name="assumptions" value={form.assumptions} onChange={handleChange} 
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} rows={2} readOnly />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          Open Questions:
          <textarea name="open_questions" value={form.open_questions} onChange={handleChange} 
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} rows={2} readOnly />
        </label>

        {/* Contact Information */}
        <h4 style={{ marginTop: 20, marginBottom: 12, color: '#2563eb' }}>Contact Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Name:
            <input type="text" name="contact_name" value={form.contact_name} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} required />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Email:
            <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} 
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }} required />
          </label>
        </div>

        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #6b7c6b, #4a5d4a)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 20,
            width: '100%'
          }}
        >
          Submit BESS RFQ
        </button>
      </form>
    </div>
  );
};

export default AutoFilledForm;
