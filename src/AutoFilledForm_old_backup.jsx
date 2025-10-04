import React, { useState } from 'react';

const AutoFilledForm = ({ extractedInfo, onSubmit, onRequestMissingFields, renderSummaryOnly = false, renderContactAndSubmit = false, maxWidth }) => {
  // Add CSS for Railway-style scrollbars and card animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Railway-style scrollbars */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      /* Firefox scrollbar */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
      }
      
      @keyframes expandCard {
        0% {
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0px);
        }
      }
        }
        100% {
          opacity: 1;
          transform: translateY(0px);
        }
      }
      
      /* Staggered animation classes */
      .floating-card-0 { animation: expandCard 0.8s ease-out 0s both; }
      .floating-card-1 { animation: expandCard 0.8s ease-out 0.2s both; }
      .floating-card-2 { animation: expandCard 0.8s ease-out 0.4s both; }
      .floating-card-3 { animation: expandCard 0.8s ease-out 0.6s both; }
      .floating-card-4 { animation: expandCard 0.8s ease-out 0.8s both; }
      .floating-card-5 { animation: expandCard 0.8s ease-out 1.0s both; }
      .floating-card-6 { animation: expandCard 0.8s ease-out 1.2s both; }
      .floating-card-7 { animation: expandCard 0.8s ease-out 1.4s both; }
      .floating-card-8 { animation: expandCard 0.8s ease-out 1.6s both; }
      .floating-card-9 { animation: expandCard 0.8s ease-out 1.8s both; }
      .floating-card-10 { animation: expandCard 0.8s ease-out 2.0s both; }
      .floating-card-11 { animation: expandCard 0.8s ease-out 2.2s both; }
      .floating-card-12 { animation: expandCard 0.8s ease-out 2.4s both; }
      .floating-card-13 { animation: expandCard 0.8s ease-out 2.6s both; }
      .floating-card-14 { animation: expandCard 0.8s ease-out 2.8s both; }
      .floating-card-15 { animation: expandCard 0.8s ease-out 3.0s both; }
      
      .floating-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        animation-fill-mode: both;
      }
      
      .floating-card:hover {
        transform: translateY(-8px) scale(1.02) !important;
        box-shadow: 0 8px 25px rgba(107, 124, 107, 0.25) !important;
        z-index: 10;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      .tooltip {
        position: absolute;
        bottom: -50px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(45, 52, 40, 0.95);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 20;
        animation: tooltipFadeIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .tooltip::before {
        content: '';
        position: absolute;
        top: -5px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid rgba(45, 52, 40, 0.95);
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // State for hover effects and tooltips
  const [hoveredField, setHoveredField] = React.useState(null);

  // Field definitions for tooltips
  const fieldDefinitions = {
    application: "How the BESS will be used (commercial, industrial, grid-scale, etc.)",
    configuration: "System architecture and layout arrangement",
    delivery_scope: "What components and services are included in the delivery",
    nominal_energy_mwh: "Total energy storage capacity in megawatt-hours",
    nominal_power_mw: "Maximum power output/input in megawatts",
    discharge_duration_h: "How long the system can discharge at rated power",
    expected_daily_cycles: "Number of charge/discharge cycles per day",
    round_trip_efficiency_pct: "Energy efficiency from charge to discharge",
    response_time_s: "Time to reach full power output from standby",
    grid_code_compliance: "Grid connection standards and regulations",
    chemistry: "Battery technology type (LFP, NMC, etc.)",
    cycle_life_cycles_at_DoD: "Expected battery life in charge/discharge cycles",
    calendar_life_years: "Expected battery life in years regardless of usage",
    operating_temperature_range_c: "Temperature range for normal operation",
    degradation_capacity_fade_pct_per_year: "Annual capacity loss percentage",
    certifications: "Required safety and quality certifications",
    bms_capabilities: "Battery Management System features and functions",
    fire_suppression_system: "Fire safety and suppression requirements",
    thermal_runaway_prevention: "Safety measures against thermal runaway",
    enclosure_type: "Housing and protection for the battery system",
    environmental_protection: "Weather and environmental protection rating",
    ems_scada_protocols: "Energy Management System communication protocols",
    black_start_capability: "Ability to start grid after blackout",
    performance_warranty: "Warranty terms for system performance",
    availability_guarantee_pct: "Guaranteed system uptime percentage",
    service_om_package: "Operation and maintenance service options",
    end_of_life_recycling: "Battery disposal and recycling services",
    delivery_schedule: "Project timeline and delivery milestones",
    price_breakdown: "Detailed cost structure and pricing",
    payment_terms: "Payment schedule and conditions",
    incoterms: "International commercial terms for delivery",
    supplier_references: "Previous project references and experience",
    assumptions: "Key assumptions made in the proposal",
    open_questions: "Items requiring clarification or further discussion",
    contact_name: "Primary contact person for this project",
    contact_email: "Email address for project correspondence"
  };

  const [form, setForm] = useState({
    // System Scope
    application: '',
    configuration: '',
    delivery_scope: '',
    
    // Performance Requirements
    nominal_energy_mwh: '',
    nominal_power_mw: '',
    discharge_duration_h: '',
    expected_daily_cycles: '',
    round_trip_efficiency_pct: '',
    response_time_s: '',
    grid_code_compliance: '',
    
    // Battery Specifications
    chemistry: '',
    cycle_life_cycles_at_DoD: '',
    calendar_life_years: '',
    operating_temperature_range_c: '',
    degradation_capacity_fade_pct_per_year: '',
    
    // Safety & Standards
    certifications: '',
    bms_capabilities: '',
    fire_suppression_system: '',
    thermal_runaway_prevention: '',
    
    // Infrastructure & Integration
    enclosure_type: '',
    environmental_protection: '',
    ems_scada_protocols: '',
    black_start_capability: false,
    
    // Warranty & Service
    performance_warranty: '',
    availability_guarantee_pct: '',
    service_om_package: '',
    end_of_life_recycling: '',
    
    // Commercial Parameters
    delivery_schedule: '',
    price_breakdown: '',
    payment_terms: '',
    incoterms: '',
    supplier_references: '',
    
    // Meta
    assumptions: '',
    open_questions: '',
    
    // Contact
    contact_name: '',
    contact_email: ''
  });

  // Contact info state for the separate contact section
  const [contactInfo, setContactInfo] = useState({
    contact_email: '',
    company_name: '',
    project_name: '',
    organization_tax_number: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
        expected_daily_cycles: extractedInfo?.expected_daily_cycles || prevForm.expected_daily_cycles,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required contact fields
    const requiredFields = ['contact_email', 'company_name', 'project_name', 'organization_tax_number'];
    const missingFields = requiredFields.filter(field => !contactInfo[field]?.trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...form,
        ...contactInfo,
        // Add timestamp and metadata
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      };
      
      await onSubmit(submissionData);
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setSubmitSuccess(false);
        setContactInfo({
          contact_email: '',
          company_name: '',
          project_name: '',
          organization_tax_number: ''
        });
      }, 3000);
      
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to check if a field has meaningful content
  const hasValue = (value) => {
    if (typeof value === 'boolean') return value === true; // Only show true boolean values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Filter out empty strings and generic fallback messages
      return trimmed !== '' && 
             trimmed !== 'Extracted from user message via fallback parsing' && 
             trimmed !== 'Application details, chemistry preferences, delivery specifics' &&
             trimmed !== 'Waiting for AI response' &&
             trimmed !== 'N/A' &&
             trimmed !== 'TBD' &&
             trimmed !== 'To be determined';
    }
    if (typeof value === 'number') return value > 0;
    return false;
  };

  // Helper function to check if assumptions or open questions have meaningful content
  const hasSpecialValue = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    // Only show if it's not the default fallback messages
    return trimmed !== '' && 
           trimmed !== 'Extracted from user message via fallback parsing' &&
           trimmed !== 'Application details, chemistry preferences, delivery specifics' &&
           trimmed !== 'Waiting for AI response';
  };

  // Validation function for BESS specifications
  const validateBESSSpecs = (formData) => {
    const issues = [];
    
    // Check if daily cycling hours exceed 24 hours
    const power = parseFloat(formData.nominal_power_mw) || 0;
    const duration = parseFloat(formData.discharge_duration_h) || 0;
    const dailyCycles = parseFloat(formData.expected_daily_cycles) || 0;
    
    if (power > 0 && duration > 0 && dailyCycles > 0) {
      const totalDailyHours = duration * dailyCycles;
      if (totalDailyHours > 24) {
        issues.push(`Invalid cycling: ${dailyCycles} cycles * ${duration}h = ${totalDailyHours.toFixed(1)}h/day (max 24h/day)`);
      }
      
      // Check C-rate consistency
      const energy = parseFloat(formData.nominal_energy_mwh) || 0;
      if (energy > 0) {
        const calculatedEnergy = power * duration;
        const energyDifference = Math.abs(energy - calculatedEnergy);
        if (energyDifference > calculatedEnergy * 0.1) { // Allow 10% tolerance
          issues.push(`Energy inconsistency: ${energy}MWh specified but ${power}MW * ${duration}h = ${calculatedEnergy.toFixed(1)}MWh`);
        }
      }
      
      // Check reasonable ranges
      if (power > 1000) issues.push(`Unusually high power: ${power}MW (typical range: 0.1-1000MW)`);
      if (duration > 12) issues.push(`Unusually long duration: ${duration}h (typical range: 0.25-12h)`);
      if (dailyCycles > 365) issues.push(`Unusually high cycling: ${dailyCycles}/day (max realistic: 365/day)`);
    }
    
    return issues;
  };

  // Helper function to get field display name
  const getFieldLabel = (key) => {
    const labels = {
      // System Scope
      application: 'Application Type',
      configuration: 'Configuration',
      delivery_scope: 'Delivery Scope',
      
      // Performance Requirements
      nominal_energy_mwh: 'Nominal Capacity (MWh)',
      nominal_power_mw: 'Power Rating (MW)',
      discharge_duration_h: 'Discharge Duration (hours)',
      expected_daily_cycles: 'Expected Daily Cycles',
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

  // Get all fields that have values for individual card rendering
  const fieldsWithValues = Object.keys(form)
    .filter(key => key !== 'contact_name' && key !== 'contact_email' && key !== 'assumptions' && key !== 'open_questions') // Exclude contact fields and special fields
    .filter(key => hasValue(form[key]))
    .map(key => ({
      key,
      value: form[key],
      label: getFieldLabel(key)
    }));

  // Check for special fields that should only show with meaningful content
  const showAssumptions = hasSpecialValue(form.assumptions);
  const showOpenQuestions = hasSpecialValue(form.open_questions);

  // Check if ALL required specifications are complete
  const requiredFields = ['nominal_power_mw', 'discharge_duration_h', 'application', 'expected_daily_cycles', 'delivery_schedule', 'incoterms'];
  const allRequiredFieldsComplete = requiredFields.every(field => hasValue(form[field]));

  // Always show contact section for user input
  const hasAnyData = fieldsWithValues.length > 0 || showAssumptions || showOpenQuestions;
  
  // Check for missing required fields and request them from chat (with debouncing)
  const [lastRequestedFields, setLastRequestedFields] = React.useState(null);
  const [hasRequestedOnce, setHasRequestedOnce] = React.useState(false);
  
  React.useEffect(() => {
    // Only request once per session and only if we have substantial data
    if (hasAnyData && !allRequiredFieldsComplete && onRequestMissingFields && 
        !hasRequestedOnce && fieldsWithValues.length >= 3) {
      
      const missingFields = requiredFields.filter(field => !hasValue(form[field]));
      const fieldNames = {
        'nominal_power_mw': 'power rating',
        'discharge_duration_h': 'discharge duration', 
        'application': 'application type',
        'expected_daily_cycles': 'expected daily cycles',
        'delivery_schedule': 'delivery schedule',
        'incoterms': 'commercial terms'
      };
      
      const missingFieldNames = missingFields.map(field => fieldNames[field]);
      const missingFieldsKey = missingFieldNames.sort().join(',');
      
      // Only request if the missing fields have changed significantly
      if (missingFieldsKey !== lastRequestedFields && missingFieldNames.length > 0) {
        // Add a delay to prevent immediate triggering
        setTimeout(() => {
          onRequestMissingFields(missingFieldNames);
          setLastRequestedFields(missingFieldsKey);
          setHasRequestedOnce(true);
        }, 1000); // 1 second delay
      }
    }
  }, [hasAnyData, allRequiredFieldsComplete, fieldsWithValues.length, onRequestMissingFields, hasRequestedOnce, lastRequestedFields]);
  
  // Validate BESS specifications
  const validationIssues = validateBESSSpecs(form);
  
  // Debug logging to help identify issues
  React.useEffect(() => {
    if (extractedInfo) {
      console.log('AutoFilledForm received extractedInfo:', extractedInfo);
      console.log('Fields with values:', fieldsWithValues);
      console.log('Has any data:', hasAnyData);
      console.log('Show assumptions:', showAssumptions);
      console.log('Show open questions:', showOpenQuestions);
      console.log('Validation issues:', validationIssues);
    }
  }, [extractedInfo, fieldsWithValues, hasAnyData, showAssumptions, showOpenQuestions, validationIssues]);

  // Don't render anything if no data
  if (!hasAnyData) {
    return null;
  }

  // Render contact and submit section only (for under chat window)
  if (renderContactAndSubmit) {
    // Only show contact form when all required fields are complete
    if (allRequiredFieldsComplete && !submitSuccess) {
      return (
        <div style={{
          margin: '16px 0 0 0',
          maxWidth: maxWidth || '900px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Contact Form */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h3 style={{ 
              marginBottom: 20, 
              background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              fontSize: 20,
              fontWeight: 600
            }}>
              Submit Your BESS Project
            </h3>
            
            {/* Privacy Notice */}
            <div style={{
              background: 'rgba(107, 124, 107, 0.1)',
              border: '1px solid rgba(107, 124, 107, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              🔒 <strong>Privacy Notice:</strong> Your project data will be anonymized for BESS equipment recommendations. We only use this information to provide you with tailored BESS solutions.
            </div>

            <form onSubmit={handleSubmit}>
              <div 
                className="contact-form-grid"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                  gap: '20px', 
                  marginBottom: '20px' 
                }}>
                {/* Contact Email */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'rgba(255, 255, 255, 0.9)' 
                  }}>
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={contactInfo.contact_email}
                    onChange={(e) => setContactInfo({...contactInfo, contact_email: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="john.doe@company.com"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'rgba(255, 255, 255, 0.9)' 
                  }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={contactInfo.company_name}
                    onChange={(e) => setContactInfo({...contactInfo, company_name: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Your Company Ltd."
                  />
                </div>

                {/* Project Name */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'rgba(255, 255, 255, 0.9)' 
                  }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={contactInfo.project_name}
                    onChange={(e) => setContactInfo({...contactInfo, project_name: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Solar Farm BESS Project"
                  />
                </div>

                {/* Organization/Tax Number */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'rgba(255, 255, 255, 0.9)' 
                  }}>
                    Organization/Tax Number *
                  </label>
                  <input
                    type="text"
                    value={contactInfo.organization_tax_number}
                    onChange={(e) => setContactInfo({...contactInfo, organization_tax_number: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="VAT/Tax ID or Organization Number"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
                  opacity: isSubmitting ? 0.7 : 1,
                  transform: 'translateZ(0)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                    e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                    e.target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = 'translateZ(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.2)';
                    e.target.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))';
                  }
                }}
              >
                {isSubmitting ? '🔄 Submitting Project...' : '🚀 Submit Project & Get BESS Recommendations'}
              </button>
            </form>
          </div>
        </div>
      );
    } else if (submitSuccess) {
      return (
        <div style={{
          margin: '16px 0 0 0',
          maxWidth: maxWidth || '900px',
          width: '100%'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ 
              background: 'linear-gradient(135deg, #10b981, #22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              Project Submitted Successfully!
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '16px',
              marginBottom: '16px'
            }}>
              Your BESS project specifications have been saved and our team will generate customized equipment recommendations for you.
            </p>
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              📧 You will receive BESS recommendations at: <strong>{contactInfo.contact_email}</strong>
            </div>
          </div>
        </div>
      );
    } else {
      // Don't show anything under chat when fields are incomplete
      return null;
    }
  }

  return (
    <div style={{
      margin: '0', // Remove margin to align with top
      maxWidth: '450px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Background Overlay Container - matches chat window translucency */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {hasAnyData && (
          <h3 style={{ 
            marginBottom: 24, 
            background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            BESS Summary
          </h3>
        )}
        
        {/* Validation Issues Warning */}
        {validationIssues.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <h4 style={{ 
              color: '#fca5a5', 
              margin: '0 0 8px 0', 
              fontSize: '14px', 
              fontWeight: 'bold' 
            }}>
              ⚠️ Specification Issues Detected:
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
        
        {/* Individual Floating Cards */}
        {fieldsWithValues.map(({ key, value, label }, index) => (
          <div 
            key={key} 
            className={`floating-card floating-card-${index}`}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 16,
              padding: '18px 22px',
              marginBottom: 16,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: 'center',
              position: 'relative'
            }}
            onMouseEnter={() => setHoveredField(key)}
            onMouseLeave={() => setHoveredField(null)}
          >
            {/* Tooltip */}
            {hoveredField === key && fieldDefinitions[key] && (
              <div className="tooltip">
                {fieldDefinitions[key]}
              </div>
            )}
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>
              {label}
            </div>
            <div style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
              lineHeight: 1.5
            }}>
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
            </div>
          </div>
        ))}
        
        {/* Conditional Assumptions Card */}
        {showAssumptions && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: '18px 22px',
            marginBottom: 16,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'expandCard 0.5s ease-out',
            transformOrigin: 'center'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>
              Assumptions
            </div>
            <div style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
              lineHeight: 1.5
            }}>
              {form.assumptions}
            </div>
          </div>
        )}
        
        {/* Conditional Open Questions Card */}
        {showOpenQuestions && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: '18px 22px',
            marginBottom: 16,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'expandCard 0.5s ease-out',
            transformOrigin: 'center'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.8px'
            }}>
              Open Questions
            </div>
            <div style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
              lineHeight: 1.5
            }}>
              {form.open_questions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoFilledForm;
