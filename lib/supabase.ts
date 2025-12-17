import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co')
}

// Create Supabase client
export const supabase: SupabaseClient = (() => {
  try {
    if (isSupabaseConfigured()) {
      return createClient(supabaseUrl!, supabaseAnonKey!)
    } else {
      if (typeof window === 'undefined') {
        console.warn(
          '⚠️  Missing Supabase environment variables.\n' +
          'Please create a .env.local file in the project root with:\n' +
          'NEXT_PUBLIC_SUPABASE_URL=your_project_url\n' +
          'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n' +
          'See SUPABASE_SETUP.md for instructions.'
        )
      }
      // Return placeholder client
      return createClient(
        'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGFjZWhvbGRlciIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24ifQ.placeholder'
      )
    }
  } catch (error) {
    console.error('Error initializing Supabase client:', error)
    // Return placeholder client as fallback
    return createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGFjZWhvbGRlciIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24ifQ.placeholder'
    )
  }
})()

