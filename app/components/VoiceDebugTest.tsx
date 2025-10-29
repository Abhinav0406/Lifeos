'use client'

import { useState, useEffect } from 'react'
import { VoiceInterface } from './VoiceInterface'

export function VoiceDebugTest() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)])
  }

  const handleTranscript = (text: string) => {
    addLog(`Transcript: "${text}"`)
    setTranscript(text)
  }

  const handleSpeak = (text: string) => {
    addLog(`Speaking: "${text}"`)
  }

  const handleListeningChange = (listening: boolean) => {
    addLog(`Listening state: ${listening ? 'ON' : 'OFF'}`)
    setIsListening(listening)
  }

  const handleSpeakingChange = (speaking: boolean) => {
    addLog(`Speaking state: ${speaking ? 'ON' : 'OFF'}`)
    setIsSpeaking(speaking)
  }

  // Monitor for automatic stops
  useEffect(() => {
    if (isListening) {
      addLog('Microphone started - monitoring for auto-stops...')
    }
  }, [isListening])

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🔧 Voice Debug Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Interface */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Voice Interface</h2>
          <div className="mb-2 text-sm text-gray-300">
            💡 <strong>Test:</strong> Click mic and wait to see if it auto-stops
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

        {/* Status */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Status</h2>
          <div className="space-y-2">
            <div className={`p-3 rounded-lg ${isListening ? 'bg-red-500' : 'bg-gray-600'}`}>
              <div className="font-medium">Microphone: {isListening ? '🎤 LISTENING' : '🔇 OFF'}</div>
              <div className="text-sm opacity-75">
                {isListening ? 'Should stay on until you stop it' : 'Ready to start'}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${isSpeaking ? 'bg-blue-500' : 'bg-gray-600'}`}>
              <div className="font-medium">Speaker: {isSpeaking ? '🔊 SPEAKING' : '🔇 OFF'}</div>
            </div>
          </div>
        </div>

        {/* Latest Transcript */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Latest Transcript</h2>
          <div className="p-3 bg-gray-700 rounded-lg min-h-[100px]">
            {transcript || 'No transcript yet...'}
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Debug Logs</h2>
          <div className="space-y-1 max-h-[200px] overflow-y-auto text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-400">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="p-2 bg-gray-700 rounded text-xs font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-900 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">🧪 Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click the microphone button to start listening</li>
          <li>Wait 10-30 seconds without speaking</li>
          <li>Check if the microphone stays ON (red) or turns OFF automatically</li>
          <li>If it turns OFF automatically, that's the bug we're fixing</li>
          <li>If it stays ON, the fix is working!</li>
        </ol>
      </div>
    </div>
  )
}


