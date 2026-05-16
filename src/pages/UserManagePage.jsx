import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import { useUserManage } from '../hooks/useUserManage.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const ROLES = ['staff', 'qc', 'audit', 'admin']

// ── CreateUserModal ───────────────────────────────────────────────────────────

function CreateUserModal({ onClose, onCreate, creating, t }) {
  const [email,       setEmail]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role,        setRole]        = useState('staff')
  const [formError,   setFormError]   = useState(null)
  const [success,     setSuccess]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!email.trim()) { setFormError(t.createUserEmail + ' is required'); return }
    if (!displayName.trim()) { setFormError(t.createUserName + ' is required'); return }

    try {
      await onCreate({ email: email.trim(), displayName: displayName.trim(), role })
      setSuccess(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      const code = err?.code ?? err?.details?.code ?? ''
      if (code === 'already-exists' || err?.message?.includes('already-exists')) {
        setFormError(t.createUserErrorExists)
      } else {
        setFormError(t.createUserErrorGeneric)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{t.createUserTitle}</h2>
          <button
            onClick={onClose}
            disabled={creating}
            className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">{t.createUserEmail}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={creating || success}
              placeholder="example@company.com"
              className="w-full rounded-xl border border-gray-200 bg-[#F5F7FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all disabled:opacity-50"
              autoComplete="off"
            />
          </div>

          {/* Display name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">{t.createUserName}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={creating || success}
              placeholder={t.createUserName}
              className="w-full rounded-xl border border-gray-200 bg-[#F5F7FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all disabled:opacity-50"
              autoComplete="off"
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">{t.createUserRole}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={creating || success}
              className="w-full rounded-xl border border-gray-200 bg-[#F5F7FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all disabled:opacity-50 cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t[`role${r.charAt(0).toUpperCase()}${r.slice(1)}`] ?? r}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2" className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <p className="text-red-600 text-xs">{formError}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-[#06C755]/30 rounded-xl px-3 py-2">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#06C755" strokeWidth="2.5" className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              <p className="text-[#06C755] text-xs font-medium">{t.createUserSuccess}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={creating || success}
            className="mt-1 w-full flex items-center justify-center gap-2 bg-[#06C755] text-white font-semibold rounded-xl py-2.5 text-sm active:opacity-80 transition-all disabled:opacity-50"
          >
            {creating && <LoadingSpinner className="w-4 h-4 text-white"/>}
            {t.createUserSubmit}
          </button>
        </form>
      </div>
    </div>
  )
}

const ROLE_BADGE_STYLES = {
  staff: 'bg-gray-100 text-gray-600',
  qc:    'bg-blue-100 text-blue-700',
  audit: 'bg-purple-100 text-purple-700',
  admin: 'bg-[#06C755]/10 text-[#06C755]',
}

function RoleBadge({ role, t }) {
  const label = t[`role${role.charAt(0).toUpperCase()}${role.slice(1)}`] ?? role
  const style  = ROLE_BADGE_STYLES[role] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}

function formatThaiDate(value) {
  if (!value) return ''
  const date = value?.toDate ? value.toDate() : new Date(value)
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function UserManagePage({ user, onBack }) {
  const { t } = useLang()
  const { users, loading, error, updatingUid, handleRoleChange, creating, handleCreateUser, resettingEmail, handleResetPassword } = useUserManage(user?.uid)
  const [roleError,    setRoleError]    = useState(null)
  const [showCreate,   setShowCreate]   = useState(false)
  const [sentEmails,   setSentEmails]   = useState(new Set())
  const [resetError,   setResetError]   = useState(null)

  const onResetPassword = async (email) => {
    setResetError(null)
    try {
      await handleResetPassword(email)
      setSentEmails(prev => new Set([...prev, email]))
      setTimeout(() => setSentEmails(prev => { const s = new Set(prev); s.delete(email); return s }), 3000)
    } catch {
      setResetError(t.resetPasswordError)
    }
  }

  const onRoleChange = async (uid, role) => {
    setRoleError(null)
    try {
      await handleRoleChange(uid, role)
    } catch {
      setRoleError(t.userManageUpdateError)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden">
      {/* Create User Modal */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateUser}
          creating={creating}
          t={t}
        />
      )}

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Back"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
              {t.userManageTitle}
            </h1>
            {!loading && !error && (
              <p className="text-xs text-gray-400 mt-0.5">
                {t.userManageSubtitle(users.length)}
              </p>
            )}
          </div>
          {/* Add user button */}
          <button
            onClick={() => setShowCreate(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#06C755] text-white shadow-sm active:opacity-80 transition-all"
            aria-label="Add user"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pt-3 pb-6">
        {/* Error banner (load error) */}
        {error && (
          <div className="mx-3 mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2" className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p className="text-red-600 text-xs">{t.userManageError}</p>
          </div>
        )}

        {/* Reset password error banner */}
        {resetError && (
          <div className="mx-3 mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2" className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p className="text-red-600 text-xs">{resetError}</p>
          </div>
        )}

        {/* Role update error banner */}
        {roleError && (
          <div className="mx-3 mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2" className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p className="text-red-600 text-xs">{roleError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner className="w-7 h-7 text-[#06C755]"/>
          </div>
        ) : !error && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p className="mt-3 text-sm text-gray-400">{t.userManageEmpty}</p>
          </div>
        ) : (
          !error && users.map((u) => {
            const isSelf      = u.uid === user?.uid
            const isSaving    = updatingUid === u.uid
            const isResetting = resettingEmail === u.email
            const isSent      = sentEmails.has(u.email)
            const initials    = (u.displayName || u.email || '?').charAt(0).toUpperCase()

            return (
              <div
                key={u.uid}
                className="mx-3 mb-2.5 bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-3"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#06C755]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#06C755]">{initials}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {u.displayName || '—'}
                    </span>
                    {isSelf && (
                      <span className="text-xs text-gray-400">{t.userManageSelf}</span>
                    )}
                    <RoleBadge role={u.role ?? 'staff'} t={t}/>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                  {u.createdAt && (
                    <p className="text-xs text-gray-300 mt-0.5">{formatThaiDate(u.createdAt)}</p>
                  )}
                </div>

                {/* Reset password button */}
                {isResetting ? (
                  <LoadingSpinner className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                ) : isSent ? (
                  <span className="text-xs text-[#06C755] font-medium flex-shrink-0 flex items-center gap-1">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    {t.resetPasswordSent}
                  </span>
                ) : (
                  <button
                    onClick={() => onResetPassword(u.email)}
                    disabled={!!resettingEmail}
                    title={t.resetPassword}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-90 transition-all flex-shrink-0 disabled:opacity-40"
                  >
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 010 5.657M11 7H7a4 4 0 000 8h4m0-8v8"/>
                    </svg>
                  </button>
                )}

                {/* Role selector / spinner */}
                {isSaving ? (
                  <LoadingSpinner className="w-5 h-5 text-[#06C755] flex-shrink-0"/>
                ) : (
                  <select
                    value={u.role ?? 'staff'}
                    disabled={isSelf || !!updatingUid}
                    onChange={(e) => onRoleChange(u.uid, e.target.value)}
                    className={`text-xs font-medium rounded-xl px-2.5 py-1.5 border border-gray-200 bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all flex-shrink-0 ${
                      isSelf || updatingUid ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t[`role${r.charAt(0).toUpperCase()}${r.slice(1)}`] ?? r}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
