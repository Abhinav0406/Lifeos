'use client'

import { useEffect, useRef, useState } from 'react'

export default function STTTestPage() {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  async function startRecording() {
    setError(null)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(stream)
    chunksRef.current = []
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    rec.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
    }
    rec.start()
    mediaRecorderRef.current = rec
    setRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  async function submitAudio(blob: Blob) {
    setIsSubmitting(true)
    setError(null)
    setTranscript('')
    try {
      const form = new FormData()
      const file = new File([blob], 'audio.webm', { type: 'audio/webm' })
      form.append('file', file)
      // Optional: language or model
      // form.append('language', 'en')
      // form.append('model', 'whisper-large-v3-turbo')

      const res = await fetch('/api/stt', { method: 'POST', body: form })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || `Failed with ${res.status}`)
      }
      const json = await res.json()
      setTranscript(json.text || JSON.stringify(json))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRecordToggle() {
    if (!recording) await startRecording()
    else stopRecording()
  }

  async function handleSend() {
    if (chunksRef.current.length === 0) return
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    await submitAudio(blob)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    await submitAudio(f)
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Speech to Text (Groq Whisper)</h1>
      <div className="flex gap-3 items-center">
        <button
          onClick={handleRecordToggle}
          className={`rounded px-4 py-2 text-white ${recording ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {recording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button
          onClick={handleSend}
          disabled={isSubmitting || chunksRef.current.length === 0}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Transcribing…' : 'Send Recording'}
        </button>
        <label className="ml-auto text-sm">or upload file
          <input type="file" accept="audio/*" onChange={handleFileChange} className="ml-2" />
        </label>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {transcript && (
        <div>
          <div className="text-sm font-medium mb-1">Transcript</div>
          <div className="rounded border p-3 whitespace-pre-wrap">{transcript}</div>
        </div>
      )}
    </div>
  )
}



