import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  description?: string
  color: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface EnhancementResult {
  id: string
  user_id: string
  folder_id?: string
  original_prompt: string
  enhanced_prompt: string
  ai_response: string
  mode: string
  provider: string
  questions_and_answers?: string // JSON string of Q&A
  created_at: string
  updated_at: string
}

export interface QuestionAnswer {
  question: string
  answer: string
}
