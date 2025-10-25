// Simple API test endpoint to check OpenAI and Hugging Face connections
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { HfInference } from '@huggingface/inference'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') || 'openai'

    const results: any = {
      provider,
      timestamp: new Date().toISOString()
    }

    if (provider === 'openai') {
      // Test OpenAI connection
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { 
            ...results,
            success: false,
            error: 'OpenAI API key not configured',
            hasKey: false 
          },
          { status: 500 }
        )
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "Hello, OpenAI API test successful!"' }],
        max_tokens: 10,
      })

      return NextResponse.json({
        ...results,
        success: true,
        message: response.choices[0]?.message?.content,
        hasKey: true,
        keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
      })

    } else if (provider === 'huggingface') {
      // Test Hugging Face connection
      if (!process.env.HUGGINGFACE_API_KEY) {
        return NextResponse.json(
          { 
            ...results,
            success: false,
            error: 'Hugging Face API key not configured',
            hasKey: false 
          },
          { status: 500 }
        )
      }

      const response = await hf.textGeneration({
        model: 'google/flan-t5-base',
        inputs: 'Hello, Hugging Face API test successful!',
        parameters: {
          max_new_tokens: 10,
          temperature: 0.7,
          return_full_text: false,
        }
      })

      return NextResponse.json({
        ...results,
        success: true,
        message: response.generated_text?.trim(),
        hasKey: true,
        keyPrefix: process.env.HUGGINGFACE_API_KEY?.substring(0, 10) + '...'
      })

    } else {
      return NextResponse.json(
        { 
          ...results,
          success: false,
          error: 'Invalid provider. Must be "openai" or "huggingface"' 
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('API test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasKey: !!process.env.OPENAI_API_KEY || !!process.env.HUGGINGFACE_API_KEY,
      openaiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
      huggingfaceKeyPrefix: process.env.HUGGINGFACE_API_KEY?.substring(0, 10) + '...'
    }, { status: 500 })
  }
}
