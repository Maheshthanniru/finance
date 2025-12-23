// Server-only Supabase client - lazy initialization to avoid module loading issues
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co')
}

// Lazy initialization - only import when needed
let supabaseInstance: any = null
let createClientFn: any = null

function initializeSupabase() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    // Lazy require to avoid top-level import issues
    if (!createClientFn) {
      const supabaseModule = require('@supabase/supabase-js')
      createClientFn = supabaseModule.createClient
    }

    if (isSupabaseConfigured()) {
      supabaseInstance = createClientFn(supabaseUrl!, supabaseAnonKey!)
      return supabaseInstance
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
      supabaseInstance = createClientFn(
        'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGFjZWhvbGRlciIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24ifQ.placeholder'
      )
      return supabaseInstance
    }
  } catch (error) {
    console.error('Error initializing Supabase client:', error)
    // Return placeholder client as fallback
    if (!createClientFn) {
      const supabaseModule = require('@supabase/supabase-js')
      createClientFn = supabaseModule.createClient
    }
    supabaseInstance = createClientFn(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGFjZWhvbGRlciIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24ifQ.placeholder'
    )
    return supabaseInstance
  }
}

export function getSupabaseClient() {
  return initializeSupabase()
}

// Export proxy for backward compatibility
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    const client = initializeSupabase()
    const value = client[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

