'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AuthState = {
  session: import('@supabase/supabase-js').Session | null
  user: import('@supabase/supabase-js').User | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    // Initialize from current session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setLoading(false)
    })
    // Subscribe to auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      mounted = false
      subscription?.subscription.unsubscribe()
    }
  }, [])

  return { session, user: session?.user ?? null, loading }
}
