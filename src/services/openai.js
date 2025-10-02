// OpenAI API service for chat functionality
export const openaiService = {
  // Chat with OpenAI - this will be called through your backend API
  async sendChatMessage(messages, extractedInfo = null) {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID
      
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages,
          extractedInfo,
          assistantId // Include assistant ID if available
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return { 
        success: false, 
        error: error.message,
        fallback: "I'm having trouble connecting right now. Please try again in a moment."
      }
    }
  },

  // Extract BESS specifications from text (for future datasheet upload)
  async extractSpecifications(text) {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      
      const response = await fetch(`${apiUrl}/api/extract-specs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Specification extraction error:', error)
      return { success: false, error: error.message }
    }
  },

  // Validate extracted information using AI
  async validateBESSSpecs(specs) {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
      
      const response = await fetch(`${apiUrl}/api/validate-specs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ specs })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Validation error:', error)
      return { success: false, error: error.message }
    }
  }
}