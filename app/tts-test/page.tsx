'use client'

import { useMemo, useRef, useState } from 'react'

export default function TTSTestPage() {
  const [text, setText] = useState('Hello from PlayAI TTS on Groq!')
  const [voice, setVoice] = useState<string>('Atlas-PlayAI')
  const [format, setFormat] = useState<'mp3' | 'wav' | 'ogg'>('mp3')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const canSpeak = useMemo(() => text.trim().length > 0 && !isLoading, [text, isLoading])

  async function handleSpeak() {
    if (!canSpeak) return
    setIsLoading(true)
    setError(null)
    setAudioUrl(null)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, format }),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || `Request failed: ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      // Autoplay
      setTimeout(() => {
        audioRef.current?.play().catch(() => {})
      }, 0)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">PlayAI TTS Test</h1>
      <label className="block text-sm font-medium">Text</label>
      <textarea
        className="w-full rounded border p-3"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something to speak..."
      />

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium">Voice</label>
          <select
            className="w-full rounded border p-2"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
          >
            {[
              'Aaliyah-PlayAI','Adelaide-PlayAI','Angelo-PlayAI','Arista-PlayAI','Atlas-PlayAI',
              'Basil-PlayAI','Briggs-PlayAI','Calum-PlayAI','Celeste-PlayAI','Cheyenne-PlayAI',
              'Chip-PlayAI','Cillian-PlayAI','Deedee-PlayAI','Eleanor-PlayAI','Fritz-PlayAI',
              'Gail-PlayAI','Indigo-PlayAI','Jennifer-PlayAI','Judy-PlayAI','Mamaw-PlayAI',
              'Mason-PlayAI','Mikail-PlayAI','Mitch-PlayAI','Nia-PlayAI','Quinn-PlayAI',
              'Ruby-PlayAI','Thunder-PlayAI',
            ].map(v => (<option key={v} value={v}>{v}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Format</label>
          <select
            className="rounded border p-2"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'mp3' | 'wav' | 'ogg')}
          >
            <option value="mp3">mp3</option>
            <option value="wav">wav</option>
            <option value="ogg">ogg</option>
          </select>
        </div>
        <button
          onClick={handleSpeak}
          disabled={!canSpeak}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isLoading ? 'Generating…' : 'Speak'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="pt-2">
        <audio ref={audioRef} src={audioUrl ?? undefined} controls />
        {audioUrl && (
          <div className="mt-2">
            <a className="text-blue-600 underline" href={audioUrl} download={`speech.${format}`}>Download audio</a>
          </div>
        )}
      </div>
    </div>
  )
}


