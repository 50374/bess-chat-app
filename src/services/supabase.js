import { createClient } from '@supabase/supabase-js'

// These will be environment variables in production
// Updated: Fixed contact form field mapping for database submission
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your_supabase_url_here'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database service functions
export const supabaseService = {
  // Save BESS project data
  async saveProject(projectData) {
    try {
      console.log('🗄️ Saving project data to Supabase:', projectData);
      
      // Map contact form fields to database schema
      const mappedData = {
        session_id: projectData.session_id,
        application: projectData.application,
        nominal_power_mw: projectData.nominal_power_mw,
        nominal_energy_mwh: projectData.nominal_energy_mwh,
        discharge_duration_h: projectData.discharge_duration_h,
        expected_daily_cycles: projectData.expected_daily_cycles,
        delivery_schedule: projectData.delivery_schedule,
        incoterms: projectData.incoterms,
        chemistry: projectData.chemistry,
        round_trip_efficiency_pct: projectData.round_trip_efficiency_pct,
        response_time_s: projectData.response_time_s,
        grid_code_compliance: projectData.grid_code_compliance,
        certifications: projectData.certifications,
        
        // Contact information mapping - Fixed field names
        company_name: projectData.company_name,
        email: projectData.contact_email, // Map contact_email to email column
        contact_person: projectData.contact_person || '', 
        phone: projectData.phone || '', 
        project_location: projectData.project_name || '', // Map project_name to project_location
        
        // Store all contact data in form_data for reference
        form_data: {
          ...projectData.form_data,
          organization_tax_number: projectData.organization_tax_number,
          contact_email: projectData.contact_email,
          project_name: projectData.project_name,
          company_name: projectData.company_name
        },
        chat_messages: projectData.chat_messages,
        user_ip: projectData.user_ip,
        user_agent: navigator.userAgent,
        submitted_at: projectData.submitted_at,
        status: projectData.status || 'submitted'
      };

      console.log('🔄 Mapped data for database:', mappedData);

      const { data, error } = await supabase
        .from('bess_projects')
        .insert([mappedData])
        .select()

      if (error) {
        console.error('🚨 Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Project saved to Supabase:', data)
      return { success: true, data }
    } catch (error) {
      console.error('💥 Error saving to Supabase:', error)
      return { success: false, error: error.message }
    }
  },

  // Get project by session ID
  async getProject(sessionId) {
    try {
      const { data, error } = await supabase
        .from('bess_projects')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error
      
      return { success: true, data: data[0] || null }
    } catch (error) {
      console.error('Error fetching from Supabase:', error)
      return { success: false, error: error.message }
    }
  },

  // Get all projects (for analytics)
  async getAllProjects(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('bess_projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching projects:', error)
      return { success: false, error: error.message }
    }
  },

  // Update project data
  async updateProject(sessionId, updates) {
    try {
      const { data, error } = await supabase
        .from('bess_projects')
        .update(updates)
        .eq('session_id', sessionId)
        .select()

      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Error updating project:', error)
      return { success: false, error: error.message }
    }
  }
}