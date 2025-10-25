// Configuration for Groq models (Free Tier)
export const GROQ_CONFIG = {
  // Available Groq models (FREE TIER) - Updated 2024
  models: {
    'llama-3.1-8b-instant': 'Llama 3.1 8B Instant (Free)',
    'llama-3.1-70b-versatile': 'Llama 3.1 70B Versatile (Free)',
    'mixtral-8x7b-32768': 'Mixtral 8x7B (Free)',
    'gemma2-9b-it': 'Gemma 2 9B (Free)',
  },
  
  // Default model to use (free tier)
  defaultModel: 'llama-3.1-8b-instant',
  
  // Model-specific settings (optimized for free tier)
  settings: {
    'llama-3.1-8b-instant': {
      maxTokens: 1000,
      temperature: 0.7,
    },
    'llama-3.1-70b-versatile': {
      maxTokens: 1000,
      temperature: 0.7,
    },
    'mixtral-8x7b-32768': {
      maxTokens: 1000,
      temperature: 0.7,
    },
    'gemma2-9b-it': {
      maxTokens: 1000,
      temperature: 0.7,
    },
  }
}

// Helper function to get model settings
export function getGroqModelSettings(model: string) {
  const defaultKey = GROQ_CONFIG.defaultModel as keyof typeof GROQ_CONFIG.settings
  const settingsMap: Record<string, (typeof GROQ_CONFIG.settings)[typeof defaultKey]> =
    GROQ_CONFIG.settings as unknown as Record<string, (typeof GROQ_CONFIG.settings)[typeof defaultKey]>

  return settingsMap[model] || GROQ_CONFIG.settings[defaultKey]
}
