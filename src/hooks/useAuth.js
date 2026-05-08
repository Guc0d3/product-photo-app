import { useState } from 'react'
import { signIn, logOut } from '../services/authService.js'

/**
 * Controller hook for login/logout actions.
 * Auth state itself lives in AuthContext — this hook only handles actions.
 */
export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      // onAuthStateChanged in AuthContext will update user automatically
    } catch (err) {
      setError(mapFirebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logOut()
    } catch {
      // silent — worst case: page reload will clear state
    }
  }

  return { handleLogin, handleLogout, loading, error }
}

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
      return 'invalidCredential'   // key → translated in component
    case 'auth/too-many-requests':
      return 'tooManyRequests'
    case 'auth/network-request-failed':
      return 'networkError'
    default:
      return 'unknownError'
  }
}
