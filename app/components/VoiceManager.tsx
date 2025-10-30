'use client'

import { useState, useEffect } from 'react'
import { Mic, Phone, PhoneOff, Settings, User, Bot, Volume2 } from 'lucide-react'
import { VOICE_PERSONALITIES } from '@/app/lib/vapi-service'

interface VoiceManagerProps {
  onCallStart?: (assistantId: string) => void
  onCallEnd?: (callId: string) => void
  disabled?: boolean
}

export function VoiceManager({ onCallStart, onCallEnd, disabled = false }: VoiceManagerProps) {
  const [assistants, setAssistants] = useState<any[]>([])
  const [activeCall, setActiveCall] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useState('assistant')

  useEffect(() => {
    loadAssistants()
  }, [])

  const loadAssistants = async () => {
    try {
      const response = await fetch('/api/vapi/assistants')
      if (response.ok) {
        const data = await response.json()
        setAssistants(data.assistants || [])
      }
    } catch (error) {
      console.error('Error loading assistants:', error)
    }
  }

  const createAssistant = async () => {
    setIsLoading(true)
    try {
      const personalityConfig = VOICE_PERSONALITIES[selectedPersonality as keyof typeof VOICE_PERSONALITIES]
      
      const response = await fetch('/api/vapi/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${personalityConfig.name} Assistant`,
          personality: selectedPersonality,
          model: 'gpt-3.5-turbo'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAssistants(prev => [data.assistant, ...prev])
        setShowSettings(false)
      }
    } catch (error) {
      console.error('Error creating assistant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startCall = async (assistantId: string, type: 'phone' | 'web' = 'web') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vapi/assistants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId,
          type
        })
      })

      if (response.ok) {
        const data = await response.json()
        setActiveCall(data.call)
        onCallStart?.(assistantId)
      }
    } catch (error) {
      console.error('Error starting call:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const endCall = async () => {
    if (!activeCall) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/vapi/assistants?callId=${activeCall.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onCallEnd?.(activeCall.id)
        setActiveCall(null)
      }
    } catch (error) {
      console.error('Error ending call:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-800 border border-gray-600 dark:border-gray-600 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Volume2 className="h-5 w-5" />
          <span>Voice Assistants</span>
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-3 bg-gray-700 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Create New Assistant</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Personality</label>
              <select
                value={selectedPersonality}
                onChange={(e) => setSelectedPersonality(e.target.value)}
                className="w-full bg-gray-600 text-white text-sm rounded-md px-2 py-1 border border-gray-500"
              >
                {Object.entries(VOICE_PERSONALITIES).map(([key, config]) => (
                  <option key={key} value={key} className="bg-gray-600 text-white">
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={createAssistant}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Assistant'}
            </button>
          </div>
        </div>
      )}

      {/* Assistants List */}
      <div className="space-y-2">
        {assistants.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            No voice assistants created yet
          </div>
        ) : (
          assistants.map((assistant) => (
            <div
              key={assistant.id}
              className="flex items-center justify-between p-3 bg-gray-700 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{assistant.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{assistant.personality}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {activeCall?.assistant_id === assistant.id ? (
                  <button
                    onClick={endCall}
                    disabled={isLoading}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    title="End Call"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => startCall(assistant.vapi_assistant_id, 'web')}
                      disabled={disabled || isLoading || !!activeCall}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      title="Start Web Call"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => startCall(assistant.vapi_assistant_id, 'phone')}
                      disabled={disabled || isLoading || !!activeCall}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      title="Start Phone Call"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Active Call Status */}
      {activeCall && (
        <div className="mt-4 p-3 bg-green-900 dark:bg-green-900 border border-green-700 rounded-lg">
          <div className="flex items-center space-x-2 text-green-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Call Active</span>
          </div>
          <div className="text-xs text-green-200 mt-1">
            Call ID: {activeCall.id}
          </div>
        </div>
      )}
    </div>
  )
}




