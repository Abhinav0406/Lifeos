// Configuration for Hugging Face models (Free Tier)
export const HUGGINGFACE_CONFIG = {
  // Available models for text generation (using models available through Inference API - FREE)
  models: {
    'microsoft/DialoGPT-small': 'DialoGPT Small (Free)',
    'facebook/blenderbot-400M-distill': 'BlenderBot 400M (Free)',
    'EleutherAI/gpt-neo-125M': 'GPT-Neo 125M (Free)',
    'google/flan-t5-small': 'FLAN-T5 Small (Free)',
  },
  
  // Default model to use (free tier)
  defaultModel: 'microsoft/DialoGPT-small',
  
  // Model-specific settings (optimized for free tier)
  settings: {
    'microsoft/DialoGPT-small': {
      maxTokens: 500, // Reduced for free tier
      temperature: 0.7,
      topP: 0.9,
    },
    'facebook/blenderbot-400M-distill': {
      maxTokens: 500, // Reduced for free tier
      temperature: 0.7,
      topP: 0.9,
    },
    'EleutherAI/gpt-neo-125M': {
      maxTokens: 500, // Reduced for free tier
      temperature: 0.7,
      topP: 0.9,
    },
    'google/flan-t5-small': {
      maxTokens: 500, // Reduced for free tier
      temperature: 0.7,
      topP: 0.9,
    },
  }
}

// Helper function to get model settings
export function getHuggingFaceModelSettings(model: string) {
  const defaultKey = HUGGINGFACE_CONFIG.defaultModel as keyof typeof HUGGINGFACE_CONFIG.settings
  const settingsMap: Record<string, (typeof HUGGINGFACE_CONFIG.settings)[typeof defaultKey]> =
    HUGGINGFACE_CONFIG.settings as unknown as Record<string, (typeof HUGGINGFACE_CONFIG.settings)[typeof defaultKey]>

  return settingsMap[model] || HUGGINGFACE_CONFIG.settings[defaultKey]
}

// Helper function to check if model is available
export function isModelAvailable(model: string): boolean {
  return model in HUGGINGFACE_CONFIG.models
}
