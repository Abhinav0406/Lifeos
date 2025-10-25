'use client'

import { useState, useEffect } from 'react'
import { History, Trash2, Clock, Copy, Check } from 'lucide-react'

interface EnhancementResult {
  originalPrompt: string
  enhancedPrompt: string
  aiResponse: string
  mode: string
  provider: string
  timestamp: string
}

interface HistoryPanelProps {
  history: EnhancementResult[]
  onClearHistory: () => void
  onLoadPrompt: (prompt: string) => void
}

export function HistoryPanel({ history, onClearHistory, onLoadPrompt }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
    return new Date(timestamp).toLocaleString()
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className="relative">
      {/* History Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <History className="h-5 w-5" />
        <span>History</span>
        {history.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {history.length}
          </span>
        )}
      </button>

      {/* History Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Prompt History
              </h3>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="flex items-center space-x-1 px-2 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-4">
            {history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No history yet. Start enhancing prompts to see them here!
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimestamp(item.timestamp)}</span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                          {item.mode}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                          {item.provider === 'openai' ? 'OpenAI' : 
                           item.provider === 'huggingface' ? 'HF' : 
                           item.provider === 'gemini' ? 'Gemini' : 'Groq'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Original:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {truncateText(item.originalPrompt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Enhanced:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {truncateText(item.enhancedPrompt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => onLoadPrompt(item.originalPrompt)}
                        className="flex-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                      >
                        Load Original
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.enhancedPrompt, `enhanced-${index}`)}
                        className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        {getCopyIcon(`enhanced-${index}`)}
                        <span>Copy Enhanced</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
