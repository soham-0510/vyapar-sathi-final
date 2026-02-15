import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qftqlcwrhvnqhiwwmjgp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHFsY3dyaHZucWhpd3dtamdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTY4MjIsImV4cCI6MjA4NjY3MjgyMn0.8DQ21q5wtaTZ9GLCMn-vGwox8XHpYts84RkS8ddHneE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
