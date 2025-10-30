import { NextRequest, NextResponse } from 'next/server'

// POST /api/chat
// Body: { messages: { role: 'user'|'assistant'|'system', content: string }[], model?: string }
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 })

    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Body must include 'messages' array" }, { status: 400 })
    }

    const model = body.model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature: 0.7,
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      return NextResponse.json({ error: 'Chat request failed', details: errText }, { status: resp.status })
    }

    const json = await resp.json()
    const reply = json?.choices?.[0]?.message?.content ?? ''
    return NextResponse.json({ reply, raw: json })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal error', message }, { status: 500 })
  }
}




