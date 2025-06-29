import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a mock client if environment variables are not set
let supabase: any

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Mock Supabase client for development without environment variables
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: any) => {
        // Call callback immediately with no session
        callback('SIGNED_OUT', null)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signUp: () => Promise.resolve({ error: { message: 'Please connect to Supabase first' } }),
      signInWithPassword: () => Promise.resolve({ error: { message: 'Please connect to Supabase first' } }),
      signOut: () => Promise.resolve({ error: null })
    }
  }
}

export { supabase }