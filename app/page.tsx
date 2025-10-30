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
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authShowPassword, setAuthShowPassword] = useState(false)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [provider, setProvider] = useState('groq')
  const [mode, setMode] = useState('general')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [incognitoMode, setIncognitoMode] = useState(false)

  // Load conversations and folders from API when user changes
  useEffect(() => {
    if (user) {
      // Restore last conversation from localStorage
      try {
        const key = `lastConversationId:${user.id}`
        const saved = localStorage.getItem(key)
        if (saved) {
          setCurrentConversationId(saved)
        }
      } catch {}
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

        // Auto-select a conversation if none is selected
        if (!currentConversationId) {
          const stored = localStorage.getItem(`lastConversationId:${user.id}`)
          if (!stored && data.conversations && data.conversations.length > 0) {
            const mostRecentId = data.conversations[0].id
            setCurrentConversationId(mostRecentId)
            try {
              localStorage.setItem(`lastConversationId:${user.id}`, mostRecentId)
            } catch {}
          } else if (!stored && (!data.conversations || data.conversations.length === 0)) {
            // No conversations exist yet; create an initial one
            await createInitialConversation()
          }
        }
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

  const createInitialConversation = async () => {
    try {
      // Respect incognito mode: do not create persistent conversations
      if (incognitoMode || !user) return
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New chat',
          folderId: selectedFolderId,
          mode,
          provider
        })
      })
      if (response.ok) {
        const data = await response.json()
        const newId = data.conversation.id
        setCurrentConversationId(newId)
        try {
          localStorage.setItem(`lastConversationId:${user.id}`, newId)
        } catch {}
        // also reflect in list immediately
        setConversations(prev => [data.conversation, ...prev])
      }
    } catch (e) {
      console.error('Failed to create initial conversation:', e)
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
    if (user) {
      try {
        localStorage.setItem(`lastConversationId:${user.id}`, conversationId)
      } catch {}
    }
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
    <div className="min-h-screen relative transition-colors font-sans bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gray-900">
      {/* Soft background gradient for visual depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-30">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl bg-indigo-300/50 dark:bg-indigo-500/10"></div>
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full blur-3xl bg-pink-300/40 dark:bg-purple-500/10"></div>
      </div>
      {!user ? (
        // New landing for non-authenticated users
        <div className="min-h-screen flex items-center justify-center px-5 sm:px-8">
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* Left: Hero */}
            <div className="flex flex-col justify-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 w-max text-xs mb-4 shadow-sm ring-1 ring-fuchsia-600/10">New! Prompt Enhancement</span>
              <h1 className="text-3xl leading-snug md:text-4xl md:leading-tight font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
                PromptPolish
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Your Prompts, Elevated</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-6 max-w-xl">
                Enhance prompts with AI, organize by projects, and chat directly when you need quick answers.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-purple-200/60 dark:border-gray-700 rounded-lg p-3 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Real‑time Chat</p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Instant answers with direct mode</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-purple-200/60 dark:border-gray-700 rounded-lg p-3 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Study Groups</p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Organize prompts by projects</p>
                </div>
              </div>
            </div>

            {/* Right: Auth card (triggers modal) */}
            <div className="bg-white/85 dark:bg-gray-800/80 backdrop-blur border border-purple-200/60 dark:border-gray-700 rounded-2xl shadow-xl p-5 sm:p-6">
              {/* Tabs */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-5">
                <button
                  onClick={() => setAuthMode('signin')}
                  className={`relative flex-1 py-2.5 text-sm font-semibold ${authMode === 'signin' ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Login
                  {authMode === 'signin' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></span>}
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`relative flex-1 py-2.5 text-sm font-semibold ${authMode === 'signup' ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Sign Up
                  {authMode === 'signup' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></span>}
                </button>
              </div>

              {/* Error */}
              {authError && (
                <div className="mb-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {authError}
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setAuthSubmitting(true)
                  setAuthError('')
                  try {
                    if (authMode === 'signin') {
                      const { error } = await signIn(authEmail, authPassword)
                      if (error) setAuthError(error.message || 'Failed to login')
                    } else {
                      const { error } = await signUp(authEmail, authPassword, authName)
                      if (error) setAuthError(error.message || 'Failed to create account')
                    }
                  } finally {
                    setAuthSubmitting(false)
                  }
                }}
                className="space-y-3"
              >
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                      className="w-full rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="your.email@college.edu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={authShowPassword ? 'text' : 'password'}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Your password"
                    />
                    <button type="button" onClick={() => setAuthShowPassword(v => !v)} className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">{authShowPassword ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md disabled:opacity-60"
                >
                  {authSubmitting ? 'Please wait...' : authMode === 'signin' ? 'Login' : 'Create account'}
                </button>
              </form>

              {/* Google */}
              <div className="mt-4">
                <button
                  onClick={() => signInWithGoogle()}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-2.5 px-4 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Continue with Google
                </button>
              </div>

              <p className="mt-3 text-[11px] text-gray-400 text-center">By continuing you agree to our Terms and Privacy Policy</p>
            </div>
          </div>
        </div>
      ) : (
        // Main app for authenticated users
        <div className="flex h-screen bg-gray-800 dark:bg-gray-800">
          {/* Collapsible Sidebar */}
          <div className={`transition-all duration-300 ${
            sidebarCollapsed 
              ? 'w-0 hidden' 
              : 'w-80 block sm:relative sm:z-auto fixed inset-0 z-[70] sm:static'
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
            {/* Floating Hamburger Menu - show when sidebar is collapsed */}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="fixed top-3 left-3 z-50 p-2 bg-gray-800 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-lg border border-gray-600 dark:border-gray-600"
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
                sidebarOpen={!sidebarCollapsed}
              />
            </main>
          </div>
        </div>
      )}

      {/* Auth Modal intentionally not used; inline form provided */}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}
