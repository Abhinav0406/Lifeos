import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper function to get user from request with better error handling
export async function getUser() {
  try {
    const supabase = createClient()
    
    // First try to get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      // Don't log auth errors as they're expected when no user is signed in
      // Only log if it's not a session missing error
      if (userError.message !== 'Auth session missing!') {
        console.error('Supabase auth error:', userError)
      }
      
      // If there's an auth error, try to refresh the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        // Don't log session errors as they're expected when no user is signed in
        if (sessionError.message !== 'Auth session missing!') {
          console.error('Session refresh error:', sessionError)
        }
        return { user: null, error: userError }
      }
      
      // If session refresh worked, try getting user again
      if (session) {
        const { data: { user: refreshedUser }, error: refreshedError } = await supabase.auth.getUser()
        if (refreshedError) {
          return { user: null, error: refreshedError }
        }
        return { user: refreshedUser, error: null }
      }
      
      return { user: null, error: userError }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('Error getting user:', error)
    return { user: null, error }
  }
}

// Helper function to get session with better error handling
export async function getSession() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase session error:', error)
      // Return null session instead of throwing error
      return { session: null, error: null }
    }
    
    return { session, error: null }
  } catch (error) {
    console.error('Error getting session:', error)
    // Return null session instead of throwing error
    return { session: null, error: null }
  }
}