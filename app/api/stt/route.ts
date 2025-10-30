import { NextRequest, NextResponse } from 'next/server'

// POST /api/stt
// Accepts multipart/form-data with field `file` (audio blob)
// Optional query/body: { language?: string, model?: string }
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    const language = (form.get('language') as string) || undefined
    const model = (form.get('model') as string) || 'whisper-large-v3-turbo'

    if (!file) {
      return NextResponse.json({ error: "Field 'file' is required" }, { status: 400 })
    }

    const upstream = new FormData()
    upstream.append('file', file, file.name || 'audio.webm')
    upstream.append('model', model)
    if (language) upstream.append('language', language)

    const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: upstream,
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      return NextResponse.json({ error: 'Transcription failed', details: errText }, { status: resp.status })
    }

    const json = await resp.json()
    // OpenAI-compatible returns { text: string, ... }
    return NextResponse.json(json, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal error', message }, { status: 500 })
  }
}




