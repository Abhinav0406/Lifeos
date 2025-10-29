'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void
  onSpeak: (text: string) => void
  isListening: boolean
  isSpeaking: boolean
  disabled?: boolean
  onListeningChange?: (listening: boolean) => void
  onSpeakingChange?: (speaking: boolean) => void
  onInterimTranscript?: (text: string) => void
}

export function VoiceInterface({ 
  onTranscript, 
  onSpeak, 
  isListening, 
  isSpeaking, 
  disabled = false,
  onListeningChange,
  onSpeakingChange,
  onInterimTranscript
}: VoiceInterfaceProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [userStopped, setUserStopped] = useState(false)
  const [restartTimeout, setRestartTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isListeningRef = useRef(false)

  useEffect(() => {
    // Check for browser support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const SpeechSynthesis = window.speechSynthesis
      
      if (SpeechRecognition && SpeechSynthesis) {
        setIsSupported(true)
        
        // Initialize Speech Recognition
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = 'en-US'
        recognitionInstance.maxAlternatives = 1
        
        // Add interim results handling
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
          
          // Log interim results for debugging
          if (interimTranscript) {
            console.log('Interim transcript:', interimTranscript)
            onInterimTranscript?.(interimTranscript)
          }
          
          if (finalTranscript) {
            console.log('Final transcript:', finalTranscript)
            onTranscript(finalTranscript)
          }
        }
        
        recognitionInstance.onstart = () => {
          console.log('Speech recognition started')
          isListeningRef.current = true
          onListeningChange?.(true)
        }
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          // Don't stop on recoverable errors
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            console.log('Recoverable error, will retry...')
            if (event.error === 'no-speech') {
              console.log('No speech detected - this is normal during silence')
            }
            return
          }
          // Handle network errors more carefully
          if (event.error === 'network') {
            console.log('Network error - will retry after delay...')
            // Don't immediately restart, wait a bit longer
            return
          }
          // Only stop on serious errors
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            console.error('Serious error, stopping:', event.error)
            onListeningChange?.(false)
            isListeningRef.current = false
          }
        }
        
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended')
          // Always restart if we're supposed to be listening and user didn't stop
          if (isListeningRef.current && !userStopped) {
            console.log('Auto-restarting speech recognition...')
            const timeout = setTimeout(() => {
              if (recognitionRef.current && isListeningRef.current && !userStopped) {
                try {
                  console.log('Attempting to restart...')
                  recognitionRef.current.start()
                } catch (error) {
                  console.error('Error restarting speech recognition:', error)
                  // Try again after a longer delay for network issues
                  setTimeout(() => {
                    if (recognitionRef.current && isListeningRef.current && !userStopped) {
                      try {
                        console.log('Retrying restart after delay...')
                        recognitionRef.current.start()
                      } catch (retryError) {
                        console.error('Retry failed:', retryError)
                        onListeningChange?.(false)
                        isListeningRef.current = false
                      }
                    }
                  }, 2000) // Longer delay for network issues
                }
              }
            }, 500) // Longer initial delay
            setRestartTimeout(timeout)
          } else {
            onListeningChange?.(false)
            isListeningRef.current = false
            setUserStopped(false)
          }
        }
        
        setRecognition(recognitionInstance)
        recognitionRef.current = recognitionInstance
        setSynthesis(SpeechSynthesis)
        setIsInitialized(true)
      }
    }
  }, [onTranscript, onListeningChange])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (restartTimeout) {
        clearTimeout(restartTimeout)
      }
    }
  }, [restartTimeout])

  // Add keyboard shortcut for toggling mic (Spacebar) - ignore when typing in inputs
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !disabled) {
        const target = event.target as HTMLElement | null
        const isTypingTarget = !!target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as HTMLElement).isContentEditable ||
          target.tagName === 'SELECT'
        )
        if (isTypingTarget) return
        event.preventDefault()
        if (isListeningRef.current) {
          stopListening()
        } else {
          startListening()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [disabled])

  const startListening = async () => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        // Check HTTPS requirement
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          alert('⚠️ Speech recognition requires HTTPS. Please access the site via HTTPS (not HTTP).')
          return
        }

        // Check browser support
        if (typeof window === 'undefined' || (!window.SpeechRecognition && !window.webkitSpeechRecognition)) {
          alert('❌ Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.')
          return
        }

        setUserStopped(false)
        isListeningRef.current = true
        
        // Clear any existing timeout
        if (restartTimeout) {
          clearTimeout(restartTimeout)
          setRestartTimeout(null)
        }
        
        // Request microphone permission first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert('❌ Your browser does not support microphone access.')
          isListeningRef.current = false
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((error) => {
          console.error('getUserMedia error:', error)
          isListeningRef.current = false
          
          if (error.name === 'NotAllowedError') {
            alert('⚠️ Microphone permission denied. Please allow microphone access in your browser settings.')
          } else if (error.name === 'NotFoundError') {
            alert('❌ No microphone found. Please connect a microphone.')
          } else if (error.name === 'NotSupportedError') {
            alert('❌ Your browser does not support audio recording.')
          } else {
            alert(`❌ Error accessing microphone: ${error.message || 'Unknown error'}`)
          }
          throw error
        })
        
        stream.getTracks().forEach(track => track.stop())
        
        recognitionRef.current.start()
        console.log('Started speech recognition')
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        isListeningRef.current = false
        onListeningChange?.(false)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      setUserStopped(true)
      isListeningRef.current = false
      
      // Clear any pending restart timeout
      if (restartTimeout) {
        clearTimeout(restartTimeout)
        setRestartTimeout(null)
      }
      
      recognitionRef.current.stop()
      console.log('Stopped speech recognition')
      onListeningChange?.(false)
    }
  }

  const speakText = (text: string) => {
    if (synthesis && !isSpeaking) {
      // Stop any ongoing speech
      synthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onstart = () => {
        console.log('Speech synthesis started')
        onSpeakingChange?.(true)
      }
      
      utterance.onend = () => {
        console.log('Speech synthesis ended')
        onSpeakingChange?.(false)
      }
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        onSpeakingChange?.(false)
      }
      
      synthesis.speak(utterance)
      synthesisRef.current = utterance
    }
  }

  const stopSpeaking = () => {
    if (synthesis && isSpeaking) {
      synthesis.cancel()
      console.log('Stopped speech synthesis')
      onSpeakingChange?.(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <VolumeX className="h-4 w-4" />
        <span>Voice features not supported in this browser</span>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Initializing voice features...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Speech Recognition Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || isSpeaking}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          } ${disabled || isSpeaking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isListening ? 'Stop listening (Space)' : 'Start listening (Space)'}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
        
        {isListening && (
          <div className="flex items-center space-x-1 text-red-500 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Continuous listening... Click mic or press Space to stop</span>
          </div>
        )}
      </div>

      {/* Speech Synthesis Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={isSpeaking ? stopSpeaking : () => speakText('Hello, this is a test of text-to-speech functionality.')}
          disabled={disabled || isListening}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isSpeaking
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          } ${disabled || isListening ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isSpeaking ? 'Stop speaking' : 'Test speech synthesis'}
        >
          {isSpeaking ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
        
        {isSpeaking && (
          <div className="flex items-center space-x-1 text-blue-500 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Speaking... Click speaker to stop</span>
          </div>
        )}
      </div>
    </div>
  )
}

