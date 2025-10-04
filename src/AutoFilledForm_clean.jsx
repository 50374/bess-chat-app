import React, { useState } from 'react';import React, { useState } from 'react';

import { apiService } from './services/api.js';import { apiService } from './services/api.js';



const AutoFilledForm = ({ extractedInfo, onOptimizationRequest, onRequestMissingFields, renderSummaryOnly = false, sessionId }) => {const AutoFilledForm = ({ extractedInfo, onSubmit, onRequestMissingFields, onChatUpdate, onOptimizationResult, sessionId, renderSummaryOnly = false, renderContactAndSubmit = false, maxWidth }) => {

  // Add CSS for floating cards  // Add CSS for Railway-style scrollbars and card animations

  React.useEffect(() => {  React.useEffect(() => {

    const style = document.createElement('style');    const style = document.createElement('style');

    style.textContent = `    style.textContent = `

      @keyframes floatIn {      /* Railway-style scrollbars */

        0% {      ::-webkit-scrollbar {

          opacity: 0;        width: 8px;

          transform: scale(0.95) translateY(20px);        height: 8px;

        }      }

        100% {      

          opacity: 1;      ::-webkit-scrollbar-track {

          transform: scale(1) translateY(0px);        background: rgba(255, 255, 255, 0.05);

        }        border-radius: 4px;

      }      }

      

      .floating-card {      ::-webkit-scrollbar-thumb {

        animation: floatIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;        background: rgba(255, 255, 255, 0.2);

        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);        border-radius: 4px;

      }        transition: all 0.2s ease;

      }

      .floating-card:hover {      

        transform: translateY(-4px) scale(1.02);      ::-webkit-scrollbar-thumb:hover {

        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);        background: rgba(255, 255, 255, 0.3);

      }      }

      

      .floating-card-0 { animation-delay: 0s; }      /* Firefox scrollbar */

      .floating-card-1 { animation-delay: 0.1s; }      * {

      .floating-card-2 { animation-delay: 0.2s; }        scrollbar-width: thin;

      .floating-card-3 { animation-delay: 0.3s; }        scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);

      .floating-card-4 { animation-delay: 0.4s; }      }

      .floating-card-5 { animation-delay: 0.5s; }      

      .floating-card-6 { animation-delay: 0.6s; }      @keyframes expandCard {

      .floating-card-7 { animation-delay: 0.7s; }        0% {

      .floating-card-8 { animation-delay: 0.8s; }          opacity: 0;

      .floating-card-9 { animation-delay: 0.9s; }          transform: scale(0.95) translateY(10px);

    `;        }

            100% {

    if (!document.getElementById('floating-cards-styles')) {          opacity: 1;

      style.id = 'floating-cards-styles';          transform: scale(1) translateY(0px);

      document.head.appendChild(style);        }

    }      }

    

    return () => {      @keyframes slideInLeft {

      const existingStyle = document.getElementById('floating-cards-styles');        0% {

      if (existingStyle) {          opacity: 0;

        existingStyle.remove();          transform: translateX(-100px);

      }        }

    };        100% {

  }, []);          opacity: 1;

          transform: translateX(0);

  const [isOptimizing, setIsOptimizing] = useState(false);        }

      }

  // Field labels for display      

  const fieldLabels = {      /* Staggered animation classes */

    application: 'Application',      .floating-card-0 { animation: expandCard 0.8s ease-out 0s both; }

    nominal_power_mw: 'Power (MW)',      .floating-card-1 { animation: expandCard 0.8s ease-out 0.2s both; }

    nominal_energy_mwh: 'Energy (MWh)',       .floating-card-2 { animation: expandCard 0.8s ease-out 0.4s both; }

    discharge_duration_h: 'Duration (hours)',      .floating-card-3 { animation: expandCard 0.8s ease-out 0.6s both; }

    expected_daily_cycles: 'Daily Cycles',      .floating-card-4 { animation: expandCard 0.8s ease-out 0.8s both; }

    chemistry: 'Battery Chemistry',      .floating-card-5 { animation: expandCard 0.8s ease-out 1.0s both; }

    delivery_schedule: 'Delivery Schedule',      .floating-card-6 { animation: expandCard 0.8s ease-out 1.2s both; }

    incoterms: 'Commercial Terms',      .floating-card-7 { animation: expandCard 0.8s ease-out 1.4s both; }

    grid_code_compliance: 'Grid Codes',      .floating-card-8 { animation: expandCard 0.8s ease-out 1.6s both; }

    round_trip_efficiency_pct: 'Efficiency (%)',      .floating-card-9 { animation: expandCard 0.8s ease-out 1.8s both; }

    cycle_life_cycles_at_DoD: 'Cycle Life',      .floating-card-10 { animation: expandCard 0.8s ease-out 2.0s both; }

    operating_temperature_range_c: 'Temperature Range (°C)',      .floating-card-11 { animation: expandCard 0.8s ease-out 2.2s both; }

    certifications: 'Certifications',      .floating-card-12 { animation: expandCard 0.8s ease-out 2.4s both; }

    performance_warranty: 'Warranty',      .floating-card-13 { animation: expandCard 0.8s ease-out 2.6s both; }

    price_breakdown: 'Price Structure'      .floating-card-14 { animation: expandCard 0.8s ease-out 2.8s both; }

  };      .floating-card-15 { animation: expandCard 0.8s ease-out 3.0s both; }

      

  // Required fields for optimization (Step 2 → Step 3)      .floating-card {

  const requiredFields = ['nominal_power_mw', 'discharge_duration_h', 'application', 'expected_daily_cycles', 'delivery_schedule', 'incoterms'];        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          position: relative;

  // Check if field has meaningful value        animation-fill-mode: both;

  const hasValue = (value) => {      }

    if (typeof value === 'string') {      

      const trimmed = value.trim();      .floating-card:hover {

      return trimmed !== '' &&         transform: translateY(-8px) scale(1.02) !important;

             trimmed !== 'N/A' &&         box-shadow: 0 8px 25px rgba(107, 124, 107, 0.25) !important;

             trimmed !== 'TBD' &&         z-index: 10;

             trimmed !== 'To be determined' &&        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

             trimmed !== 'Extracted from user message via fallback parsing';      }

    }      

    return value !== null && value !== undefined && value !== '';      .tooltip {

  };        position: absolute;

        bottom: -50px;

  // Get populated fields        left: 50%;

  const populatedFields = extractedInfo ?         transform: translateX(-50%);

    Object.keys(extractedInfo)        background: rgba(45, 52, 40, 0.95);

      .filter(key => hasValue(extractedInfo[key]))        color: white;

      .map(key => ({        padding: 8px 12px;

        key,        border-radius: 8px;

        value: extractedInfo[key],        font-size: 12px;

        label: fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())        white-space: nowrap;

      })) : [];        pointer-events: none;

        z-index: 1000;

  // Check required fields completion        opacity: 0;

  const allRequiredFieldsComplete = requiredFields.every(field =>         transition: opacity 0.3s ease;

    extractedInfo && hasValue(extractedInfo[field])      }

  );      

      .floating-card:hover .tooltip {

  // Logic consistency validation (Step 2)        opacity: 1;

  const validateLogic = () => {      }

    if (!extractedInfo) return [];    `;

        

    const issues = [];    if (!document.getElementById('railway-autofilled-form-styles')) {

    const power = parseFloat(extractedInfo.nominal_power_mw) || 0;      style.id = 'railway-autofilled-form-styles';

    const duration = parseFloat(extractedInfo.discharge_duration_h) || 0;      document.head.appendChild(style);

    const dailyCycles = parseFloat(extractedInfo.expected_daily_cycles) || 0;    }

        

    // Check daily cycling hours    return () => {

    if (power > 0 && duration > 0 && dailyCycles > 0) {      const existingStyle = document.getElementById('railway-autofilled-form-styles');

      const totalDailyHours = duration * dailyCycles;      if (existingStyle) {

      if (totalDailyHours > 24) {        existingStyle.remove();

        issues.push(`Invalid cycling: ${dailyCycles} cycles × ${duration}h = ${totalDailyHours.toFixed(1)}h/day (max 24h)`);      }

      }    };

    }  }, []);

    

    return issues;  // Form state

  };  const [form, setForm] = useState({

    // System Scope

  const validationIssues = validateLogic();    application: '',

    configuration: '',

  // Step 3: Handle optimization request    delivery_scope: '',

  const handleOptimize = async () => {    

    if (!allRequiredFieldsComplete || isOptimizing || validationIssues.length > 0) {    // Performance Requirements

      return;    capacity_mwh: '',

    }    duration_hours: '',

    power_mw: '',

    setIsOptimizing(true);    round_trip_efficiency: '',

        depth_of_discharge: '',

    try {    cycle_life: '',

      console.log('🔧 Step 3: Requesting optimization for:', extractedInfo);    response_time: '',

      await onOptimizationRequest(extractedInfo);    

    } catch (error) {    // Site Requirements

      console.error('❌ Optimization failed:', error);    location: '',

      alert('Optimization failed. Please try again.');    site_constraints: '',

    } finally {    grid_connection: '',

      setIsOptimizing(false);    ambient_conditions: '',

    }    seismic_requirements: '',

  };    environmental_compliance: '',

    

  // Count populated specifications    // Technology Preferences

  const specCount = populatedFields.length;    technology_type: '',

    preferred_chemistry: '',

  if (!extractedInfo || populatedFields.length === 0) {    form_factor: '',

    return null;    safety_systems: '',

  }    thermal_management: '',

    fire_suppression: '',

  if (!renderSummaryOnly) {    

    return null; // Only render summary version for right panel    // Operational Requirements

  }    degradation_warranty: '',

    maintenance_access: '',

  return (    monitoring_systems: '',

    <div style={{    grid_services: '',

      width: '100%',    operating_strategy: '',

      maxWidth: '400px',    load_profile: '',

      display: 'flex',    

      flexDirection: 'column'    // Standards & Certifications

    }}>    grid_codes: '',

      {/* Container with glass morphism */}    safety_standards: '',

      <div style={{    environmental_standards: '',

        background: 'rgba(255, 255, 255, 0.05)',    performance_testing: '',

        backdropFilter: 'blur(20px)',    third_party_validation: '',

        borderRadius: '16px',    cybersecurity_requirements: '',

        padding: '24px',    

        border: '1px solid rgba(255, 255, 255, 0.1)',    // Economic Parameters

        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',    budget_range: '',

        display: 'flex',    financing_structure: '',

        flexDirection: 'column'    revenue_model: '',

      }}>    incentives_rebates: '',

        {/* Header */}    escalation_rates: '',

        <div style={{    discount_rate: '',

          textAlign: 'center',    

          marginBottom: '20px'    // Warranty & Service

        }}>    performance_warranty: '',

          <h3 style={{    availability_guarantee_pct: '',

            color: 'rgba(255, 255, 255, 0.95)',    service_om_package: '',

            fontSize: '20px',    end_of_life_recycling: '',

            fontWeight: '600',    

            margin: '0 0 8px 0'    // Commercial Parameters

          }}>    delivery_schedule: '',

            BESS Summary    price_breakdown: '',

          </h3>    payment_terms: '',

          <p style={{    incoterms: '',

            color: 'rgba(255, 255, 255, 0.7)',    supplier_references: '',

            fontSize: '14px',    

            margin: 0    // Meta

          }}>    assumptions: '',

            {specCount} specifications collected    open_questions: '',

          </p>    

        </div>    // Contact

    contact_name: '',

        {/* Validation Issues */}    contact_email: ''

        {validationIssues.length > 0 && (  });

          <div style={{

            background: 'rgba(239, 68, 68, 0.1)',  // Contact info state for the separate contact section

            border: '1px solid rgba(239, 68, 68, 0.3)',  const [contactInfo, setContactInfo] = useState({

            borderRadius: '12px',    contact_email: '',

            padding: '12px',    company_name: '',

            marginBottom: '16px'    project_name: '',

          }}>    organization_tax_number: ''

            <h4 style={{  });

              color: 'rgba(239, 68, 68, 0.9)',

              fontSize: '14px',  const [isSubmitting, setIsSubmitting] = useState(false);

              fontWeight: '600',  const [submitSuccess, setSubmitSuccess] = useState(false);

              margin: '0 0 8px 0'  const [isOptimizing, setIsOptimizing] = useState(false);

            }}>  const [optimizationResult, setOptimizationResult] = useState(null);

              ⚠️ Issues Detected:  const [showSubmissionPopup, setShowSubmissionPopup] = useState(false);

            </h4>

            {validationIssues.map((issue, index) => (  // Update form state if extractedInfo changes

              <div key={index} style={{  React.useEffect(() => {

                color: 'rgba(255, 255, 255, 0.9)',    if (extractedInfo) {

                fontSize: '13px',      setForm(prevForm => ({

                marginBottom: '4px'        ...prevForm,

              }}>        application: extractedInfo?.application || prevForm.application,

                • {issue}        configuration: extractedInfo?.configuration || prevForm.configuration,

              </div>        delivery_scope: extractedInfo?.delivery_scope || prevForm.delivery_scope,

            ))}        capacity_mwh: extractedInfo?.capacity_mwh || prevForm.capacity_mwh,

          </div>        duration_hours: extractedInfo?.duration_hours || prevForm.duration_hours,

        )}        power_mw: extractedInfo?.power_mw || prevForm.power_mw,

        location: extractedInfo?.location || prevForm.location,

        {/* Floating Cards Grid */}        technology_type: extractedInfo?.technology_type || prevForm.technology_type,

        <div style={{        preferred_chemistry: extractedInfo?.preferred_chemistry || prevForm.preferred_chemistry,

          display: 'grid',        budget_range: extractedInfo?.budget_range || prevForm.budget_range,

          gap: '12px',        delivery_schedule: extractedInfo?.delivery_schedule || prevForm.delivery_schedule

          marginBottom: '20px'      }));

        }}>    }

          {populatedFields.map(({ key, value, label }, index) => (  }, [extractedInfo]);

            <div

              key={key}  // Handle form submission

              className={`floating-card floating-card-${index}`}  const handleSubmit = async (e) => {

              style={{    e.preventDefault();

                background: 'rgba(255, 255, 255, 0.08)',    

                backdropFilter: 'blur(10px)',    setIsSubmitting(true);

                borderRadius: '12px',    

                padding: '14px 16px',    try {

                border: '1px solid rgba(255, 255, 255, 0.15)',      // Validate required contact fields

                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',      const requiredFields = ['contact_email', 'company_name', 'project_name'];

                display: 'flex',      const missingFields = requiredFields.filter(field => !contactInfo[field]?.trim());

                justifyContent: 'space-between',      

                alignItems: 'center'      if (missingFields.length > 0) {

              }}        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);

            >        setIsSubmitting(false);

              <span style={{        return;

                color: 'rgba(255, 255, 255, 0.7)',      }

                fontSize: '13px',

                fontWeight: '500',      // Submit to aggregation database

                flex: 1      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

              }}>      const response = await fetch(`${apiUrl}/api/aggregation/submit`, {

                {label}:        method: 'POST',

              </span>        headers: {

              <span style={{          'Content-Type': 'application/json'

                color: 'rgba(255, 255, 255, 0.95)',        },

                fontSize: '13px',        body: JSON.stringify({

                fontWeight: '600',          ...form,

                textAlign: 'right',          ...contactInfo,

                maxWidth: '60%',          session_id: sessionId,

                overflow: 'hidden',          submitted_at: new Date().toISOString()

                textOverflow: 'ellipsis',        })

                whiteSpace: 'nowrap'      });

              }}>

                {value}      if (!response.ok) {

              </span>        throw new Error(`HTTP error! status: ${response.status}`);

            </div>      }

          ))}

        </div>      const result = await response.json();



        {/* Required Fields Status */}      if (result.success) {

        <div style={{        console.log('Project added to aggregation:', result.projectId);

          background: allRequiredFieldsComplete         setSubmitSuccess(true);

            ? 'rgba(34, 197, 94, 0.1)'         setShowSubmissionPopup(true);

            : 'rgba(251, 191, 36, 0.1)',        

          border: `1px solid ${allRequiredFieldsComplete         // Reset contact form

            ? 'rgba(34, 197, 94, 0.3)'         setContactInfo({

            : 'rgba(251, 191, 36, 0.3)'}`,          contact_email: '',

          borderRadius: '12px',          company_name: '',

          padding: '12px',          project_name: '',

          marginBottom: '20px',          organization_tax_number: ''

          textAlign: 'center'        });

        }}>        

          <div style={{        // Call the parent onSubmit callback if provided

            color: allRequiredFieldsComplete         if (onSubmit) {

              ? 'rgba(34, 197, 94, 0.9)'           onSubmit({ ...form, ...contactInfo });

              : 'rgba(251, 191, 36, 0.9)',        }

            fontSize: '14px',      } else {

            fontWeight: '600'        throw new Error(result.message || 'Submission failed');

          }}>      }

            {allRequiredFieldsComplete     } catch (error) {

              ? '✅ Ready for Optimization'       console.error('Submission error:', error);

              : '⏳ Collecting Requirements...'}      alert('Error submitting project. Please try again.');

          </div>    } finally {

          {!allRequiredFieldsComplete && (      setIsSubmitting(false);

            <div style={{    }

              color: 'rgba(255, 255, 255, 0.7)',  };

              fontSize: '12px',

              marginTop: '4px'  // Handle optimization

            }}>  const handleOptimize = async () => {

              Missing: {requiredFields    setIsOptimizing(true);

                .filter(field => !extractedInfo || !hasValue(extractedInfo[field]))    

                .map(field => fieldLabels[field] || field)    try {

                .join(', ')}      const result = await apiService.getOptimization(form, sessionId);

            </div>      

          )}      if (result.success) {

        </div>        setOptimizationResult(result.data);

        if (onOptimizationResult) {

        {/* Step 3: Optimize Button */}          onOptimizationResult(result.data);

        <button        }

          onClick={handleOptimize}      } else {

          disabled={!allRequiredFieldsComplete || isOptimizing || validationIssues.length > 0}        console.error('Optimization failed:', result.error);

          style={{        alert('Optimization failed. Please try again.');

            width: '100%',      }

            padding: '16px',    } catch (error) {

            background: (allRequiredFieldsComplete && validationIssues.length === 0 && !isOptimizing)       console.error('Optimization error:', error);

              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))'      alert('Error getting optimization. Please try again.');

              : 'rgba(255, 255, 255, 0.1)',    } finally {

            border: '1px solid rgba(255, 255, 255, 0.2)',      setIsOptimizing(false);

            borderRadius: '12px',    }

            color: (allRequiredFieldsComplete && validationIssues.length === 0 && !isOptimizing)   };

              ? 'white' 

              : 'rgba(255, 255, 255, 0.5)',  // Handle field change

            fontSize: '16px',  const handleChange = (field, value) => {

            fontWeight: '600',    setForm(prev => ({

            cursor: (allRequiredFieldsComplete && validationIssues.length === 0 && !isOptimizing)       ...prev,

              ? 'pointer'       [field]: value

              : 'not-allowed',    }));

            transition: 'all 0.3s ease',  };

            backdropFilter: 'blur(10px)',

            boxShadow: (allRequiredFieldsComplete && validationIssues.length === 0 && !isOptimizing)   // If rendering summary only, return minimal view

              ? '0 4px 15px rgba(59, 130, 246, 0.3)'   if (renderSummaryOnly) {

              : 'none'    return (

          }}      <div style={{

        >        background: 'rgba(107, 124, 107, 0.05)',

          {isOptimizing         borderRadius: '16px',

            ? '🔄 Optimizing BESS Configuration...'         padding: '20px',

            : allRequiredFieldsComplete && validationIssues.length === 0        border: '1px solid rgba(107, 124, 107, 0.1)',

              ? '🎯 Optimize BESS Configuration'        backdropFilter: 'blur(20px)',

              : '⏳ Complete Requirements First'}        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',

        </button>        width: '100%',

        maxWidth: maxWidth || '400px'

        {/* Helper text */}      }}>

        <p style={{        <h3 style={{

          color: 'rgba(255, 255, 255, 0.6)',          color: 'rgba(255, 255, 255, 0.9)',

          fontSize: '12px',          fontSize: '18px',

          textAlign: 'center',          fontWeight: '600',

          marginTop: '12px',          margin: '0 0 16px 0',

          margin: '12px 0 0 0'          textAlign: 'center'

        }}>        }}>

          AI will analyze your requirements and recommend optimal BESS solutions          Project Summary

        </p>        </h3>

      </div>        

    </div>        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

  );          {form.capacity_mwh && (

};            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>

              <strong>Capacity:</strong> {form.capacity_mwh} MWh

export default AutoFilledForm;            </div>
          )}
          {form.duration_hours && (
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              <strong>Duration:</strong> {form.duration_hours} hours
            </div>
          )}
          {form.location && (
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              <strong>Location:</strong> {form.location}
            </div>
          )}
          {form.technology_type && (
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              <strong>Technology:</strong> {form.technology_type}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main form render
  return (
    <div style={{
      width: '100%',
      maxWidth: maxWidth || '900px',
      margin: '0 auto'
    }}>
      {showSubmissionPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(107, 124, 107, 0.15)',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid rgba(107, 124, 107, 0.2)',
            backdropFilter: 'blur(30px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <h2 style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 16px 0'
            }}>
              Project Submitted Successfully!
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              margin: '0 0 24px 0',
              lineHeight: '1.5'
            }}>
              Your project has been added to the market aggregation database. You'll be notified when aggregation opportunities become available.
            </p>
            <button
              onClick={() => setShowSubmissionPopup(false)}
              style={{
                background: 'linear-gradient(135deg, rgba(107, 124, 107, 0.8), rgba(134, 156, 134, 0.8))',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div style={{
        background: 'rgba(107, 124, 107, 0.05)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(107, 124, 107, 0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {renderContactAndSubmit ? (
          <div>
            <h3 style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              Submit for Market Aggregation
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactInfo.contact_email}
                    onChange={(e) => setContactInfo({...contactInfo, contact_email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(107, 124, 107, 0.2)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      backdropFilter: 'blur(10px)',
                      boxSizing: 'border-box'
                    }}
                    placeholder="your.email@company.com"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactInfo.company_name}
                    onChange={(e) => setContactInfo({...contactInfo, company_name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(107, 124, 107, 0.2)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      backdropFilter: 'blur(10px)',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Your Company Ltd."
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactInfo.project_name}
                    onChange={(e) => setContactInfo({...contactInfo, project_name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(107, 124, 107, 0.2)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      backdropFilter: 'blur(10px)',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Battery Storage Project"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Tax Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactInfo.organization_tax_number}
                    onChange={(e) => setContactInfo({...contactInfo, organization_tax_number: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(107, 124, 107, 0.2)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      backdropFilter: 'blur(10px)',
                      boxSizing: 'border-box'
                    }}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isSubmitting 
                    ? 'rgba(107, 124, 107, 0.3)' 
                    : 'linear-gradient(135deg, rgba(107, 124, 107, 0.8), rgba(134, 156, 134, 0.8))',
                  border: '1px solid rgba(107, 124, 107, 0.4)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Market Aggregation'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h3 style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              BESS Project Details
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {Object.entries(form).filter(([key, value]) => value).map(([key, value]) => (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(107, 124, 107, 0.1)'
                }}>
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </span>
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    maxWidth: '60%',
                    textAlign: 'right'
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoFilledForm;