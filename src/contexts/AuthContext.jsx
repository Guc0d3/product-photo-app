import { createContext, useContext, useState, useEffect } from 'react'
import { subscribeAuthState } from '../services/authService.js'

const AuthContext = createContext(null)

/**
 * Provides `user` (profile from Firestore) and `loading` to the whole app.
 * user = null  → not logged in
 * user = {...} → logged in, profile loaded
 * loading = true → waiting for Firebase to resolve initial auth state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading

  useEffect(() => {
    const unsubscribe = subscribeAuthState(setUser)
    return () => unsubscribe()
  }, [])

  const loading = user === undefined

  return (
    <AuthContext.Provider value={{ user: user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}
