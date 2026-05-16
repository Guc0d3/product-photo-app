import { useState, useEffect } from 'react'
import { fetchAllUsers, updateUserRole, createUserAccount, resetUserPassword } from '../services/userService.js'

/**
 * Controller hook for the User Management screen.
 * Fetches all users on mount and exposes a role-change handler
 * with optimistic updates.
 */
export function useUserManage(currentUid) {
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [updatingUid,    setUpdatingUid]    = useState(null)
  const [creating,       setCreating]       = useState(false)
  const [resettingEmail, setResettingEmail] = useState(null)

  // ── load users on mount ──────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchAllUsers()
      .then((data) => { setUsers(data); setLoading(false) })
      .catch((err) => { setError(err?.message ?? 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ'); setLoading(false) })
  }, [])

  // ── actions ──────────────────────────────────────────────────────────────

  /**
   * Change the role of a user.
   * Uses optimistic update: applies the change immediately, rolls back on error.
   */
  const handleRoleChange = async (uid, role) => {
    if (uid === currentUid) return           // can't change own role
    if (updatingUid) return                  // prevent concurrent saves

    // Capture previous state for rollback
    const previous = users.map(u => ({ ...u }))

    // Optimistic update
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
    setUpdatingUid(uid)

    try {
      await updateUserRole(uid, role)
    } catch (err) {
      // Rollback on failure
      setUsers(previous)
      throw err
    } finally {
      setUpdatingUid(null)
    }
  }

  /**
   * Create a new user account and refresh the user list on success.
   * Throws on failure so the calling View can display an error.
   */
  const handleCreateUser = async ({ email, displayName, role }) => {
    setCreating(true)
    try {
      await createUserAccount({ email, displayName, role })
      const data = await fetchAllUsers()
      setUsers(data)
    } finally {
      setCreating(false)
    }
  }

  /**
   * Send a password reset email to the given user's email address.
   * Throws on failure so the calling View can display an error.
   */
  const handleResetPassword = async (email) => {
    if (resettingEmail) return        // prevent concurrent sends
    setResettingEmail(email)
    try {
      await resetUserPassword(email)
    } finally {
      setResettingEmail(null)
    }
  }

  return {
    users,
    loading,
    error,
    updatingUid,
    handleRoleChange,
    creating,
    handleCreateUser,
    resettingEmail,
    handleResetPassword,
  }
}
