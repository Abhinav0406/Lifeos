// Vapi AI Integration Service
export class VapiService {
  private apiKey: string
  private baseUrl: string = 'https://api.vapi.ai'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Create a new assistant with voice capabilities
  async createVoiceAssistant(config: {
    name: string
    model: string
    voice: string
    systemPrompt: string
    firstMessage?: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          model: {
            provider: 'openai',
            model: config.model,
            messages: [
              {
                role: 'system',
                content: config.systemPrompt
              }
            ]
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: config.voice
          },
          firstMessage: config.firstMessage || 'Hello! I\'m ready to help you. How can I assist you today?',
          endCallPhrases: ['goodbye', 'bye', 'end call', 'hang up'],
          endCallFunctionEnabled: true,
          recordingEnabled: true,
          backgroundSound: 'office',
          maxDurationSeconds: 300,
          silenceTimeoutSeconds: 30,
          responseDelaySeconds: 0.4,
          interruptionThreshold: 0.5,
          interruptionEnabled: true,
          fillersEnabled: true,
          backchannelingEnabled: true,
          webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/webhook`,
          webhookSecret: process.env.VAPI_WEBHOOK_SECRET
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create assistant: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating Vapi assistant:', error)
      throw error
    }
  }

  // Start a phone call with the assistant
  async startCall(assistantId: string, phoneNumber: string) {
    try {
      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId,
          customer: {
            number: phoneNumber
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start call: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error starting Vapi call:', error)
      throw error
    }
  }

  // Start a web call (for browser-based voice interaction)
  async startWebCall(assistantId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId,
          type: 'webCall'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start web call: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error starting Vapi web call:', error)
      throw error
    }
  }

  // Get call status
  async getCallStatus(callId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/call/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get call status: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting call status:', error)
      throw error
    }
  }

  // End a call
  async endCall(callId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/call/${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endCallMessage: 'Thank you for calling. Have a great day!'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to end call: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error ending call:', error)
      throw error
    }
  }

  // Get available voices
  async getAvailableVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voice`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get voices: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting voices:', error)
      throw error
    }
  }

  // Create a custom function for the assistant
  async createFunction(functionConfig: {
    name: string
    description: string
    parameters: any
    webhookUrl: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/function`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(functionConfig)
      })

      if (!response.ok) {
        throw new Error(`Failed to create function: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating function:', error)
      throw error
    }
  }
}

// Voice configuration presets
export const VOICE_PRESETS = {
  professional: {
    voiceId: 'rachel',
    provider: 'elevenlabs',
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8
  },
  friendly: {
    voiceId: 'sarah',
    provider: 'elevenlabs', 
    rate: 1.0,
    pitch: 1.1,
    volume: 0.8
  },
  authoritative: {
    voiceId: 'david',
    provider: 'elevenlabs',
    rate: 0.8,
    pitch: 0.9,
    volume: 0.9
  },
  casual: {
    voiceId: 'emma',
    provider: 'elevenlabs',
    rate: 1.1,
    pitch: 1.2,
    volume: 0.7
  }
}

// AI Personality configurations for voice
export const VOICE_PERSONALITIES = {
  assistant: {
    name: 'AI Assistant',
    systemPrompt: 'You are a helpful AI assistant. Be professional, clear, and concise in your responses.',
    voice: VOICE_PRESETS.professional,
    firstMessage: 'Hello! I\'m your AI assistant. How can I help you today?'
  },
  tutor: {
    name: 'AI Tutor',
    systemPrompt: 'You are a patient and encouraging AI tutor. Explain concepts clearly and ask follow-up questions to ensure understanding.',
    voice: VOICE_PRESETS.friendly,
    firstMessage: 'Hi there! I\'m here to help you learn. What would you like to explore today?'
  },
  consultant: {
    name: 'AI Consultant',
    systemPrompt: 'You are an expert business consultant. Provide strategic insights and actionable advice.',
    voice: VOICE_PRESETS.authoritative,
    firstMessage: 'Good day! I\'m your AI business consultant. What challenge can I help you solve?'
  },
  friend: {
    name: 'AI Friend',
    systemPrompt: 'You are a friendly and supportive AI companion. Be warm, empathetic, and conversational.',
    voice: VOICE_PRESETS.casual,
    firstMessage: 'Hey! Great to meet you! What\'s on your mind today?'
  }
}



