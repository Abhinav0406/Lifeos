// Configuration for Google Gemini models (Free Tier)
export const GEMINI_CONFIG = {
  // Available Gemini models (Free tier)
  models: {
    'gemini-1.5-flash': 'Gemini 1.5 Flash (Free)',
    'gemini-1.5-pro': 'Gemini 1.5 Pro (Free)',
  },
  
  // Default model to use (free tier)
  defaultModel: 'gemini-1.5-flash',
  
  // Model-specific settings
  settings: {
    'gemini-1.5-flash': {
      maxTokens: 1000, // Reduced for free tier
      temperature: 0.7,
    },
    'gemini-1.5-pro': {
      maxTokens: 1000, // Reduced for free tier
      temperature: 0.7,
    },
  }
}

// Helper function to get model settings
export function getGeminiModelSettings(model: string) {
  const defaultKey = GEMINI_CONFIG.defaultModel as keyof typeof GEMINI_CONFIG.settings
  const settingsMap: Record<string, (typeof GEMINI_CONFIG.settings)[typeof defaultKey]> =
    GEMINI_CONFIG.settings as unknown as Record<string, (typeof GEMINI_CONFIG.settings)[typeof defaultKey]>

  return settingsMap[model] || GEMINI_CONFIG.settings[defaultKey]
}
