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

  // Fetch real-time market data from database
  async getMarketData() {
    try {
      // Determine API URL (same logic as chat)
      let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      // For Netlify deployments, use Railway
      if (typeof window !== 'undefined' && 
          (window.location.hostname.includes('netlify.app') || 
           window.location.hostname.includes('extraordinary-monstera-e00408'))) {
        baseUrl = 'https://bess-chat-api-production.up.railway.app';
        console.log('🌐 Netlify deployment detected, using Railway API:', baseUrl);
      }
      
      const response = await fetch(`${baseUrl}/api/market-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Market data fetch failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 Market data received:', data)
      
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('❌ Market data fetch error:', error)
      return {
        success: false,
        error: error.message,
        // Return fallback data if fetch fails
        data: {
          totalProjects: 0,
          totalCapacityMW: 0,
          averageDuration: 0,
          topApplications: ['Grid Services', 'Peak Shaving', 'Renewable Integration'],
          regionDistribution: {},
          recentActivity: 0,
          lastUpdated: new Date().toISOString(),
          trend: {
            projectsGrowth: 0,
            capacityGrowth: 0,
            demandScore: 25
          }
        }
      }
    }
  },

  // Complete chat interaction using OpenAI Assistant API
  async processChatMessage(messages, extractedInfo, sessionId, assistantId, threadId) {
    try {
      console.log('🤖 Processing message with Assistant API:', assistantId);
      
      // Get the user's message (last message in array)
      const userMessage = messages[messages.length - 1];
      if (!userMessage || userMessage.role !== 'user') {
        throw new Error('No user message found');
      }

      // Determine API URL
      let apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      // For Netlify deployments, use Railway
      if (typeof window !== 'undefined' && 
          (window.location.hostname.includes('netlify.app') || 
           window.location.hostname.includes('extraordinary-monstera-e00408'))) {
        apiUrl = 'https://bess-chat-api-production.up.railway.app';
      }

      // Call our backend API which handles the Assistant API
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          extractedInfo: extractedInfo,
          assistantId: assistantId,
          threadId: threadId,
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Assistant API call failed');
      }

      // Parse the response to separate visible text from hidden JSON
      const fullResponse = result.data || result.message || '';
      let messageContent = fullResponse;
      let extractedFormData = null;
      
      if (typeof fullResponse === 'string' && fullResponse.includes('===BESS_JSON===')) {
        const parts = fullResponse.split('===BESS_JSON===');
        messageContent = parts[0].trim(); // Visible text only
        
        if (parts[1]) {
          try {
            const jsonText = parts[1].trim();
            extractedFormData = JSON.parse(jsonText);
            console.log('📋 Extracted BESS form data:', extractedFormData);
          } catch (error) {
            console.warn('Failed to parse BESS JSON:', error);
          }
        }
      }
      
      // Return the processed result
      const processedResult = {
        success: true,
        data: {
          reply: messageContent, // Only the visible text, JSON hidden
          extractedInfo: extractedFormData, // Parsed form data for the cards
          threadId: result.threadId // Thread ID for conversation continuity
        }
      };

      // If we have extracted info, save to database
      if (extractedFormData && Object.keys(extractedFormData).length > 0) {
        const userIP = await this.getUserIP();
        
        // Don't save to Supabase automatically - only save when user confirms in step 5
        console.log('📋 Extracted BESS form data:', extractedFormData);
        console.log('🔄 Mapped data for database:', {
          session_id: sessionId,
          ...extractedFormData,
          form_data: extractedFormData,
          chat_messages: messages
        });
      }

      return processedResult;
    } catch (error) {
      console.error('❌ Error processing chat message:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: "I'm experiencing technical difficulties. Please try again."
      };
    }
  },

  // Save form submission
  async submitForm(formData, sessionId, chatMessages = []) {
    try {
      console.log('📋 Starting form submission process...');
      console.log('📝 Form data received:', formData);
      console.log('🆔 Session ID:', sessionId);
      console.log('💬 Chat messages:', chatMessages);
      
      const userIP = await this.getUserIP()
      console.log('🌐 User IP:', userIP);
      
      const projectData = {
        session_id: sessionId,
        ...formData,
        form_data: formData,
        chat_messages: chatMessages,
        user_ip: userIP
      }

      console.log('🔄 Prepared project data:', projectData);

      const result = await supabaseService.saveProject(projectData)
      
      console.log('📊 Supabase result:', result);
      
      if (result.success) {
        console.log('✅ Form submitted and saved to database')
        return { 
          success: true, 
          message: 'Your BESS requirements have been saved successfully!',
          projectId: result.data[0]?.id
        }
      } else {
        console.error('❌ Supabase save failed:', result.error);
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('💥 Form submission error:', error)
      return { 
        success: false, 
        error: error.message,
        message: 'There was an error saving your form. Please try again.'
      }
    }
  },

  // Get product recommendation from specialized BESS assistant
  async getProductRecommendation(formData, sessionId) {
    try {
      console.log('🎯 Requesting BESS product recommendation...');
      
      // Format the project data for the recommendation request
      const projectSummary = Object.entries(formData)
        .filter(([key, value]) => value && key !== 'form_data')
        .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
        .join('\n');

      const recommendationRequest = {
        projectData: formData,
        projectSummary,
        sessionId
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/product-recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recommendationRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎯 Product recommendation result:', result);
      
      return result;
    } catch (error) {
      console.error('💥 Product recommendation error:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Failed to get product recommendation. Please try again.'
      };
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
  },

  // Step 3: Get optimization recommendations using OpenAI Assistant (via backend)
  async getOptimization(projectData, sessionId = null) {
    try {
      console.log('🎯 Step 3: Getting optimization for:', projectData);
      
      // Call our secure backend API instead of OpenAI directly
      let apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      // For any Netlify deployment (development branch or deploy previews), use Railway
      if (typeof window !== 'undefined' && 
          (window.location.hostname.includes('netlify.app') || 
           window.location.hostname.includes('extraordinary-monstera-e00408'))) {
        apiUrl = 'https://bess-chat-api-production.up.railway.app';
        console.log('🌐 Netlify deployment detected, using Railway API:', apiUrl);
      }
      
      const response = await fetch(`${apiUrl}/api/optimization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Optimization completed via backend');

      return {
        success: true, 
        data: {
          result: result.optimization || result.result || result,
          timestamp: new Date().toISOString(),
          projectData,
          sessionId
        }
      };

    } catch (error) {
      console.error('❌ Optimization failed:', error);
      return { success: false, error: error.message };
    }
  }
}