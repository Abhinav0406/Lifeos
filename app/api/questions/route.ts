import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { HfInference } from '@huggingface/inference'

import { getModelSettings } from '@/app/lib/openai-config'
import { getGeminiModelSettings } from '@/app/lib/gemini-config'
import { getGroqModelSettings } from '@/app/lib/groq-config'
import { getHuggingFaceModelSettings } from '@/app/lib/huggingface-config'
import { createClient, getUser } from '@/app/lib/supabase-server'

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

const QUESTION_GENERATION_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to ask clarifying questions to a user to gather more context and details about their initial prompt. This will help in creating a much better, more specific, and more effective prompt for an AI model.

Based on the user's initial prompt and the selected mode, generate 3-5 concise, open-ended questions. The questions should help uncover missing information, user intent, specific requirements, or constraints.

Format your response as a JSON object with a "questions" array containing strings.

Example:
User Prompt: "write a story"
Mode: "writing"
Output: {"questions": ["What genre should the story be?", "Who is the main character?", "What is the setting or time period?", "What is the desired tone or mood?", "Are there any specific plot points or themes you want to include?"]}`

export async function POST(req: NextRequest) {
  try {
    // Get user from session
    const { user, error: authError } = await getUser()
    
    if (authError || !user) {
      console.error('Questions API auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      )
    }

    console.log('Questions API - User authenticated:', user.id)

    const { prompt, mode, provider } = await req.json()

    if (!prompt || !mode || !provider) {
      return NextResponse.json(
        { error: 'Missing prompt, mode, or provider' },
        { status: 400 }
      )
    }

    let questions: string[] = []
    const modeContext = mode === 'general' ? 'general purpose' : mode

    const userPromptForQuestions = `Initial User Prompt: "${prompt}"\nMode: "${modeContext}"`

    if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        )
      }
      const modelSettings = getModelSettings(process.env.OPENAI_MODEL || 'gpt-3.5-turbo')
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: QUESTION_GENERATION_SYSTEM_PROMPT },
          { role: 'user', content: userPromptForQuestions },
        ],
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        max_tokens: Math.min(500, modelSettings.maxTokens),
        temperature: modelSettings.temperature,
        response_format: { type: 'json_object' },
      })
      const content = completion.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        questions = parsed.questions || []
      }

    } else if (provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: 'Google Gemini API key not configured' },
          { status: 500 }
        )
      }
      const modelSettings = getGeminiModelSettings(process.env.GEMINI_MODEL || 'gemini-1.5-flash')
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' })
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: QUESTION_GENERATION_SYSTEM_PROMPT + '\n\n' + userPromptForQuestions }] }
        ],
        generationConfig: {
          maxOutputTokens: Math.min(500, modelSettings.maxTokens),
          temperature: modelSettings.temperature,
          responseMimeType: 'application/json',
        },
      })
      const content = result.response.text()
      if (content) {
        const parsed = JSON.parse(content)
        questions = parsed.questions || []
      }

    } else if (provider === 'groq') {
      if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
          { error: 'Groq API key not configured' },
          { status: 500 }
        )
      }
      const modelSettings = getGroqModelSettings(process.env.GROQ_MODEL || 'llama-3.1-8b-instant')
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: QUESTION_GENERATION_SYSTEM_PROMPT },
          { role: 'user', content: userPromptForQuestions },
        ],
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        max_tokens: Math.min(500, modelSettings.maxTokens),
        temperature: modelSettings.temperature,
        response_format: { type: 'json_object' },
      })
      const content = completion.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        questions = parsed.questions || []
      }

    } else if (provider === 'huggingface') {
      if (!process.env.HUGGINGFACE_API_KEY) {
        return NextResponse.json(
          { error: 'Hugging Face API key not configured' },
          { status: 500 }
        )
      }
      const modelSettings = getHuggingFaceModelSettings(process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-small')
      const fallbackModels = [
        'microsoft/DialoGPT-small',
        'facebook/blenderbot-400M-distill',
        'EleutherAI/gpt-neo-125M',
      ]
      let success = false
      for (const modelName of fallbackModels) {
        try {
          const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
            headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
            method: 'POST',
            body: JSON.stringify({
              inputs: QUESTION_GENERATION_SYSTEM_PROMPT + '\n\n' + userPromptForQuestions,
              parameters: {
                max_new_tokens: Math.min(500, modelSettings.maxTokens),
                temperature: modelSettings.temperature,
              },
            }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result && result[0] && result[0].generated_text) {
              const generatedText = result[0].generated_text
              const jsonStartIndex = generatedText.indexOf('{')
              const jsonEndIndex = generatedText.lastIndexOf('}')
              if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                const jsonString = generatedText.substring(jsonStartIndex, jsonEndIndex + 1)
                const parsed = JSON.parse(jsonString)
                questions = parsed.questions || []
                success = true
                break
              }
            }
          }
        } catch (error) {
          console.warn(`Hugging Face model ${modelName} failed for question generation:`, error)
        }
      }
      if (!success) {
        throw new Error('All Hugging Face models failed for question generation. Please check your API key or try again later.')
      }
    }

    return NextResponse.json({ questions }, { status: 200 })
  } catch (error: any) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
