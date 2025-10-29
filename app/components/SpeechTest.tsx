'use client'

import { useState, useEffect } from 'react'

export function SpeechTest() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 19)])
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'en-US'
        
        recognitionInstance.onstart = () => {
          addLog('🎤 Speech recognition started')
          setIsListening(true)
        }
        
        recognitionInstance.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          if (interimTranscript) {
            addLog(`📝 Interim: "${interimTranscript}"`)
          }
          
          if (finalTranscript) {
            addLog(`✅ Final: "${finalTranscript}"`)
            setTranscript(finalTranscript)
          }
        }
        
        recognitionInstance.onerror = (event) => {
          addLog(`❌ Error: ${event.error}`)
          if (event.error === 'no-speech') {
            addLog('💭 No speech detected (normal during silence)')
          } else if (event.error === 'network') {
            addLog('🌐 Network error - will retry after delay')
          }
        }
        
        recognitionInstance.onend = () => {
          addLog('🔚 Speech recognition ended')
          setIsListening(false)
          // Auto-restart with longer delay for network issues
          setTimeout(() => {
            if (recognitionInstance) {
              try {
                recognitionInstance.start()
                addLog('🔄 Auto-restarted')
              } catch (error) {
                addLog(`❌ Restart failed: ${error}`)
              }
            }
          }, 1000) // Longer delay
        }
        
        setRecognition(recognitionInstance)
        addLog('✅ Speech recognition initialized')
      } else {
        addLog('❌ Speech recognition not supported')
      }
    }
  }, [])

  const startListening = async () => {
    if (recognition) {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        
        recognition.start()
        addLog('🚀 Started listening')
      } catch (error) {
        addLog(`❌ Permission denied: ${error}`)
      }
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
      addLog('🛑 Stopped listening')
    }
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🎤 Speech Recognition Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Controls</h2>
          <div className="space-y-3">
            <button
              onClick={startListening}
              disabled={isListening}
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                isListening 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isListening ? '🎤 Listening...' : '▶️ Start Listening'}
            </button>
            
            <button
              onClick={stopListening}
              disabled={!isListening}
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                !isListening 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              🛑 Stop Listening
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="text-sm">
              <div className="mb-2">
                <strong>Status:</strong> {isListening ? '🎤 Listening' : '🔇 Not Listening'}
              </div>
              <div>
                <strong>Latest Transcript:</strong>
                <div className="mt-1 p-2 bg-gray-600 rounded text-xs">
                  {transcript || 'No transcript yet...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Debug Logs</h2>
          <div className="space-y-1 max-h-[400px] overflow-y-auto text-xs">
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
          <li>Click "Start Listening" and allow microphone permission</li>
          <li>Speak clearly into your microphone</li>
          <li>Watch for "Interim" and "Final" transcript logs</li>
          <li>If you see transcripts, speech recognition is working</li>
          <li>If no transcripts appear, check microphone permissions</li>
        </ol>
      </div>
    </div>
  )
}
