import React, { useState } from 'react';

const AutoFilledForm = ({ extractedInfo, onSubmit, onRequestMissingFields, renderSummaryOnly = false, renderContactAndSubmit = false, maxWidth }) => {
  // Add CSS for card expansion animation with staggered appearance and hover effects
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes expandCard {
        0% {
          opacity: 0;
          transform: scale(0.1) translateY(20px);
          border-radius: 50%;
        }
        25% {
          opacity: 0.3;
          transform: scale(1, 0.2) translateY(15px);
          border-radius: 25%;
        }
        50% {
          opacity: 0.6;
          transform: scale(1, 0.6) translateY(10px);
          border-radius: 20%;
        }
        75% {
          opacity: 0.8;
          transform: scale(1, 0.9) translateY(5px);
          border-radius: 16px;
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0px);
          border-radius: 14px;
        }
      }
      
      @keyframes floatHover {
        0%, 100% { 
          transform: translateY(0px) scale(1);
          box-shadow: 0 4px 12px rgba(107, 124, 107, 0.15);
        }
        50% { 
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 8px 25px rgba(107, 124, 107, 0.25);
        }
      }
      
      @keyframes tooltipFadeIn {
        0% {
          opacity: 0;
          transform: translateY(10px);
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
            background: 'rgba(249, 249, 249, 0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: '24px',
            border: '1px solid rgba(229, 231, 235, 0.3)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ 
              marginBottom: 20, 
              color: '#2d3428',
              textAlign: 'center',
              fontSize: 20,
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(255,255,255,0.8)'
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
              color: '#2d3428'
            }}>
              🔒 <strong>Privacy Notice:</strong> Your project data will be anonymized for BESS equipment recommendations. We only use this information to provide you with tailored BESS solutions.
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Contact Email */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#2d3428' 
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
                      padding: '10px 12px',
                      border: '1px solid rgba(229, 231, 235, 0.5)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px'
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
                    color: '#2d3428' 
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
                      padding: '10px 12px',
                      border: '1px solid rgba(229, 231, 235, 0.5)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px'
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
                    color: '#2d3428' 
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
                      padding: '10px 12px',
                      border: '1px solid rgba(229, 231, 235, 0.5)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px'
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
                    color: '#2d3428' 
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
                      padding: '10px 12px',
                      border: '1px solid rgba(229, 231, 235, 0.5)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px'
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
                  padding: '14px 24px',
                  backgroundColor: isSubmitting ? '#9ca3af' : '#2d3428',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 3px 12px rgba(45, 52, 40, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#1a1f1a';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 5px 16px rgba(45, 52, 40, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = '#2d3428';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 3px 12px rgba(45, 52, 40, 0.3)';
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
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ 
              color: '#15803d', 
              marginBottom: '12px',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              Project Submitted Successfully!
            </h3>
            <p style={{ 
              color: '#166534', 
              fontSize: '16px',
              marginBottom: '16px'
            }}>
              Your BESS project specifications have been saved and our team will generate customized equipment recommendations for you.
            </p>
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#166534'
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
        background: 'rgba(249, 249, 249, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: '24px',
        border: '1px solid rgba(229, 231, 235, 0.3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {hasAnyData && (
          <h3 style={{ 
            marginBottom: 24, 
            color: '#2d3428',
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(255,255,255,0.8)',
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
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <h4 style={{ 
              color: '#dc2626', 
              margin: '0 0 8px 0', 
              fontSize: '14px', 
              fontWeight: 'bold' 
            }}>
              ⚠️ Specification Issues Detected:
            </h4>
            {validationIssues.map((issue, index) => (
              <div key={index} style={{ 
                color: '#dc2626', 
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
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(252, 252, 250, 0.9) 100%)',
              backdropFilter: 'blur(12px)',
              borderRadius: 14,
              padding: '18px 22px',
              marginBottom: 16,
              boxShadow: '0 3px 12px rgba(45, 52, 40, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
              border: '1px solid rgba(122, 138, 110, 0.25)',
              transition: 'all 0.3s ease',
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
              color: '#2d3428',
              marginBottom: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              textShadow: '0 1px 1px rgba(255,255,255,0.6)'
            }}>
              {label}
            </div>
            <div style={{
              fontSize: 15,
              color: '#1a1f1a',
              fontWeight: 600,
              lineHeight: 1.5
            }}>
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
            </div>
          </div>
        ))}
        
        {/* Conditional Assumptions Card */}
        {showAssumptions && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(252, 252, 250, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 16,
            boxShadow: '0 3px 12px rgba(45, 52, 40, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: '1px solid rgba(122, 138, 110, 0.25)',
            transition: 'all 0.3s ease',
            animation: 'expandCard 0.5s ease-out',
            transformOrigin: 'center'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#2d3428',
              marginBottom: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              textShadow: '0 1px 1px rgba(255,255,255,0.6)'
            }}>
              Assumptions
            </div>
            <div style={{
              fontSize: 15,
              color: '#1a1f1a',
              fontWeight: 600,
              lineHeight: 1.5
            }}>
              {form.assumptions}
            </div>
          </div>
        )}
        
        {/* Conditional Open Questions Card */}
        {showOpenQuestions && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(252, 252, 250, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 16,
            boxShadow: '0 3px 12px rgba(45, 52, 40, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: '1px solid rgba(122, 138, 110, 0.25)',
            transition: 'all 0.3s ease',
            animation: 'expandCard 0.5s ease-out',
            transformOrigin: 'center'
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#2d3428',
              marginBottom: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              textShadow: '0 1px 1px rgba(255,255,255,0.6)'
            }}>
              Open Questions
            </div>
            <div style={{
              fontSize: 15,
              color: '#1a1f1a',
              fontWeight: 600,
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
