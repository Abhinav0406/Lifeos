'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabase, Folder, EnhancementResult } from '@/app/lib/supabase'
import { 
  History, 
  FolderPlus, 
  FolderOpen, 
  Trash2, 
  Clock, 
  Copy, 
  Check,
  Plus,
  Edit3,
  X
} from 'lucide-react'

interface Conversation {
  id: string
  title: string
  mode: string
  provider: string
  folder_id: string | null
  created_at: string
  updated_at: string
  folders?: {
    id: string
    name: string
    color: string
  }
}

interface SidebarProps {
  conversations: Conversation[]
  onLoadConversation: (conversationId: string) => void
  onDeleteConversation: (conversationId: string) => void
  onClearHistory: () => void
  onFolderSelect: (folderId: string | null) => void
  selectedFolderId: string | null
  onNewConversation: () => void
  incognitoMode: boolean
  onToggleIncognito: () => void
  onSidebarClose?: () => void
}

export function Sidebar({ conversations, onLoadConversation, onDeleteConversation, onClearHistory, onFolderSelect, selectedFolderId, onNewConversation, incognitoMode, onToggleIncognito, onSidebarClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const [folders, setFolders] = useState<Folder[]>([])
  const [showAddFolder, setShowAddFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3B82F6')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [editingFolder, setEditingFolder] = useState<string | null>(null)

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  useEffect(() => {
    if (user) {
      fetchFolders()
    }
  }, [user])


  const fetchFolders = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching folders:', error)
    } else {
      setFolders(data || [])
    }
  }

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return

    const { data, error } = await supabase
      .from('folders')
      .insert({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || null,
        color: newFolderColor,
        user_id: user.id,
      })
      .select()

    if (error) {
      console.error('Error creating folder:', error)
    } else {
      setFolders(prev => [...prev, data[0]])
      setNewFolderName('')
      setNewFolderDescription('')
      setNewFolderColor('#3B82F6')
      setShowAddFolder(false)
    }
  }

  const updateFolder = async (folderId: string, name: string, description: string, color: string) => {
    const { error } = await supabase
      .from('folders')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)

    if (error) {
      console.error('Error updating folder:', error)
    } else {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: name.trim(), description: description.trim() || undefined, color } : f))
      setEditingFolder(null)
    }
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? All prompts in this folder will be moved to "Unorganized".')) return

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (error) {
      console.error('Error deleting folder:', error)
    } else {
      setFolders(prev => prev.filter(f => f.id !== folderId))
      if (selectedFolderId === folderId) {
        onFolderSelect(null)
      }
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getCopyIcon = (field: string) => {
    return copiedField === field ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <Copy className="h-4 w-4" />
    )
  }

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Unknown time'
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return 'Invalid date'
    }
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || typeof text !== 'string') return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  if (!user) {
    return (
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <History className="h-12 w-12 mx-auto mb-2" />
          <p>Please sign in to view your history</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 lg:w-80 md:w-72 sm:w-full bg-gray-900 dark:bg-gray-900 h-full flex flex-col">
      {/* Header Section */}
      <div className="p-2 sm:p-3">
        {/* Close/Collapse Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => onSidebarClose?.()}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* New Chat Button */}
        <button
          onClick={() => {
            onNewConversation()
            onSidebarClose?.()
          }}
          className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 dark:bg-gray-800 text-white hover:bg-gray-700 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-xs sm:text-sm">New chat</span>
          </div>
          <span className="text-gray-400 text-xs hidden sm:block">Ctrl + Shift + O</span>
        </button>
        
        {/* Search Chats */}
        <button className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs sm:text-sm mt-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:block">Search chats</span>
          <span className="sm:hidden">Search</span>
        </button>
        
        {/* Library */}
        <button className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs sm:text-sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Library</span>
        </button>
        
        {/* PWA Install Button - For Testing */}
        <button 
          onClick={() => {
            // Trigger PWA install prompt manually
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(() => {
                // Show install prompt
                const event = new CustomEvent('beforeinstallprompt')
                window.dispatchEvent(event)
              })
            }
          }}
          className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs sm:text-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l9 5-9 5-9-5 9-5z" />
          </svg>
          <span className="hidden sm:block">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
        
        {/* Direct Message Toggle */}
        <button 
          onClick={onToggleIncognito}
          className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
            incognitoMode 
              ? 'bg-gray-800 text-white' 
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden sm:block">Direct message</span>
            <span className="sm:hidden">Direct</span>
          </div>
          <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
            incognitoMode 
              ? 'bg-blue-600 border-blue-600' 
              : 'border-gray-400'
          }`}>
            {incognitoMode && (
              <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>
        
        {/* Projects Section */}
        <div className="space-y-1">
          {/* All Prompts */}
          <button
            onClick={() => onFolderSelect(null)}
            className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm flex items-center space-x-2 sm:space-x-3 ${
              selectedFolderId === null 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
            <span className="hidden sm:block">All Prompts</span>
            <span className="sm:hidden">All</span>
          </button>

          {/* Folder List */}
          {folders.map((folder) => (
            <div key={folder.id} className="group">
              {editingFolder === folder.id ? (
                <div className="p-2 border border-gray-600 rounded-lg">
                  <input
                    type="text"
                    defaultValue={folder.name}
                    className="w-full text-sm bg-gray-800 text-white border-none outline-none mb-2 font-medium"
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        updateFolder(folder.id, e.target.value, folder.description || '', folder.color)
                      } else {
                        setEditingFolder(null)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.currentTarget.value.trim()) {
                          updateFolder(folder.id, e.currentTarget.value, folder.description || '', folder.color)
                        } else {
                          setEditingFolder(null)
                        }
                      } else if (e.key === 'Escape') {
                        setEditingFolder(null)
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex space-x-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateFolder(folder.id, folder.name, folder.description || '', color)}
                        className={`w-4 h-4 rounded-full border-2 ${
                          folder.color === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onFolderSelect(folder.id)}
                    className={`flex-1 text-left px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm flex items-center space-x-2 sm:space-x-3 ${
                      selectedFolderId === folder.id 
                        ? 'bg-gray-800 text-white' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-1 ml-2">
                    <button
                      onClick={() => setEditingFolder(folder.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteFolder(folder.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Project Button */}
          <button
            onClick={() => setShowAddFolder(true)}
            className="w-full text-left px-3 sm:px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-xs sm:text-sm flex items-center space-x-2 sm:space-x-3"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:block">Add project</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Add Folder Form */}
          {showAddFolder && (
            <div className="mt-2 p-2 border border-gray-600 rounded-lg">
              <input
                type="text"
                placeholder="Project name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full text-sm bg-gray-800 text-white border-none outline-none mb-2"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                className="w-full text-sm bg-gray-800 text-white border-none outline-none mb-2"
              />
              <div className="flex space-x-1 mb-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFolderColor(color)}
                    className={`w-4 h-4 rounded-full border-2 ${
                      newFolderColor === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={createFolder}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowAddFolder(false)
                    setNewFolderName('')
                    setNewFolderDescription('')
                    setNewFolderColor('#3B82F6')
                  }}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conversations Section */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2">
        <div className="mb-3">
          <h3 className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Recent</h3>
          
          {conversations.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">
                {selectedFolderId === null ? 'No conversations yet' : 'No conversations in this folder'}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Start a new conversation to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                  className="group px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => {
                    onLoadConversation(conversation.id)
                    onSidebarClose?.()
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-white truncate font-medium leading-tight">
                        {truncateText(conversation.title, window.innerWidth < 640 ? 25 : 45)}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conversation.id)
                        }}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-2 sm:p-3 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-xs sm:text-sm">
                {(user.user_metadata?.name || user.email?.split('@')[0])?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-xs sm:text-sm truncate">
                {user.user_metadata?.name || user.email?.split('@')[0]}
              </p>
              <p className="text-gray-400 text-xs">Free</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button className="px-2 sm:px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors hidden sm:block">
              Upgrade
            </button>
            <button
              onClick={() => signOut()}
              className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
              title="Sign out"
            >
              <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
