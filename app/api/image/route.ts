import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, getUser } from '@/app/lib/supabase-server'

// Initialize OpenAI client for DALL-E
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Image generation providers
type ImageProvider = 'dall-e-2' | 'dall-e-3' | 'stable-diffusion'

interface ImageGenerationRequest {
  prompt: string
  provider?: ImageProvider
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  n?: number // number of images (DALL-E 2 only)
}

// POST /api/image
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ImageGenerationRequest = await request.json()
    const { prompt, provider = 'dall-e-3', size = '1024x1024', quality = 'standard', n = 1 } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    let imageUrl: string | null = null
    let revisedPrompt: string | undefined = undefined

    if (provider === 'dall-e-3' || provider === 'dall-e-2') {
      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
      }

      // DALL-E 3 only supports 1 image, specific sizes, and quality
      let dallEConfig: any
      if (provider === 'dall-e-3') {
        dallEConfig = {
          model: 'dall-e-3' as const,
          size: (size === '1024x1024' || size === '1792x1024' || size === '1024x1792') 
            ? size 
            : '1024x1024' as const,
          quality: quality === 'hd' ? 'hd' : 'standard' as const,
          n: 1,
        }
      } else {
        // DALL-E 2 - normalize size to supported values
        let dallE2Size: '256x256' | '512x512' | '1024x1024' = '1024x1024'
        if (size === '256x256' || size === '512x512') {
          dallE2Size = size
        }
        dallEConfig = {
          model: 'dall-e-2' as const,
          size: dallE2Size,
          n: Math.min(n, 10), // DALL-E 2 supports up to 10 images
        }
      }

      try {
        const response = await openai.images.generate({
          ...dallEConfig,
          prompt: prompt.trim(),
          // Ensure we get a URL; SDK may default to base64
          response_format: 'url',
        } as any)

        const first = response?.data?.[0] as any
        if (!first) {
          return NextResponse.json({ error: 'Empty response from image API' }, { status: 502 })
        }

        // DALL·E 3 sometimes returns revised_prompt
        if (first.revised_prompt) revisedPrompt = first.revised_prompt

        if (first.url) {
          imageUrl = first.url
        } else if (first.b64_json) {
          // Fallback: some SDK versions return base64 by default
          imageUrl = `data:image/png;base64,${first.b64_json}`
        } else {
          return NextResponse.json({ error: 'Image data missing from provider response' }, { status: 502 })
        }
      } catch (error: any) {
        console.error('OpenAI image generation error:', error)
        const status = error?.status || 500
        const message = error?.error?.message || error?.message || 'Unknown error'
        return NextResponse.json({
          error: 'Image generation failed',
          details: message
        }, { status })
      }
    } else if (provider === 'stable-diffusion') {
      // Stability AI - requires multipart/form-data and Accept: image/*
      const stabilityApiKey = process.env.STABILITY_API_KEY
      if (!stabilityApiKey) {
        return NextResponse.json({ error: 'STABILITY_API_KEY not configured' }, { status: 500 })
      }

      try {
        const form = new FormData()
        form.append('prompt', prompt.trim())
        // Optional params: style_preset, output_format, etc.
        // Image size controlled via extras on newer endpoints; keep default 1024x1024 for simplicity

        const stabilityResponse = await fetch(
          'https://api.stability.ai/v2beta/stable-image/generate/ultra',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stabilityApiKey}`,
              'Accept': 'image/*',
              // Do NOT set Content-Type; let fetch set the multipart boundary
            },
            body: form,
          }
        )

        if (!stabilityResponse.ok) {
          const errorText = await stabilityResponse.text()
          return NextResponse.json({
            error: 'Stability AI generation failed',
            details: errorText
          }, { status: stabilityResponse.status })
        }

        const arrayBuffer = await stabilityResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        imageUrl = `data:image/png;base64,${base64}`
      } catch (error: any) {
        console.error('Stability AI image generation error:', error)
        return NextResponse.json({
          error: 'Image generation failed',
          details: error.message || 'Unknown error'
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
    }

    // Save to database via conversations API
    // We'll handle this on the frontend, but we can return the image data
    return NextResponse.json({
      success: true,
      imageUrl,
      revisedPrompt: revisedPrompt || prompt,
      provider,
      size,
      prompt: prompt.trim(),
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Internal error', message }, { status: 500 })
  }
}
