'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, RotateCcw, Copy, Check, Sparkles, User, Bot, Image as ImageIcon, Mic } from 'lucide-react'
import { VoiceInterface } from './VoiceInterface'
import Link from 'next/link'

interface Question {
  question: string
  options: string[]
  type: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  isQuestion?: boolean
  question?: Question
  selectedAnswer?: string
  imageUrl?: string
  imageProvider?: string
  imageSize?: string
  isImageGeneration?: boolean
}

interface Folder {
  id: string
  name: string
  description: string | null
  color: string
  user_id: string
  created_at: string
  updated_at: string
}

interface ChatInterfaceProps {
  onEnhancementComplete: (result: any) => void
  provider: string
  mode: string
  selectedFolderId?: string | null
  currentConversationId?: string | null
  onConversationChange?: (conversationId: string | null) => void
  incognitoMode?: boolean
  folders?: Folder[]
  onFolderChange?: (folderId: string | null) => void
  onProviderChange?: (provider: string) => void
  onModeChange?: (mode: string) => void
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
}

export function ChatInterface({ onEnhancementComplete, provider, mode, selectedFolderId, currentConversationId, onConversationChange, incognitoMode = false, folders = [], onFolderChange, onProviderChange, onModeChange, onToggleSidebar, sidebarOpen = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [chatMode, setChatMode] = useState<'enhance' | 'direct'>('enhance')
  const [questionCount, setQuestionCount] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showTopControls, setShowTopControls] = useState(false)
  const [showBottomControls, setShowBottomControls] = useState(false)
  const [imageMode, setImageMode] = useState(false)
  const [imageProvider, setImageProvider] = useState<'dall-e-3' | 'dall-e-2' | 'stable-diffusion'>('dall-e-3')
  const [imageSize, setImageSize] = useState<'256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'>('1024x1024')
  
  // Sync chatMode with incognitoMode prop
  useEffect(() => {
    setChatMode(incognitoMode ? 'direct' : 'enhance')
  }, [incognitoMode])
  const [inputValue, setInputValue] = useState('')
  const sttBaseTextRef = useRef<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    const handleScroll = () => {
      const threshold = 80
      const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
      setIsAtBottom(distanceFromBottom <= threshold)
    }
    el.addEventListener('scroll', handleScroll)
    // Run once to init
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // Load conversation messages when conversationId changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId)
    } else {
      setMessages([])
      setCurrentQuestion(null)
      setQuestionCount(0) // Reset question count
    }
  }, [currentConversationId])

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.role as 'user' | 'bot' | 'system',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isQuestion: msg.is_question,
          question: msg.question_data,
          selectedAnswer: msg.selected_answer,
          imageUrl: msg.image_url,
          imageProvider: msg.image_provider,
          imageSize: msg.image_size,
          isImageGeneration: msg.is_image_generation
        }))
        setMessages(loadedMessages)
        
        // Set current question if the last message is a question
        const lastMessage = loadedMessages[loadedMessages.length - 1]
        if (lastMessage?.isQuestion && lastMessage.question) {
          setCurrentQuestion(lastMessage.question)
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const saveMessage = async (message: ChatMessage, conversationId: string) => {
    // Skip saving in incognito mode
    if (incognitoMode) return
    
    try {
      await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          role: message.type,
          content: message.content,
          isQuestion: message.isQuestion,
          questionData: message.question,
          selectedAnswer: message.selectedAnswer,
          imageUrl: message.imageUrl,
          imageProvider: message.imageProvider,
          imageSize: message.imageSize,
          isImageGeneration: message.isImageGeneration
        })
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const updateConversationFolder = async (conversationId: string, folderId: string | null) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          folderId
        })
      })
      
      if (response.ok) {
        console.log('Conversation folder updated successfully')
      }
    } catch (error) {
      console.error('Error updating conversation folder:', error)
    }
  }

  const handleFolderSelect = async (folderId: string | null) => {
    onFolderChange?.(folderId)
    if (currentConversationId) {
      await updateConversationFolder(currentConversationId, folderId)
    }
  }

  const createNewConversation = async (title: string) => {
    // Skip creating conversation in incognito mode
    if (incognitoMode) return null
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          folderId: selectedFolderId,
          mode,
          provider
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        onConversationChange?.(data.conversation.id)
        return data.conversation.id
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
    return null
  }

  const handleInitialPrompt = async (prompt: string) => {
    console.log('🚀 Starting new conversation with prompt:', prompt)
    setIsLoading(true)
    setQuestionCount(0) // Reset question count for new conversation
    
    // Create new conversation if we don't have one
    let conversationId = currentConversationId
    if (!conversationId) {
      conversationId = await createNewConversation(prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''))
      if (!conversationId) {
        setIsLoading(false)
        return
      }
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    await saveMessage(userMessage, conversationId)

    try {
      console.log('📝 Calling Questions API...')
      // Generate questions
      const response = await fetch('/api/questions-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, provider, folderId: selectedFolderId })
      })

      if (!response.ok) {
        throw new Error('Failed to generate questions')
      }

      const data = await response.json()
      
      if (data.questions && data.questions.length > 0) {
        // Add bot message with first question
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: "I'll help you create a better prompt! Let me ask you some questions:",
          timestamp: new Date(),
          isQuestion: true,
          question: data.questions[0]
        }
        
        setMessages(prev => [...prev, botMessage])
        await saveMessage(botMessage, conversationId)
        setCurrentQuestion(data.questions[0])
        setQuestionCount(1) // Set initial question count
      } else {
        // No questions generated, proceed directly to enhancement
        await handleEnhancement(prompt, [], conversationId)
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      // Fallback to direct enhancement
      await handleEnhancement(prompt, [], conversationId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelection = async (answer: string) => {
    if (!currentQuestion) return
    
    setIsLoading(true)
    
    // Add user answer message
    const answerMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: answer,
      timestamp: new Date(),
      selectedAnswer: answer
    }
    
    setMessages(prev => [...prev, answerMessage])
    
    // Update the question message with selected answer
    setMessages(prev => prev.map(msg => 
      msg.isQuestion && msg.question === currentQuestion 
        ? { ...msg, selectedAnswer: answer }
        : msg
    ))
    
    // Save the answer message
    if (currentConversationId) {
      await saveMessage(answerMessage, currentConversationId)
    }

    try {
      // Get all selected answers so far
      const selectedAnswers = messages
        .filter(msg => msg.selectedAnswer)
        .map(msg => msg.selectedAnswer!)
      
      selectedAnswers.push(answer)
      
      // Increment question count
      const newQuestionCount = questionCount + 1
      setQuestionCount(newQuestionCount)
      
      // Check if we've reached the maximum number of questions (5)
      if (newQuestionCount >= 5) {
        console.log('🎯 Reached maximum questions (5), proceeding to enhancement...')
        await handleEnhancement(messages[0]?.content || '', selectedAnswers, currentConversationId!)
        return
      }
      
      // Generate next question or proceed to enhancement
      const response = await fetch('/api/questions-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: messages[0]?.content || '', 
          mode, 
          provider, 
          folderId: selectedFolderId,
          previousAnswers: selectedAnswers
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate next question')
      }

      const data = await response.json()
      
      if (data.questions && data.questions.length > 0) {
        // Add next question
        const nextQuestionMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: "Great! Here's another question:",
          timestamp: new Date(),
          isQuestion: true,
          question: data.questions[0]
        }
        
        setMessages(prev => [...prev, nextQuestionMessage])
        await saveMessage(nextQuestionMessage, currentConversationId!)
        setCurrentQuestion(data.questions[0])
      } else {
        // No more questions, proceed to enhancement
        console.log('🎯 No more questions from API, proceeding to enhancement...')
        await handleEnhancement(messages[0]?.content || '', selectedAnswers, currentConversationId!)
      }
    } catch (error) {
      console.error('Error handling answer:', error)
      // Fallback to enhancement
      await handleEnhancement(messages[0]?.content || '', [answer], currentConversationId!)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnhancement = async (originalPrompt: string, answers: string[], conversationId: string) => {
    try {
      console.log('🎯 Proceeding to enhancement...')
      
      const response = await fetch('/api/enhance-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: originalPrompt, 
          mode, 
          provider, 
          folderId: selectedFolderId,
          questionsAndAnswers: answers,
          conversationHistory: messages.filter(msg => msg.type !== 'system') // Exclude system messages
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enhance prompt')
      }

      const data = await response.json()
      
      // Add enhanced prompt message
      const enhancedMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        type: 'bot',
        content: `**Enhanced Prompt:**\n\n${data.enhancedPrompt}\n\n**AI Response:**\n\n${data.aiResponse}`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, enhancedMessage])
      await saveMessage(enhancedMessage, conversationId)
      
      // Call completion callback
      onEnhancementComplete({
        originalPrompt,
        enhancedPrompt: data.enhancedPrompt,
        aiResponse: data.aiResponse,
        mode,
        provider,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Error in enhancement:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error during enhancement. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleDirectChat = async (prompt: string) => {
    console.log('💬 Direct chat mode')
    setIsLoading(true)
    
    // Create new conversation if we don't have one
    let conversationId = currentConversationId
    if (!conversationId) {
      conversationId = await createNewConversation(prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''))
      if (!conversationId) {
        setIsLoading(false)
        return
      }
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    await saveMessage(userMessage, conversationId)

    try {
      // Call enhance API directly without questions
      const response = await fetch('/api/enhance-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          mode, 
          provider,
          folderId: selectedFolderId,
          conversationHistory: messages.filter(msg => msg.type !== 'system') // Exclude system messages
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.aiResponse,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      await saveMessage(aiMessage, conversationId)
      
      // Call completion callback
      onEnhancementComplete({
        originalPrompt: prompt,
        enhancedPrompt: data.enhancedPrompt,
        aiResponse: data.aiResponse,
        mode,
        provider,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Error in direct chat:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(messageId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getCopyIcon = (messageId: string) => {
    return copiedField === messageId ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <Copy className="h-4 w-4" />
    )
  }

  const processMessageContent = (content: string) => {
    return content
      .replace(/^#{1,6}\s+(.*)$/gm, '**$1**') // Convert markdown headers to bold
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown but keep text
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/^\s*[-*]\s+/gm, '• ') // Convert bullet points to clean bullets
      .replace(/^\s*\d+\.\s+/gm, (match) => match.replace(/^\s*\d+\.\s+/, '')) // Remove numbered lists
  }

  const handleVoiceTranscript = (text: string) => {
    // Finalized chunk: append to the committed base and reflect in the input
    const clean = text.trim()
    if (!clean) return
    const prefix = sttBaseTextRef.current ? sttBaseTextRef.current + ' ' : ''
    sttBaseTextRef.current = (prefix + clean).trim()
    setInputValue(sttBaseTextRef.current)
  }

  const handleInterimTranscript = (text: string) => {
    // Interim transcript: show live in the input without committing
    const clean = text.trim()
    const prefix = sttBaseTextRef.current ? sttBaseTextRef.current + ' ' : ''
    setInputValue((prefix + clean).trim())
  }

  const handleVoiceSpeak = (text: string) => {
    console.log('Speaking:', text)
  }

  const handleListeningChange = (listening: boolean) => {
    setIsListening(listening)
    if (listening) {
      // Capture current content to preserve while dictating
      sttBaseTextRef.current = inputValue.trim()
    } else {
      // Stop interim overlay when mic stops
      setInputValue(sttBaseTextRef.current)
    }
  }

  const handleSpeakingChange = (speaking: boolean) => {
    console.log('Speaking state changed:', speaking)
    setIsSpeaking(speaking)
  }

  const handleImageGeneration = async (prompt: string) => {
    console.log('🎨 Generating image with prompt:', prompt)
    setIsLoading(true)
    
    // Create new conversation if we don't have one
    let conversationId = currentConversationId
    if (!conversationId) {
      conversationId = await createNewConversation(`Image: ${prompt.substring(0, 30)}...`)
      if (!conversationId) {
        setIsLoading(false)
        return
      }
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
      isImageGeneration: true
    }
    
    setMessages(prev => [...prev, userMessage])
    await saveMessage(userMessage, conversationId)
    
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          provider: imageProvider,
          size: imageSize,
          quality: imageProvider === 'dall-e-3' ? 'standard' : undefined,
          n: imageProvider === 'dall-e-2' ? 1 : undefined
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.message || 'Image generation failed')
      }
      
      const data = await response.json()
      
      // Add bot message with image
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.revisedPrompt || prompt,
        timestamp: new Date(),
        imageUrl: data.imageUrl,
        imageProvider: data.provider,
        imageSize: data.size,
        isImageGeneration: true
      }
      
      setMessages(prev => [...prev, botMessage])
      await saveMessage(botMessage, conversationId)
    } catch (error: any) {
      console.error('Image generation error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Error generating image: ${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 dark:bg-gray-800 font-sans">

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto" ref={messagesScrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            {/* Floating Hamburger Menu for Empty State */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="fixed top-4 left-4 z-50 p-2 bg-gray-800 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-lg border border-gray-600 dark:border-gray-600"
              >
                <svg className="w-5 h-5 text-gray-300 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h18M3 12h18M3 16h18" />
                  <rect x="3" y="4" width="6" height="16" fill="currentColor" opacity="0.1" />
                </svg>
              </button>
            )}
            
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
              Welcome to AI Assistant
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg text-center text-base leading-relaxed">
              Start a conversation to enhance your prompts or chat directly with AI
            </p>
            
            {/* Clean Integrated Controls */}
            <div className="w-full max-w-2xl px-4 sm:px-0">
              <div className="bg-gray-800 dark:bg-gray-800 border border-gray-600 dark:border-gray-600 rounded-xl shadow-lg">
                {/* Top Row - Provider and Mode Toggle */}
                {/* Toggle Button for Top Controls */}
                <div className="px-3 py-1 border-b border-gray-700 dark:border-gray-700">
                  <button
                    onClick={() => setShowTopControls(!showTopControls)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 text-xs transition-colors"
                  >
                    <span>{showTopControls ? '▼' : '▶'}</span>
                    <span>Settings</span>
                  </button>
                </div>
                
                {/* Provider/Mode/Folder - COLLAPSIBLE */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  showTopControls ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="flex items-center px-3 py-2 border-b border-gray-700 dark:border-gray-700 gap-2 overflow-x-auto whitespace-nowrap">
                    {/* Provider Selection */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={provider}
                        onChange={(e) => onProviderChange?.(e.target.value)}
                        className="bg-gray-800 text-gray-100 text-sm font-medium border border-gray-600 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <option value="groq" className="bg-gray-800 text-gray-100">⚡ Groq</option>
                        <option value="openai" className="bg-gray-800 text-gray-100">🧠 OpenAI</option>
                        <option value="huggingface" className="bg-gray-800 text-gray-100">🤗 Hugging Face</option>
                        <option value="gemini" className="bg-gray-800 text-gray-100">💎 Gemini</option>
                      </select>
                    </div>
                    
                    {/* Folder Selection */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedFolderId ?? ''}
                        onChange={(e) => handleFolderSelect(e.target.value ? e.target.value : null)}
                        className="bg-gray-800 text-gray-100 text-sm font-medium border border-gray-600 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors"
                        title="Save chat to project"
                      >
                        <option value="" className="bg-gray-800 text-gray-100">Unorganized</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id} className="bg-gray-800 text-gray-100">{f.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-gray-700 dark:bg-gray-700 rounded-md p-0.5 shrink-0">
                      <button
                        onClick={() => setChatMode('enhance')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                          chatMode === 'enhance'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        ✨ Enhance
                      </button>
                      <button
                        onClick={() => setChatMode('direct')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                          chatMode === 'direct'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        💬 Direct
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Input Area */}
                <div className="p-3">
                  <div className="flex items-center space-x-2">
                    {/* Mobile Mode Toggle - always visible on small screens */}
                    <div className="sm:hidden flex bg-gray-700 dark:bg-gray-700 rounded-md p-0.5">
                      <button
                        onClick={() => setChatMode('enhance')}
                        title="Enhance"
                        className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                          chatMode === 'enhance'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        ✨
                      </button>
                      <button
                        onClick={() => setChatMode('direct')}
                        title="Direct message"
                        className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                          chatMode === 'direct'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        💬
                      </button>
                    </div>
                    {/* Voice Chat Navigation Button */}
                    <Link
                      href="/voice-chat"
                      className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-all duration-200"
                      title="Voice Chat"
                    >
                      <Mic className="h-4 w-4" />
                    </Link>
                    
                    <div className="flex-1">
                      <textarea
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={chatMode === 'enhance' ? "Enter your prompt to enhance..." : "Message AI Assistant..."}
                        className="w-full bg-transparent text-gray-100 placeholder-gray-400 text-sm border-none outline-none resize-none min-h-[40px] max-h-48 leading-6"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (inputValue.trim()) {
                              if (chatMode === 'enhance') {
                                handleInitialPrompt(inputValue.trim())
                              } else {
                                handleDirectChat(inputValue.trim())
                              }
                              setInputValue('')
                            }
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (inputValue.trim()) {
                          if (chatMode === 'enhance') {
                            handleInitialPrompt(inputValue.trim())
                          } else {
                            handleDirectChat(inputValue.trim())
                          }
                          setInputValue('')
                        }
                      }}
                      className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!inputValue.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Voice Interface - COLLAPSIBLE */}
                  <div className={`transition-all duration-300 overflow-hidden ${
                    showBottomControls ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="mt-3 pt-3 border-t border-gray-700 dark:border-gray-700">
                      <VoiceInterface
                        onTranscript={handleVoiceTranscript}
                        onSpeak={handleVoiceSpeak}
                        onInterimTranscript={handleInterimTranscript}
                        isListening={isListening}
                        isSpeaking={isSpeaking}
                        disabled={isLoading}
                        onListeningChange={handleListeningChange}
                        onSpeakingChange={handleSpeakingChange}
                      />
                    </div>
                  </div>
                  
                  {/* Toggle Button for Bottom Controls */}
                  <div className="px-3 py-1">
                    <button
                      onClick={() => setShowBottomControls(!showBottomControls)}
                      className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 text-xs transition-colors"
                    >
                      <span>{showBottomControls ? '▼' : '▶'}</span>
                      <span>Voice Controls</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-96 sm:pb-96">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}
              >
                <div className={`flex space-x-2 sm:space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                      : 'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    ) : (
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl max-w-2xl shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gray-600 text-white'
                      : message.type === 'bot'
                        ? 'bg-transparent text-gray-100'
                        : 'bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
                  }`}>
                    {/* Image Display */}
                    {message.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={message.imageUrl} 
                          alt={message.content}
                          className="max-w-full rounded-lg shadow-md"
                          style={{ maxHeight: '512px', objectFit: 'contain' }}
                        />
                        {message.imageProvider && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Generated with {message.imageProvider} {message.imageSize && `(${message.imageSize})`}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                      {processMessageContent(message.content).split('**').map((part, index) => 
                        index % 2 === 1 ? (
                          <strong key={index} className="font-bold">{part}</strong>
                        ) : (
                          part
                        )
                      )}
                    </div>
                    
                    {/* Question Options */}
                    {message.isQuestion && message.question && (
                      <div className="mt-2 sm:mt-3 space-y-1.5">
                        {message.question.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelection(option)}
                            disabled={isLoading}
                            className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border transition-all duration-200 ${
                              message.selectedAnswer === option
                                ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                message.selectedAnswer === option
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300 dark:border-gray-500'
                              }`}>
                                {message.selectedAnswer === option && (
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-medium">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Copy Button for Enhanced Prompts */}
                    {message.content.includes('**') && (
                      <button
                        onClick={() => copyToClipboard(message.content.replace(/\*\*/g, '').replace(/\*(.*?)\*/g, '$1').replace(/^\s*[-*]\s+/gm, '• '), message.id)}
                        className="mt-4 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        {getCopyIcon(message.id)}
                        <span>Copy</span>
                      </button>
                    )}

                    {/* Interaction Buttons */}
                    {message.type === 'bot' && (
                      <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13v-9m-7 10h2M17 4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Input Field */}
      {messages.length > 0 && isAtBottom && (
        <div className={`fixed bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-3 sm:px-4 transition-opacity duration-300 ${
          sidebarOpen ? 'z-40 sm:z-50 opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto' : 'z-50 opacity-100'
        }`}>
          <div className="bg-gray-800 dark:bg-gray-800 border border-gray-600 dark:border-gray-600 rounded-xl shadow-lg">
            {/* Settings Toggle */}
            <div className="px-3 py-2 border-b border-gray-700 dark:border-gray-700">
              <button
                onClick={() => setShowTopControls(!showTopControls)}
                className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 text-xs transition-colors"
              >
                <span>{showTopControls ? '▼' : '▶'}</span>
                <span>Settings</span>
              </button>
            </div>

            {/* Collapsible Settings: Provider / Folder / Mode / Image */}
            <div className={`transition-all duration-300 overflow-hidden ${
              showTopControls ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="px-3 py-2 border-b border-gray-700 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <select
                      value={provider}
                      onChange={(e) => onProviderChange?.(e.target.value)}
                      className="bg-gray-800 text-gray-100 text-sm font-medium border border-gray-600 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <option value="groq" className="bg-gray-800 text-gray-100">⚡ Groq</option>
                      <option value="openai" className="bg-gray-800 text-gray-100">🧠 OpenAI</option>
                      <option value="huggingface" className="bg-gray-800 text-gray-100">🤗 Hugging Face</option>
                      <option value="gemini" className="bg-gray-800 text-gray-100">💎 Gemini</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedFolderId ?? ''}
                      onChange={(e) => handleFolderSelect(e.target.value ? e.target.value : null)}
                      className="bg-gray-800 text-gray-100 text-sm font-medium border border-gray-600 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors"
                      title="Save chat to project"
                    >
                      <option value="" className="bg-gray-800 text-gray-100">Unorganized</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id} className="bg-gray-800 text-gray-100">{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex bg-gray-700 dark:bg-gray-700 rounded-md p-0.5 shrink-0">
                    <button
                      onClick={() => setChatMode('enhance')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                        chatMode === 'enhance'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      ✨ Enhance
                    </button>
                    <button
                      onClick={() => setChatMode('direct')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                        chatMode === 'direct'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      💬 Direct
                    </button>
                  </div>
                </div>

                {/* Image Generation Settings */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-700">
                  <button
                    onClick={() => setImageMode(!imageMode)}
                    className={`flex items-center space-x-2 px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                      imageMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span>{imageMode ? '🎨 Image Mode' : 'Image'}</span>
                  </button>
                  
                  {imageMode && (
                    <>
                      <select
                        value={imageProvider}
                        onChange={(e) => {
                          const newProvider = e.target.value as any
                          setImageProvider(newProvider)
                          // Reset size to valid default for provider
                          if (newProvider === 'dall-e-3') {
                            setImageSize('1024x1024')
                          } else if (newProvider === 'dall-e-2') {
                            setImageSize('1024x1024')
                          }
                        }}
                        className="bg-gray-800 text-gray-100 text-xs font-medium border border-gray-600 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <option value="dall-e-3" className="bg-gray-800 text-gray-100">DALL-E 3</option>
                        <option value="dall-e-2" className="bg-gray-800 text-gray-100">DALL-E 2</option>
                        <option value="stable-diffusion" className="bg-gray-800 text-gray-100">Stability AI</option>
                      </select>
                      {(imageProvider === 'dall-e-3' || imageProvider === 'dall-e-2') && (
                        <select
                          value={imageSize}
                          onChange={(e) => setImageSize(e.target.value as any)}
                          className="bg-gray-800 text-gray-100 text-xs font-medium border border-gray-600 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                          {imageProvider === 'dall-e-3' ? (
                            <>
                              <option value="1024x1024" className="bg-gray-800 text-gray-100">1024×1024</option>
                              <option value="1792x1024" className="bg-gray-800 text-gray-100">1792×1024</option>
                              <option value="1024x1792" className="bg-gray-800 text-gray-100">1024×1792</option>
                            </>
                          ) : (
                            <>
                              <option value="256x256" className="bg-gray-800 text-gray-100">256×256</option>
                              <option value="512x512" className="bg-gray-800 text-gray-100">512×512</option>
                              <option value="1024x1024" className="bg-gray-800 text-gray-100">1024×1024</option>
                            </>
                          )}
                        </select>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Input Area */}
            <div className="p-3">
            <div className="flex items-center space-x-2">
              {/* Mobile Mode Toggle - always visible on small screens */}
              <div className="sm:hidden flex bg-gray-700 dark:bg-gray-700 rounded-md p-0.5">
                <button
                  onClick={() => setChatMode('enhance')}
                  title="Enhance"
                  className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                    chatMode === 'enhance'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  ✨
                </button>
                <button
                  onClick={() => setChatMode('direct')}
                  title="Direct message"
                  className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                    chatMode === 'direct'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  💬
                </button>
              </div>
                {/* Voice Chat Navigation Button */}
                <Link
                  href="/voice-chat"
                  className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-all duration-200"
                  title="Voice Chat"
                >
                  <Mic className="h-4 w-4" />
                </Link>
                
                <div className="flex-1">
                  <textarea
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      imageMode 
                        ? "Describe the image you want to generate..." 
                        : chatMode === 'enhance' 
                        ? "Enter your prompt to enhance..." 
                        : "Message AI Assistant..."
                    }
                    className="w-full bg-transparent text-gray-100 placeholder-gray-400 text-sm border-none outline-none resize-none min-h-[44px] max-h-48 leading-6"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (inputValue.trim()) {
                          if (imageMode) {
                            handleImageGeneration(inputValue.trim())
                          } else if (chatMode === 'enhance') {
                            handleInitialPrompt(inputValue.trim())
                          } else {
                            handleDirectChat(inputValue.trim())
                          }
                          setInputValue('')
                        }
                      }
                    }}
                  />
                </div>
                {imageMode ? (
                  <button
                    onClick={() => {
                      if (inputValue.trim()) {
                        handleImageGeneration(inputValue.trim())
                        setInputValue('')
                      }
                    }}
                    className="w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!inputValue.trim()}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (inputValue.trim()) {
                        if (chatMode === 'enhance') {
                          handleInitialPrompt(inputValue.trim())
                        } else {
                          handleDirectChat(inputValue.trim())
                        }
                        setInputValue('')
                      }
                    }}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!inputValue.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Voice Interface - COLLAPSIBLE */}
              <div className={`transition-all duration-300 overflow-hidden ${
                showBottomControls ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="mt-3 pt-3 border-t border-gray-700 dark:border-gray-700">
                  <VoiceInterface
                    onTranscript={handleVoiceTranscript}
                    onSpeak={handleVoiceSpeak}
                    onInterimTranscript={handleInterimTranscript}
                    isListening={isListening}
                    isSpeaking={isSpeaking}
                    disabled={isLoading}
                    onListeningChange={handleListeningChange}
                    onSpeakingChange={handleSpeakingChange}
                  />
                </div>
              </div>
              
              {/* Toggle Button for Bottom Controls */}
              <div className="px-3 py-1">
                <button
                  onClick={() => setShowBottomControls(!showBottomControls)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-gray-200 text-xs transition-colors"
                >
                  <span>{showBottomControls ? '▼' : '▶'}</span>
                  <span>Voice Controls</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}