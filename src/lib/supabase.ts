import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://erolydqnccsrtonehnlb.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb2x5ZHFuY2NzcnRvbmVobmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTYzMTgsImV4cCI6MjA5Nzc3MjMxOH0.iFibFRFrs4H8ZVpAbdD3PBUozkVYDEDVbhwETo6mGBE'
)
