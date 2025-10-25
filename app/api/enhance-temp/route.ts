import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { HfInference } from '@huggingface/inference'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { OPENAI_CONFIG, getModelSettings } from '@/app/lib/openai-config'
import { HUGGINGFACE_CONFIG, getHuggingFaceModelSettings } from '@/app/lib/huggingface-config'
import { GEMINI_CONFIG, getGeminiModelSettings } from '@/app/lib/gemini-config'
import { GROQ_CONFIG, getGroqModelSettings } from '@/app/lib/groq-config'
import { createClient, getUser } from '@/app/lib/supabase-server'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Model constants
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-small'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

// System prompt for enhancement
const ENHANCEMENT_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to improve user prompts to make them more effective for AI models.

Guidelines for improvement:
1. Add missing context and specificity based on the user's answers
2. Clarify the desired output format
3. Structure the prompt for better clarity
4. Include relevant examples if helpful
5. Ensure the prompt follows best practices for AI interaction
6. Incorporate all the user's answers to create a comprehensive, detailed prompt

Return ONLY the improved prompt, nothing else. Do not add explanations or meta-commentary.`

// Different enhancement modes
const ENHANCEMENT_MODES = {
  writing: 'Focus on improving prompts for creative writing, storytelling, and content creation.',
  coding: 'Focus on improving prompts for programming, debugging, and technical assistance.',
  marketing: 'Focus on improving prompts for marketing copy, sales content, and business communication.',
  research: 'Focus on improving prompts for research, analysis, and information gathering.',
  general: 'Apply general prompt improvement techniques for any use case.'
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { prompt, mode = 'general', provider = 'groq', folderId, questionsAndAnswers } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    // Check provider and API key
    if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        )
      }
    } else if (provider === 'huggingface') {
      if (!process.env.HUGGINGFACE_API_KEY) {
        return NextResponse.json(
          { error: 'Hugging Face API key not configured' },
          { status: 500 }
        )
      }
    } else if (provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: 'Google Gemini API key not configured' },
          { status: 500 }
        )
      }
    } else if (provider === 'groq') {
      if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
          { error: 'Groq API key not configured' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid provider specified' },
        { status: 400 }
      )
    }

    let enhancedPrompt = ''
    let aiResponse = ''

    const modeContext = ENHANCEMENT_MODES[mode as keyof typeof ENHANCEMENT_MODES] || ENHANCEMENT_MODES.general

    if (provider === 'openai') {
      const modelSettings = getModelSettings(OPENAI_MODEL)
      
      try {
        // First, enhance the prompt
        let enhancementPrompt = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nMode: ${modeContext}\n\nUser prompt to improve: "${prompt}"`
        
        // Add user's answers if provided
        if (questionsAndAnswers && questionsAndAnswers.length > 0) {
          enhancementPrompt += `\n\nUser's answers to clarifying questions:\n${questionsAndAnswers.map((answer: string, index: number) => `${index + 1}. ${answer}`).join('\n')}`
        }
        
        const enhancementResponse = await openai.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: enhancementPrompt
            }
          ],
          model: OPENAI_MODEL,
          max_tokens: Math.min(500, modelSettings.maxTokens),
          temperature: modelSettings.temperature,
        })

        enhancedPrompt = enhancementResponse.choices[0]?.message?.content || prompt

        // Now generate response using the enhanced prompt
        const finalResponse = await openai.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          model: OPENAI_MODEL,
          max_tokens: modelSettings.maxTokens,
          temperature: modelSettings.temperature,
        })

        aiResponse = finalResponse.choices[0]?.message?.content || 'No response generated'

      } catch (error) {
        console.error('OpenAI API error:', error)
        throw new Error('OpenAI API request failed. Please check your API key and try again.')
      }

    } else if (provider === 'huggingface') {
      const modelSettings = getHuggingFaceModelSettings(HUGGINGFACE_MODEL)
      
      try {
        // First, enhance the prompt
        let enhancementPrompt = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nMode: ${modeContext}\n\nUser prompt to improve: "${prompt}"`
        
        // Add user's answers if provided
        if (questionsAndAnswers && questionsAndAnswers.length > 0) {
          enhancementPrompt += `\n\nUser's answers to clarifying questions:\n${questionsAndAnswers.map((answer: string, index: number) => `${index + 1}. ${answer}`).join('\n')}`
        }
        
        const enhancementResponse = await hf.textGeneration({
          model: HUGGINGFACE_MODEL,
          inputs: enhancementPrompt,
          parameters: {
            max_new_tokens: Math.min(500, modelSettings.maxTokens),
            temperature: modelSettings.temperature,
            return_full_text: false,
          },
        })

        enhancedPrompt = enhancementResponse.generated_text || prompt

        // Now generate response using the enhanced prompt
        const finalResponse = await hf.textGeneration({
          model: HUGGINGFACE_MODEL,
          inputs: enhancedPrompt,
          parameters: {
            max_new_tokens: modelSettings.maxTokens,
            temperature: modelSettings.temperature,
            return_full_text: false,
          },
        })

        aiResponse = finalResponse.generated_text || 'No response generated'

      } catch (error) {
        console.error('Hugging Face API error:', error)
        throw new Error('Hugging Face API request failed. Please check your API key and try again.')
      }

    } else if (provider === 'gemini') {
      const modelSettings = getGeminiModelSettings(GEMINI_MODEL)
      
      try {
        // First, enhance the prompt
        let enhancementPrompt = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nMode: ${modeContext}\n\nUser prompt to improve: "${prompt}"`
        
        // Add user's answers if provided
        if (questionsAndAnswers && questionsAndAnswers.length > 0) {
          enhancementPrompt += `\n\nUser's answers to clarifying questions:\n${questionsAndAnswers.map((answer: string, index: number) => `${index + 1}. ${answer}`).join('\n')}`
        }
        
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
        const enhancementResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: enhancementPrompt }] }],
          generationConfig: {
            maxOutputTokens: Math.min(500, modelSettings.maxTokens),
            temperature: modelSettings.temperature,
          },
        })

        enhancedPrompt = enhancementResult.response.text() || prompt

        // Now generate response using the enhanced prompt
        const finalResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            maxOutputTokens: modelSettings.maxTokens,
            temperature: modelSettings.temperature,
          },
        })

        aiResponse = finalResult.response.text() || 'No response generated'

      } catch (error) {
        console.error('Gemini API error:', error)
        throw new Error('Gemini API request failed. Please check your API key and try again.')
      }

    } else if (provider === 'groq') {
      const modelSettings = getGroqModelSettings(GROQ_MODEL)
      
      try {
        // First, enhance the prompt
        let enhancementPrompt = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nMode: ${modeContext}\n\nUser prompt to improve: "${prompt}"`
        
        // Add user's answers if provided
        if (questionsAndAnswers && questionsAndAnswers.length > 0) {
          enhancementPrompt += `\n\nUser's answers to clarifying questions:\n${questionsAndAnswers.map((answer: string, index: number) => `${index + 1}. ${answer}`).join('\n')}`
        }
        
        const enhancementResponse = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: enhancementPrompt
            }
          ],
          model: GROQ_MODEL,
          max_tokens: Math.min(500, modelSettings.maxTokens),
          temperature: modelSettings.temperature,
        })

        enhancedPrompt = enhancementResponse.choices[0]?.message?.content || prompt

        // Now generate response using the enhanced prompt
        const finalResponse = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          model: GROQ_MODEL,
          max_tokens: modelSettings.maxTokens,
          temperature: modelSettings.temperature,
        })

        aiResponse = finalResponse.choices[0]?.message?.content || 'No response generated'

      } catch (error) {
        console.error('Groq API error:', error)
        throw new Error('Groq API request failed. Please check your API key and try again.')
      }
    }

    // Save to database
    const supabase = createClient()
    
    const { data: savedResult, error: saveError } = await supabase
      .from('enhancement_results')
      .insert({
        user_id: user.id,
        original_prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        ai_response: aiResponse,
        mode,
        provider,
        folder_id: folderId || null,
        questions_and_answers: questionsAndAnswers || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving to database:', saveError)
      // Still return the result even if saving fails
    }

    return NextResponse.json({
      id: savedResult?.id || 'temp-' + Date.now(),
      originalPrompt: prompt,
      enhancedPrompt,
      aiResponse,
      mode,
      provider,
      folderId: folderId || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in prompt enhancement:', error)
    
    if (error instanceof Error) {
      // Handle specific API errors
      if (error.message.includes('model') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Model not available. Please check your API plan or try a different model.' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your API key configuration.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later or check your API plan.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
