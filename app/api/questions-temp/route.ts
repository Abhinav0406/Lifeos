import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { HfInference } from '@huggingface/inference'

import { getModelSettings } from '@/app/lib/openai-config'
import { getGeminiModelSettings } from '@/app/lib/gemini-config'
import { getGroqModelSettings } from '@/app/lib/groq-config'
import { getHuggingFaceModelSettings } from '@/app/lib/huggingface-config'
import { getUser } from '@/app/lib/supabase-server'

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

const QUESTION_GENERATION_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to ask clarifying questions to help improve a user's prompt and make it more specific and effective.

IMPORTANT: Generate questions that are SPECIFICALLY RELATED to the user's prompt topic. Do NOT ask generic questions like "What type of interaction do you want?" or "Provide a greeting". Instead, ask questions that help clarify details about the specific topic mentioned in their prompt.

IMPORTANT: If the user has already provided answers to previous questions, build upon those answers and ask NEW questions that haven't been covered yet. Do NOT repeat similar questions.

Based on the user's initial prompt, selected mode, and any previous answers, generate relevant questions. Each question should have multiple choice options (3-4 options each) to make it easier for the user to respond.

Format your response as a JSON object with a "questions" array. Each question should have:
- "question": the question text (must be related to the user's prompt topic)
- "options": array of 3-4 multiple choice options
- "type": "multiple_choice"

Examples:

User Prompt: "write about lord rama"
Mode: "writing"
Previous answers: ["His personal struggles and relationships"]
Output: {
  "questions": [
    {
      "question": "What writing style should I use?",
      "options": ["Narrative storytelling", "Historical analysis", "Religious interpretation", "Biographical account"],
      "type": "multiple_choice"
    },
    {
      "question": "What is the target audience?",
      "options": ["General readers", "Religious scholars", "Children", "Academic researchers"],
      "type": "multiple_choice"
    }
  ]
}

User Prompt: "create a marketing campaign"
Mode: "marketing"
Previous answers: ["Technology product", "Increase brand awareness"]
Output: {
  "questions": [
    {
      "question": "What is the target demographic?",
      "options": ["Young adults (18-25)", "Professionals (25-40)", "Families", "Seniors (50+)"],
      "type": "multiple_choice"
    },
    {
      "question": "What is the budget range?",
      "options": ["Under $10,000", "$10,000 - $50,000", "$50,000 - $100,000", "Over $100,000"],
      "type": "multiple_choice"
    }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    // Get user from session
    const { user } = await getUser()
    
    // Continue with question generation regardless of auth status
    const { prompt, mode, provider, previousAnswers = [] } = await req.json()

    if (!prompt || !mode || !provider) {
      return NextResponse.json(
        { error: 'Missing prompt, mode, or provider' },
        { status: 400 }
      )
    }

    let questions: string[] = []
    const modeContext = mode === 'general' ? 'general purpose' : mode

    // Limit questions to maximum 5
    const MAX_QUESTIONS = 5
    if (previousAnswers.length >= MAX_QUESTIONS) {
      return NextResponse.json({ questions: [] }, { status: 200 })
    }

    const userPromptForQuestions = `Initial User Prompt: "${prompt}"\nMode: "${modeContext}"\n\nPrevious answers provided: ${previousAnswers.length > 0 ? previousAnswers.join(', ') : 'None'}\n\nGenerate ${Math.min(3, MAX_QUESTIONS - previousAnswers.length)} more questions to clarify the prompt.`

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
