import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner.jsx'
import { updateDisplayName } from '../services/authService.js'

export default function ProfileModal({ user, onClose, onLogout, onExport }) {
  const [name,      setName]      = useState(user?.displayName || '')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateDisplayName(name.trim())
      setSaved(true)
      setTimeout(onClose, 800)
    } catch {
      setSaveError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-2 flex flex-col items-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full"/>
        </div>
        <div className="px-5 pb-10">
          {/* Avatar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-[#06C755]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-[#06C755]">
                {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {user?.displayName || <span className="text-gray-400 italic">ยังไม่ได้ตั้งชื่อ</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                user?.role === 'admin' ? 'bg-purple-50 text-purple-500'
                : user?.role === 'qc'  ? 'bg-blue-50 text-blue-500'
                : user?.role === 'audit' ? 'bg-orange-50 text-orange-500'
                : 'bg-[#F0FDF4] text-[#16A34A]'
              }`}>
                {user?.role === 'admin' ? 'Admin'
                : user?.role === 'qc' ? 'QC'
                : user?.role === 'audit' ? 'Audit'
                : 'Staff'}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                ชื่อที่แสดง
              </label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-[#06C755] outline-none transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                ชื่อนี้จะปรากฏเป็นลายน้ำบนรูปที่ถ่าย
              </p>
            </div>
            {saveError && (
              <p className="text-xs text-red-500 text-center">{saveError}</p>
            )}
            <button
              type="submit"
              disabled={!name.trim() || saving || saved}
              className="w-full bg-gradient-to-r from-[#06C755] to-[#05B84C] text-white rounded-2xl py-3.5 font-semibold text-sm shadow-lg shadow-green-200 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saved ? '✓ บันทึกแล้ว' : saving ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner className="w-4 h-4" stroke="white"/>
                  กำลังบันทึก...
                </span>
              ) : 'บันทึก'}
            </button>

            {user?.role === 'admin' && onExport && (
              <button
                type="button"
                onClick={() => { onClose(); onExport() }}
                className="w-full flex items-center justify-center gap-2 bg-[#F0FDF4] text-[#16A34A] rounded-2xl py-3.5 text-sm font-semibold active:bg-[#DCFCE7] transition-colors"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export ข้อมูลสำหรับเทรน AI
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-sm text-red-400 py-2 mt-1 active:text-red-600 transition-colors"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
