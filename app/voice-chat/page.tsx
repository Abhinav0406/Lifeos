'use client'

import { useEffect, useRef, useState } from 'react'
import { VoiceInterface } from '@/app/components/VoiceInterface'

type ChatMessage = { role: 'user' | 'assistant' | 'system', content: string }

export default function VoiceChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful voice assistant.' },
  ])
  const [recording, setRecording] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [voice, setVoice] = useState('Atlas-PlayAI')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      // Cleanup audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  async function startRecording() {
    try {
      // Check if running on HTTPS (required for microphone access)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert('⚠️ Microphone access requires HTTPS. Please access the site via HTTPS (not HTTP).')
        throw new Error('HTTPS required for microphone access')
      }

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('❌ Your browser does not support microphone access. Please use Chrome, Edge, or Safari.')
        throw new Error('MediaDevices API not supported')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((error) => {
        console.error('getUserMedia error:', error)
        if (error.name === 'NotAllowedError') {
          alert('⚠️ Microphone permission denied. Please allow microphone access in your browser settings and try again.')
        } else if (error.name === 'NotFoundError') {
          alert('❌ No microphone found. Please connect a microphone and try again.')
        } else if (error.name === 'NotSupportedError') {
          alert('❌ Your browser does not support audio recording.')
        } else {
          alert(`❌ Error accessing microphone: ${error.message}`)
        }
        throw error
      })
      
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => { stream.getTracks().forEach(t => t.stop()) }
      rec.start()
      mediaRecorderRef.current = rec
      setRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      setRecording(false)
    }
  }

  function stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const rec = mediaRecorderRef.current
      if (!rec) {
        setRecording(false)
        return reject(new Error('Recorder not active'))
      }

      // When recorder fully stops, create blob from collected chunks
      rec.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          // stop input tracks
          const stream = (rec as any).stream as MediaStream | undefined
          stream?.getTracks().forEach(t => t.stop())
          chunksRef.current = []
          if (blob.size === 0) return reject(new Error('Empty recording'))
          resolve(blob)
        } catch (e) {
          reject(e as Error)
        } finally {
          setRecording(false)
        }
      }

      try {
        // Flush any buffered data, then stop
        if (rec.state !== 'inactive') {
          // Some browsers emit final dataavailable after stop
          rec.requestData?.()
          rec.stop()
        } else {
          reject(new Error('Recorder already stopped'))
        }
      } catch (e) {
        reject(e as Error)
      }
    })
  }

  async function runTurn(audioBlob: Blob) {
    // 1) STT
    const sttForm = new FormData()
    sttForm.append('file', new File([audioBlob], 'speech.webm', { type: 'audio/webm' }))
    const sttRes = await fetch('/api/stt', { method: 'POST', body: sttForm })
    if (!sttRes.ok) throw new Error(await sttRes.text())
    const sttJson = await sttRes.json()
    const userText = (sttJson.text as string) || ''

    setMessages((prev) => [...prev, { role: 'user', content: userText }])

    // 2) LLM
    setIsThinking(true)
    const chatRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, { role: 'user', content: userText }] }),
    })
    setIsThinking(false)
    if (!chatRes.ok) throw new Error(await chatRes.text())
    const chatJson = await chatRes.json()
    const replyText: string = chatJson.reply || 'I could not generate a reply.'
    setMessages((prev) => [...prev, { role: 'assistant', content: replyText }])

    // 3) TTS
    setIsSpeaking(true)
    try {
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText, voice, format: 'mp3' }),
      })
      if (!ttsRes.ok) {
        const errorText = await ttsRes.text()
        console.error('TTS API error:', errorText)
        
        // Parse Groq error for terms acceptance
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.details) {
            const details = JSON.parse(errorJson.details)
            if (details.error?.code === 'model_terms_required') {
              const message = details.error.message || 'Model terms acceptance required'
              throw new Error(`${message}\n\nPlease visit: https://console.groq.com/playground?model=playai-tts to accept the terms.`)
            }
          }
        } catch {}
        
        throw new Error(`TTS failed: ${errorText}`)
      }
      const audioBlobReply = await ttsRes.blob()
      
      // Cleanup old audio if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      const url = URL.createObjectURL(audioBlobReply)
      audioUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsSpeaking(false)
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        audioRef.current = null
      }
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        setIsSpeaking(false)
        alert('Failed to play audio. Check console for details.')
      }
      
      await audio.play().catch((err) => {
        console.error('Audio play failed:', err)
        setIsSpeaking(false)
        alert('Browser blocked audio playback. Please interact with the page first (click anywhere) and try again.')
      })
    } catch (error) {
      console.error('TTS error:', error)
      setIsSpeaking(false)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`TTS failed: ${errorMessage}`)
    }
  }

  // Enable voice UI to drive text-based turns without recording upload
  async function runTextTurn(userText: string) {
    if (!userText) return
    setMessages((prev) => [...prev, { role: 'user', content: userText }])

    // LLM
    setIsThinking(true)
    const chatRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, { role: 'user', content: userText }] }),
    })
    setIsThinking(false)
    if (!chatRes.ok) throw new Error(await chatRes.text())
    const chatJson = await chatRes.json()
    const replyText: string = chatJson.reply || 'I could not generate a reply.'
    setMessages((prev) => [...prev, { role: 'assistant', content: replyText }])

    // TTS
    setIsSpeaking(true)
    try {
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText, voice, format: 'mp3' }),
      })
      if (!ttsRes.ok) {
        const errorText = await ttsRes.text()
        console.error('TTS API error:', errorText)
        
        // Parse Groq error for terms acceptance
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.details) {
            const details = JSON.parse(errorJson.details)
            if (details.error?.code === 'model_terms_required') {
              const message = details.error.message || 'Model terms acceptance required'
              throw new Error(`${message}\n\nPlease visit: https://console.groq.com/playground?model=playai-tts to accept the terms.`)
            }
          }
        } catch {}
        
        throw new Error(`TTS failed: ${errorText}`)
      }
      const audioBlobReply = await ttsRes.blob()
      
      // Cleanup old audio if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      const url = URL.createObjectURL(audioBlobReply)
      audioUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsSpeaking(false)
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        audioRef.current = null
      }
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        setIsSpeaking(false)
        alert('Failed to play audio. Check console for details.')
      }
      
      await audio.play().catch((err) => {
        console.error('Audio play failed:', err)
        setIsSpeaking(false)
        alert('Browser blocked audio playback. Please interact with the page first (click anywhere) and try again.')
      })
    } catch (error) {
      console.error('TTS error:', error)
      setIsSpeaking(false)
      alert(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handlePushToTalk() {
    if (!recording) await startRecording()
    else {
      let blob: Blob
      try {
        blob = await stopRecording()
      } catch (e) {
        console.error(e)
        alert('Recording was empty. Please speak for a moment before stopping.')
        return
      }
      setIsThinking(true)
      try {
        await runTurn(blob)
      } catch (e) {
        console.error(e)
        alert('Voice chat failed. Check console and server logs.')
      } finally {
        setIsThinking(false)
      }
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-white text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100">
      {/* Conversation area */}
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {messages.filter(m => m.role !== 'system').map((m, idx) => {
            const isAssistant = m.role === 'assistant'
            return (
              <div key={idx} className={`flex items-start gap-3 ${isAssistant ? '' : 'justify-end'}`}>
                {/* Avatar */}
                {isAssistant && (
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                )}
                {/* Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    isAssistant
                      ? 'bg-gray-100 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 border border-gray-200 dark:border-slate-800'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {m.content}
                </div>
                {!isAssistant && (
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gray-300 dark:bg-slate-700" />
                )}
              </div>
            )
          })}
          {isThinking && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 bg-gray-100 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 border border-gray-200 dark:border-slate-800">
                Assistant is thinking…
              </div>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 animate-pulse" />
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 bg-gray-100 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 border border-gray-200 dark:border-slate-800">
                🔊 Speaking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 w-full border-t border-gray-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-[#0b0f19]/80">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="rounded-2xl border border-gray-300 bg-white dark:border-slate-700 dark:bg-[#0f172a]">
            <div className="flex items-end gap-2 p-2">
              <textarea
                rows={1}
                placeholder="Send a message…"
                className="min-h-[44px] max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    const text = (e.currentTarget.value || '').trim()
                    if (text) {
                      e.currentTarget.value = ''
                      await runTextTurn(text).catch(console.error)
                    }
                  }
                }}
              />

              {/* Voice mic inline, ChatGPT-style right side */}
              <div className="flex items-center gap-2 px-1">
                <VoiceInterface
                  onTranscript={(text) => { runTextTurn(text).catch(console.error) }}
                  onSpeak={() => {}}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onListeningChange={(v) => setIsListening(v)}
                  onSpeakingChange={(v) => setIsSpeaking(v)}
                />

                <button
                  onClick={handlePushToTalk}
                  className={`h-10 rounded-xl px-4 text-sm font-medium text-white ${recording ? 'bg-red-600' : 'bg-emerald-600'}`}
                  title={recording ? 'Stop recording and send' : 'Record and send'}
                >
                  {recording ? 'Stop' : 'Record'}
                </button>
              </div>
            </div>

            {/* Secondary row: voice selection */}
            <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <div className="opacity-80">Voice</div>
              <select
                className="w-56 rounded-md border border-gray-300 bg-white p-1.5 text-sm dark:border-slate-700 dark:bg-[#0b1225] dark:text-slate-100"
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
          </div>
        </div>
      </div>
    </div>
  )
}


