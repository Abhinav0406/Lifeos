'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { ThemeToggle } from './components/ThemeToggle'
import { AuthModal } from './components/AuthModal'
import { ChatInterface } from './components/ChatInterface'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { useAuth } from './components/AuthProvider'
import { EnhancementResult } from '@/app/lib/supabase'

export default function Home() {
  const { user, loading } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [provider, setProvider] = useState('groq')
  const [mode, setMode] = useState('general')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [incognitoMode, setIncognitoMode] = useState(false)

  // Load conversations and folders from API when user changes
  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchFolders()
    } else {
      setConversations([])
      setFolders([])
    }
  }, [user])

  // Load conversations when folder changes
  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [selectedFolderId])

  const fetchHistory = async () => {
    if (!user) return

    try {
      const params = new URLSearchParams()
      if (selectedFolderId) {
        params.append('folderId', selectedFolderId)
      }
      params.append('limit', '50')

      const response = await fetch(`/api/history?${params}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.results || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleHistoryUpdate = async () => {
    // Refresh conversations when a new one is created
    await fetchConversations()
  }

  const fetchConversations = async () => {
    if (!user) return
    
    try {
      const url = selectedFolderId 
        ? `/api/conversations?folderId=${selectedFolderId}`
        : '/api/conversations'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        // If API fails, set empty conversations to allow app to work
        console.error('Failed to fetch conversations, using empty array')
        setConversations([])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      // Set empty conversations to allow app to work
      setConversations([])
    }
  }

  const fetchFolders = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/folders')
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      } else {
        console.error('Failed to fetch folders, using empty array')
        setFolders([])
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
      setFolders([])
    }
  }

  const handleLoadConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove from local state
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
        
        // If this was the current conversation, clear it
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null)
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const handleClearHistory = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' })
      })

      if (response.ok) {
        setConversations([])
        setCurrentConversationId(null)
      }
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }

  const handleLoadPrompt = (prompt: string) => {
    setCurrentPrompt(prompt)
  }

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId)
  }

  const handleFolderChange = (folderId: string | null) => {
    setSelectedFolderId(folderId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors font-sans">
      {!user ? (
        // Landing page for non-authenticated users
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
            {/* Hero Section */}
            <div className="mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-gray-600 dark:text-gray-300 font-semibold text-lg sm:text-xl">P</span>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
              PromptPolish
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed">
              Transform your prompts with interactive AI enhancement. Ask smarter questions, get better results.
            </p>
            
            {/* Action Buttons */}
            <div className="space-y-2 mb-6 sm:mb-8">
              <button
                onClick={() => {
                  setAuthMode('signin')
                  setShowAuthModal(true)
                }}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 sm:py-2 px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup')
                  setShowAuthModal(true)
                }}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-2.5 sm:py-2 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
              >
                Create Account
              </button>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Interactive Chat</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Engage with AI through smart questioning and multiple choice options</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Smart Organization</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Organize prompts in folders and track your enhancement history</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Multiple AI Providers</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Choose from Groq, OpenAI, Gemini, and Hugging Face models</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">Context-Aware</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">AI understands your specific needs through targeted questions</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Main app for authenticated users
        <div className="flex h-screen bg-gray-800 dark:bg-gray-800">
          {/* Collapsible Sidebar */}
          <div className={`transition-all duration-300 ${
            sidebarCollapsed 
              ? 'w-0 hidden sm:w-80 sm:block' 
              : 'w-full sm:w-80 lg:w-80 block'
          } bg-gray-900 dark:bg-gray-900 border-r border-gray-700 dark:border-gray-700 overflow-hidden`}>
            <Sidebar
              conversations={conversations}
              onLoadConversation={handleLoadConversation}
              onDeleteConversation={handleDeleteConversation}
              onClearHistory={handleClearHistory}
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolderId}
              onNewConversation={() => {
                setCurrentPrompt('')
                setCurrentConversationId(null)
                // Clear any existing conversation state
                setConversations([])
              }}
              incognitoMode={incognitoMode}
              onToggleIncognito={() => setIncognitoMode(!incognitoMode)}
              onSidebarClose={() => setSidebarCollapsed(true)}
            />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-800 dark:bg-gray-800">
            {/* Floating Hamburger Menu - Only show on mobile when sidebar is collapsed */}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="fixed top-3 left-3 z-50 p-2 bg-gray-800 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-lg border border-gray-600 dark:border-gray-600 sm:hidden"
              >
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h18M3 12h18M3 16h18" />
                </svg>
              </button>
            )}

            {/* Chat Interface */}
            <main className="flex-1 overflow-hidden bg-gray-800 dark:bg-gray-800">
              <ChatInterface 
                onEnhancementComplete={handleHistoryUpdate}
                provider={provider}
                mode={mode}
                selectedFolderId={selectedFolderId}
                currentConversationId={currentConversationId}
                onConversationChange={setCurrentConversationId}
                incognitoMode={incognitoMode}
                folders={folders}
                onFolderChange={handleFolderChange}
                onProviderChange={setProvider}
                onModeChange={setMode}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </main>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
