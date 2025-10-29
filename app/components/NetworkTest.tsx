'use client'

import { useState, useEffect } from 'react'

export function NetworkTest() {
  const [logs, setLogs] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)])
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
          addLog('🎤 Started')
          setIsListening(true)
        }
        
        recognitionInstance.onresult = (event) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            addLog(`✅ Got transcript: "${finalTranscript}"`)
          }
        }
        
        recognitionInstance.onerror = (event) => {
          addLog(`❌ Error: ${event.error}`)
        }
        
        recognitionInstance.onend = () => {
          addLog('🔚 Ended')
          setIsListening(false)
          // Restart with delay
          setTimeout(() => {
            if (recognitionInstance) {
              try {
                recognitionInstance.start()
                addLog('🔄 Restarted')
              } catch (error) {
                addLog(`❌ Restart failed`)
              }
            }
          }, 1000)
        }
        
        setRecognition(recognitionInstance)
        addLog('✅ Initialized')
      }
    }
  }, [])

  const startTest = async () => {
    if (recognition) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        recognition.start()
        addLog('🚀 Started test')
      } catch (error) {
        addLog('❌ Permission denied')
      }
    }
  }

  const stopTest = () => {
    if (recognition) {
      recognition.stop()
      addLog('🛑 Stopped test')
    }
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🌐 Network Error Test</h1>
      
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={startTest}
            disabled={isListening}
            className={`px-4 py-2 rounded-lg ${
              isListening ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isListening ? '🎤 Listening...' : '▶️ Start Test'}
          </button>
          
          <button
            onClick={stopTest}
            disabled={!isListening}
            className={`px-4 py-2 rounded-lg ${
              !isListening ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            🛑 Stop Test
          </button>
        </div>
        
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-sm">
            <strong>Status:</strong> {isListening ? '🎤 Listening' : '🔇 Not Listening'}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Logs</h2>
        <div className="space-y-1 max-h-[300px] overflow-y-auto text-xs">
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

      <div className="mt-6 bg-blue-900 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">🧪 What to Look For:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Good:</strong> Should see "Started" and "Restarted" messages</li>
          <li><strong>Good:</strong> Should see "Got transcript" when you speak</li>
          <li><strong>Bad:</strong> Constant "Error: network" messages</li>
          <li><strong>Bad:</strong> Rapid restart loops</li>
        </ul>
      </div>
    </div>
  )
}


