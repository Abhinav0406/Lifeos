'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Eye, EyeOff, Mail, Lock, User, Chrome } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      if (mode === 'signin') {
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password, name)
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        onClose()
        setEmail('')
        setPassword('')
        setName('')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/40 dark:border-gray-800">
        {/* Tabs/Header */}
        <div className="flex items-center">
          <button
            onClick={() => onModeChange('signin')}
            className={`relative flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'signin'
                ? 'bg-gray-200/60 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Login
            {mode === 'signin' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></span>}
          </button>
          <button
            onClick={() => onModeChange('signup')}
            className={`relative flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'signup'
                ? 'bg-gray-200/60 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Sign Up
            {mode === 'signup' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></span>}
          </button>
          <button
            onClick={onClose}
            className="px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left panel */}
          <div className="hidden md:block p-6">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Your Campus, Connected</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back! Enter your credentials to access your account.</p>
            <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span><span>Secure authentication</span></div>
              <div className="flex items-center space-x-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span><span>Access projects and history</span></div>
            </div>
          </div>

          {/* Right panel - form */}
          <div className="p-6 md:border-l md:border-gray-200/60 dark:md:border-gray-800">
            <h2 className="md:hidden text-xl font-semibold text-gray-900 dark:text-white mb-4">{mode === 'signin' ? 'Login' : 'Create account'}</h2>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@college.edu"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === 'signin' && (
              <div className="text-right mt-1">
                <button type="button" onClick={() => alert('Use your account email to reset your password.')} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Forgot password?</button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 px-4 rounded-md transition-colors font-semibold"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Login' : 'Create account'}
          </button>
        </form>

        <div className="mt-4">
          <div className="flex items-center justify-center mb-3">
            <div className="h-[1px] w-full bg-gray-300 dark:bg-gray-700" />
            <span className="px-2 text-xs text-gray-500 dark:text-gray-400">or</span>
            <div className="h-[1px] w-full bg-gray-300 dark:bg-gray-700" />
          </div>
          <button
            onClick={() => signInWithGoogle()}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-2.5 px-4 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center space-x-2"
          >
            <Chrome className="h-4 w-4" />
            <span>{mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {mode === 'signin' ? 'Don\'t have an account? Create one' : 'Already have an account? Login'}
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}



