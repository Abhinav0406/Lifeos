'use client'

import { useState, useEffect } from 'react'
import { Send, RotateCcw, History, Copy, Check, HelpCircle, ArrowRight, Sparkles } from 'lucide-react'

interface EnhancementResult {
  originalPrompt: string
  enhancedPrompt: string
  aiResponse: string
  mode: string
  provider: string
  timestamp: string
}

interface Question {
  question: string
  answer: string
}

interface PromptEnhancerProps {
  onHistoryUpdate: (result: EnhancementResult) => void
  currentPrompt?: string
  onPromptChange?: (prompt: string) => void
  selectedFolderId?: string | null
}

export function PromptEnhancer({ onHistoryUpdate, currentPrompt, onPromptChange, selectedFolderId }: PromptEnhancerProps) {
  const [prompt, setPrompt] = useState(currentPrompt || '')
  const [mode, setMode] = useState('general')
  const [provider, setProvider] = useState('groq') // Default to Groq for better experience
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<EnhancementResult | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showQuestions, setShowQuestions] = useState(false)
  const [currentStep, setCurrentStep] = useState<'input' | 'questions' | 'result'>('input')

  // Update local prompt when currentPrompt prop changes
  useEffect(() => {
    if (currentPrompt !== undefined) {
      setPrompt(currentPrompt)
    }
  }, [currentPrompt])

  // Update parent component when prompt changes
  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt)
    if (onPromptChange) {
      onPromptChange(newPrompt)
    }
  }

  const modes = [
    { value: 'general', label: 'General' },
    { value: 'writing', label: 'Writing' },
    { value: 'coding', label: 'Coding' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'research', label: 'Research' }
  ]

  const providers = [
    { value: 'groq', label: 'Groq (Super Fast)' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'huggingface', label: 'Hugging Face' },
    { value: 'gemini', label: 'Google Gemini' }
  ]

  const handleGenerateQuestions = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/questions-temp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, mode, provider }),
      })

      if (!response.ok) {
        let serverMessage = 'Failed to generate questions'
        try {
          const errJson = await response.json()
          if (errJson?.error) serverMessage = String(errJson.error)
        } catch (_) {
          try {
            const errText = await response.text()
            if (errText) serverMessage = errText
          } catch (_) {
            // ignore secondary parsing errors
          }
        }
        throw new Error(serverMessage)
      }

      const data = await response.json()
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions.map((q: string) => ({ question: q, answer: '' })))
        setShowQuestions(true)
        setCurrentStep('questions')
      } else {
        // If no questions are generated, proceed directly to enhancement
        await handleEnhance(prompt, [])
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      alert('Failed to generate questions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index].answer = value
    setQuestions(newQuestions)
  }

  const handleEnhance = async (initialPrompt: string, answeredQuestions: Question[]) => {
    setIsLoading(true)
    try {
      const combinedPrompt = answeredQuestions.length > 0
        ? `${initialPrompt}\n\nAdditional context:\n${answeredQuestions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n')}`
        : initialPrompt

      const response = await fetch('/api/enhance-temp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: combinedPrompt, mode, provider, folderId: selectedFolderId, questionsAndAnswers: answeredQuestions }),
      })

      if (!response.ok) {
        let serverMessage = 'Failed to enhance prompt'
        try {
          const errJson = await response.json()
          if (errJson?.error) serverMessage = String(errJson.error)
        } catch (_) {
          try {
            const errText = await response.text()
            if (errText) serverMessage = errText
          } catch (_) {
            // ignore secondary parsing errors
          }
        }
        throw new Error(serverMessage)
      }

      const data = await response.json()
      setResult(data)
      onHistoryUpdate(data)
      setCurrentStep('result')
    } catch (error) {
      console.error('Error enhancing prompt:', error)
      alert('Failed to enhance prompt. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitAnswers = () => {
    handleEnhance(prompt, questions)
  }

  const handleImproveAgain = async () => {
    if (!result) return

    setPrompt(result.enhancedPrompt)
    await handleGenerateQuestions()
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

  const resetToStart = () => {
    setPrompt('')
    setQuestions([])
    setShowQuestions(false)
    setResult(null)
    setCurrentStep('input')
    if (onPromptChange) {
      onPromptChange('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${currentStep === 'input' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'input' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium">Input</span>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${currentStep === 'questions' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'questions' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium">Questions</span>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${currentStep === 'result' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'result' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium">Result</span>
        </div>
      </div>

      {/* Input Section */}
      {currentStep === 'input' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span>Enter Your Prompt</span>
              </h2>
              <div className="flex items-center space-x-3">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  {providers.map((providerOption) => (
                    <option key={providerOption.value} value={providerOption.value}>
                      {providerOption.label}
                    </option>
                  ))}
                </select>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  {modes.map((modeOption) => (
                    <option key={modeOption.value} value={modeOption.value}>
                      {modeOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Enter your rough prompt here... (e.g., 'write a story about a robot')"
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {prompt.length} characters
              </div>
              <button
                onClick={handleGenerateQuestions}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>{isLoading ? 'Generating Questions...' : 'Enhance Prompt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Section */}
      {currentStep === 'questions' && showQuestions && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Help Us Understand Better
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Answer these questions to help us create a more targeted and effective prompt for you.
            </p>
            
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {index + 1}. {q.question}
                  </label>
                  <textarea
                    value={q.answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Your answer..."
                    className="w-full h-20 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep('input')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Input
              </button>
              <button
                onClick={handleSubmitAnswers}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isLoading ? 'Enhancing...' : 'Enhance with Answers'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {currentStep === 'result' && result && (
        <div className="space-y-4">
          {/* Enhanced Prompt */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Enhanced Prompt
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {result.provider === 'openai' ? 'OpenAI' : 
                   result.provider === 'huggingface' ? 'Hugging Face' : 
                   result.provider === 'gemini' ? 'Google Gemini' : 'Groq'}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(result.enhancedPrompt, 'enhanced')}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {getCopyIcon('enhanced')}
                <span>Copy</span>
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {result.enhancedPrompt}
              </p>
            </div>
          </div>

          {/* AI Response */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Response
              </h3>
              <button
                onClick={() => copyToClipboard(result.aiResponse, 'response')}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {getCopyIcon('response')}
                <span>Copy</span>
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {result.aiResponse}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleImproveAgain}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Improve Again</span>
            </button>
            <button
              onClick={resetToStart}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <span>Start New</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
