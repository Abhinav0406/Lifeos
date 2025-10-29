import { NextRequest, NextResponse } from 'next/server'

// POST /api/tts
// Body: { text: string, voice?: string, format?: 'mp3'|'wav'|'ogg' }
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 })
    }

    const body = await request.json().catch(() => null)
    if (!body || (typeof body !== 'object')) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const text = (body.text ?? body.input) as unknown
    const voice = body.voice as unknown
    const format = body.format as unknown

    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: "Field 'text' (or 'input') is required and must be a non-empty string" }, { status: 400 })
    }

    const model = 'playai-tts'
    const outputFormat = (format as 'mp3'|'wav'|'ogg') || (process.env.GROQ_TTS_FORMAT as 'mp3'|'wav'|'ogg') || 'mp3'

    // Supported PlayAI voices per Groq
    const allowedVoices = [
      'Aaliyah-PlayAI','Adelaide-PlayAI','Angelo-PlayAI','Arista-PlayAI','Atlas-PlayAI',
      'Basil-PlayAI','Briggs-PlayAI','Calum-PlayAI','Celeste-PlayAI','Cheyenne-PlayAI',
      'Chip-PlayAI','Cillian-PlayAI','Deedee-PlayAI','Eleanor-PlayAI','Fritz-PlayAI',
      'Gail-PlayAI','Indigo-PlayAI','Jennifer-PlayAI','Judy-PlayAI','Mamaw-PlayAI',
      'Mason-PlayAI','Mikail-PlayAI','Mitch-PlayAI','Nia-PlayAI','Quinn-PlayAI',
      'Ruby-PlayAI','Thunder-PlayAI'
    ] as const

    const envVoice = process.env.GROQ_TTS_VOICE
    let selectedVoice = (voice as string) || envVoice || 'Atlas-PlayAI'
    if (!allowedVoices.includes(selectedVoice as any)) {
      // try to normalize common aliases
      const alias = selectedVoice.toLowerCase()
      if (alias === 'atlas') selectedVoice = 'Atlas-PlayAI'
      else if (alias === 'ruby') selectedVoice = 'Ruby-PlayAI'
      else selectedVoice = 'Atlas-PlayAI'
    }

    // Groq provides an OpenAI-compatible TTS endpoint
    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice: selectedVoice,
        // OpenAI-compatible field name is `response_format`
        response_format: outputFormat,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      return NextResponse.json({ error: 'TTS request failed', details: errText }, { status: response.status })
    }

    const audioArrayBuffer = await response.arrayBuffer()
    return new NextResponse(Buffer.from(audioArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': outputFormat === 'mp3' ? 'audio/mpeg' : outputFormat === 'wav' ? 'audio/wav' : 'audio/ogg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal error', message }, { status: 500 })
  }
}


