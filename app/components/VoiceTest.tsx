'use client'

import { useState } from 'react'
import { VoiceInterface } from './VoiceInterface'

export function VoiceTest() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  const handleTranscript = (text: string) => {
    console.log('Transcript received:', text)
    setTranscript(text)
    setMessages(prev => [...prev, `You said: ${text}`])
  }

  const handleSpeak = (text: string) => {
    console.log('Speaking:', text)
    setMessages(prev => [...prev, `AI said: ${text}`])
  }

  const handleListeningChange = (listening: boolean) => {
    console.log('Listening changed:', listening)
    setIsListening(listening)
  }

  const handleSpeakingChange = (speaking: boolean) => {
    console.log('Speaking changed:', speaking)
    setIsSpeaking(speaking)
  }

  return (
    <div className="p-6 bg-gray-800 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Voice Test Component</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Voice Interface</h2>
        <div className="mb-2 text-sm text-gray-300">
          💡 <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Space</kbd> to toggle microphone on/off
        </div>
        <VoiceInterface
          onTranscript={handleTranscript}
          onSpeak={handleSpeak}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onListeningChange={handleListeningChange}
          onSpeakingChange={handleSpeakingChange}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Status</h2>
        <div className="space-y-2">
          <div className={`p-2 rounded ${isListening ? 'bg-red-500' : 'bg-gray-600'}`}>
            Listening: {isListening ? 'YES' : 'NO'}
          </div>
          <div className={`p-2 rounded ${isSpeaking ? 'bg-blue-500' : 'bg-gray-600'}`}>
            Speaking: {isSpeaking ? 'YES' : 'NO'}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Latest Transcript</h2>
        <div className="p-3 bg-gray-700 rounded">
          {transcript || 'No transcript yet...'}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className="p-2 bg-gray-700 rounded text-sm">
              {message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
