import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  return { session: data.session, user: data.user, error }
}

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  return { session: data.session, user: data.user, error }
}

export const signOutCurrentUser = async () => {
  const result = await supabase.auth.signOut()

  if (!result.error) {
    return result
  }

  // Fall back to clearing the local session so the current browser signs out
  // even if the global revoke call is temporarily blocked.
  return supabase.auth.signOut({ scope: 'local' })
}

export const subscribeToAuthChanges = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}
