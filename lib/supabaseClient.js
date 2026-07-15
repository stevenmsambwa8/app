import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lcukrzbznkcnhrjqyeuh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWtyemJ6bmtjbmhyanF5ZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzY2ODYsImV4cCI6MjA5OTYxMjY4Nn0.QMGqeZmcT3vbNoBDLF-uDvanBgYdabdCn61m0Zlq3Kw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
