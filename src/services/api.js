import { supabaseService } from './supabase.js'
import { openaiService } from './openai.js'

// Main API service that combines Supabase and OpenAI
export const apiService = {
  // Generate a session ID for tracking user interactions
  generateSessionId() {
    return `bess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // Get user's IP address (for analytics)
  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.warn('Could not get user IP:', error)
      return 'unknown'
    }
  },

  // Complete chat interaction with data persistence
  async processChatMessage(messages, extractedInfo, sessionId) {
    try {
      // Send message to OpenAI
      const chatResult = await openaiService.sendChatMessage(messages, extractedInfo)
      
      if (!chatResult.success) {
        return chatResult
      }

      // Extract the actual message content from the nested response
      const messageContent = chatResult.data?.data || chatResult.data;
      
      // Return the processed result with just the message content
      const processedResult = {
        success: true,
        data: {
          reply: messageContent,
          extractedInfo: null // We'll extract this from the message if needed
        }
      };

      // If we have extracted info, save to Supabase
      if (extractedInfo && Object.keys(extractedInfo).length > 0) {
        const userIP = await this.getUserIP()
        
        const projectData = {
          session_id: sessionId,
          ...extractedInfo,
          form_data: extractedInfo,
          chat_messages: messages,
          user_ip: userIP
        }

        const saveResult = await supabaseService.saveProject(projectData)
        
        if (saveResult.success) {
          console.log('Project data saved successfully')
        } else {
          console.warn('Failed to save project data:', saveResult.error)
        }
      }

      return processedResult
    } catch (error) {
      console.error('Error processing chat message:', error)
      return { 
        success: false, 
        error: error.message,
        fallback: "I'm experiencing technical difficulties. Please try again."
      }
    }
  },

  // Save form submission
  async submitForm(formData, sessionId, chatMessages = []) {
    try {
      const userIP = await this.getUserIP()
      
      const projectData = {
        session_id: sessionId,
        ...formData,
        form_data: formData,
        chat_messages: chatMessages,
        user_ip: userIP
      }

      const result = await supabaseService.saveProject(projectData)
      
      if (result.success) {
        console.log('Form submitted and saved to database')
        return { 
          success: true, 
          message: 'Your BESS requirements have been saved successfully!',
          projectId: result.data[0]?.id
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      return { 
        success: false, 
        error: error.message,
        message: 'There was an error saving your form. Please try again.'
      }
    }
  },

  // Restore session data
  async restoreSession(sessionId) {
    try {
      const result = await supabaseService.getProject(sessionId)
      
      if (result.success && result.data) {
        return {
          success: true,
          extractedInfo: result.data.form_data,
          chatMessages: result.data.chat_messages || []
        }
      } else {
        return { success: false, error: 'No session data found' }
      }
    } catch (error) {
      console.error('Session restoration error:', error)
      return { success: false, error: error.message }
    }
  },

  // Analytics: Get project statistics
  async getProjectStats() {
    try {
      const result = await supabaseService.getAllProjects(100)
      
      if (result.success) {
        const projects = result.data
        
        const stats = {
          totalProjects: projects.length,
          recentProjects: projects.filter(p => {
            const createdAt = new Date(p.created_at)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return createdAt > sevenDaysAgo
          }).length,
          popularApplications: this.getTopApplications(projects),
          averagePowerRange: this.getAveragePowerRange(projects)
        }
        
        return { success: true, data: stats }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Stats error:', error)
      return { success: false, error: error.message }
    }
  },

  // Helper: Get top applications
  getTopApplications(projects) {
    const appCounts = {}
    projects.forEach(p => {
      if (p.application) {
        appCounts[p.application] = (appCounts[p.application] || 0) + 1
      }
    })
    
    return Object.entries(appCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([app, count]) => ({ application: app, count }))
  },

  // Helper: Get average power range
  getAveragePowerRange(projects) {
    const powerValues = projects
      .filter(p => p.nominal_power_mw)
      .map(p => parseFloat(p.nominal_power_mw))
    
    if (powerValues.length === 0) return null
    
    const sum = powerValues.reduce((acc, val) => acc + val, 0)
    const avg = sum / powerValues.length
    const min = Math.min(...powerValues)
    const max = Math.max(...powerValues)
    
    return { average: avg.toFixed(2), min, max }
  }
}