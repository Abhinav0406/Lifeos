// Configuration for OpenAI models
export const OPENAI_CONFIG = {
  // Available models - uncomment the ones you have access to
  models: {
    // GPT-4 models (require special access)
    // 'gpt-4': 'GPT-4',
    // 'gpt-4-turbo': 'GPT-4 Turbo',
    
    // GPT-3.5 models (widely available)
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
  },
  
  // Default model to use
  defaultModel: 'gpt-3.5-turbo',
  
  // Model-specific settings
  settings: {
    'gpt-3.5-turbo': {
      maxTokens: 2000,
      temperature: 0.7,
    },
    'gpt-3.5-turbo-16k': {
      maxTokens: 4000,
      temperature: 0.7,
    },
    'gpt-4': {
      maxTokens: 3000,
      temperature: 0.7,
    },
    'gpt-4-turbo': {
      maxTokens: 4000,
      temperature: 0.7,
    },
  }
}

// Helper function to get model settings
export function getModelSettings(model: string) {
  const defaultKey = OPENAI_CONFIG.defaultModel as keyof typeof OPENAI_CONFIG.settings
  const settingsMap: Record<string, (typeof OPENAI_CONFIG.settings)[typeof defaultKey]> =
    OPENAI_CONFIG.settings as unknown as Record<string, (typeof OPENAI_CONFIG.settings)[typeof defaultKey]>

  return settingsMap[model] || OPENAI_CONFIG.settings[defaultKey]
}
