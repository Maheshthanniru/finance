// Re-export from server module for API routes
// This ensures proper module loading in server contexts
export { getSupabaseClient, isSupabaseConfigured, supabase } from './supabase-server'

