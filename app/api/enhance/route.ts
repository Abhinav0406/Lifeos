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

// Initialize Hugging Face client (kept for potential future use)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Get the model to use (can be overridden via environment variable)
const OPENAI_MODEL = process.env.OPENAI_MODEL || OPENAI_CONFIG.defaultModel
const HF_MODEL = process.env.HUGGINGFACE_MODEL || HUGGINGFACE_CONFIG.defaultModel
const GEMINI_MODEL = process.env.GEMINI_MODEL || GEMINI_CONFIG.defaultModel
const GROQ_MODEL = process.env.GROQ_MODEL || GROQ_CONFIG.defaultModel

// Prompt enhancement system message
const ENHANCEMENT_SYSTEM_PROMPT = `You are an expert prompt engineer. Your job is to analyze and improve user prompts to make them more effective for AI language models.

When given a user prompt, you should:
1. Identify the user's intent and goals
2. Add missing context or specificity
3. Structure the prompt for better clarity
4. Include relevant examples if helpful
5. Ensure the prompt follows best practices for AI interaction

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
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id)

    const supabase = createClient()

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
        { error: 'Invalid provider. Must be "openai", "huggingface", "gemini", or "groq"' },
        { status: 400 }
      )
    }

    // Create enhancement prompt based on mode
    const modeContext = ENHANCEMENT_MODES[mode as keyof typeof ENHANCEMENT_MODES] || ENHANCEMENT_MODES.general
    const enhancementPrompt = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nMode: ${modeContext}\n\nUser prompt to improve: "${prompt}"`

    let enhancedPrompt: string = prompt
    let aiResponse: string = 'No response generated'

    if (provider === 'openai') {
      // Get model settings
      const modelSettings = getModelSettings(OPENAI_MODEL)

      // Get enhanced prompt from OpenAI
      const enhancementResponse = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: ENHANCEMENT_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Mode: ${modeContext}\n\nUser prompt to improve: "${prompt}"`
          }
        ],
        max_tokens: Math.min(1000, modelSettings.maxTokens),
        temperature: modelSettings.temperature,
      })

      enhancedPrompt = enhancementResponse.choices[0]?.message?.content || prompt

      // Now send the enhanced prompt to get the final response
      const finalResponse = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        max_tokens: modelSettings.maxTokens,
        temperature: modelSettings.temperature,
      })

      aiResponse = finalResponse.choices[0]?.message?.content || 'No response generated'

    } else if (provider === 'huggingface') {
      // Use Hosted Inference API directly to avoid provider selection issues
      const modelSettings = getHuggingFaceModelSettings(HF_MODEL)

      // Use models that are actually available through Hosted Inference API (FREE TIER)
      const fallbackModels = [
        'microsoft/DialoGPT-small',
        'facebook/blenderbot-400M-distill',
        'EleutherAI/gpt-neo-125M',
      ]

      const callHuggingFace = async (model: string, input: string, maxNewTokens: number) => {
        const res = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}` as any, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: input,
            parameters: {
              max_new_tokens: Math.min(500, maxNewTokens),
              temperature: modelSettings.temperature,
              top_p: modelSettings.topP,
              return_full_text: false,
            },
          }),
        } as RequestInit)

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`HF API error (${res.status}): ${text}`)
        }
        const data = await res.json() as any
        // text2text-generation and text-generation both return array with generated_text
        if (Array.isArray(data) && data[0]?.generated_text) {
          return String(data[0].generated_text)
        }
        if (typeof data === 'object' && data?.generated_text) {
          return String(data.generated_text)
        }
        throw new Error('Unexpected HF API response format')
      }

      let success = false
      for (const model of fallbackModels) {
        try {
          const enhancementInput = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nMode: ${modeContext}\n\nUser prompt to improve: "${prompt}"\n\nEnhanced prompt:`
          const enhanced = await callHuggingFace(model, enhancementInput, Math.min(500, modelSettings.maxTokens))
          enhancedPrompt = enhanced.trim() || prompt

          const final = await callHuggingFace(model, enhancedPrompt, modelSettings.maxTokens)
          aiResponse = final.trim() || 'No response generated'
          success = true
          break
        } catch (err) {
          console.warn(`Model ${model} failed, trying next model:`, err)
          continue
        }
      }

      if (!success) {
        throw new Error('All Hugging Face models failed. Please check your API key or try again later.')
      }

    } else if (provider === 'gemini') {
      // Get model settings
      const modelSettings = getGeminiModelSettings(GEMINI_MODEL)
      
      try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        // First, enhance the prompt
        const enhancementPrompt = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nMode: ${modeContext}\n\nUser prompt to improve: "${prompt}"`
        
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
      // Get model settings
      const modelSettings = getGroqModelSettings(GROQ_MODEL)
      
      try {
        // First, enhance the prompt
        const enhancementPrompt = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nMode: ${modeContext}\n\nUser prompt to improve: "${prompt}"`
        
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
    const { data: savedResult, error: saveError } = await supabase
      .from('enhancement_results')
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        original_prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        ai_response: aiResponse,
        mode,
        provider,
        questions_and_answers: questionsAndAnswers ? JSON.stringify(questionsAndAnswers) : null,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving to database:', saveError)
      // Still return the result even if saving fails
    }

    return NextResponse.json({
      id: savedResult?.id,
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
      
      if (error.message.includes('insufficient_quota') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Insufficient API credits. Please add credits to your account.' },
          { status: 402 }
        )
      }
      
      if (error.message.includes('invalid_api_key') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your API key.' },
          { status: 401 }
        )
      }

      if (error.message.includes('rate_limit') || error.message.includes('too many requests')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      if (error.message.includes('model') && error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Model not found. Please check the model name or try a different model.' },
          { status: 404 }
        )
      }

      if (error.message.includes('No Inference Provider available')) {
        return NextResponse.json(
          { error: 'Model not available through Hugging Face Inference API. Please try a different model or check your API key.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
