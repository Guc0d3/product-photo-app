import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import { useQueueList } from '../hooks/useQueueList.js'
import { updateDisplayName } from '../services/authService.js'

// ── utilities ─────────────────────────────────────────────────────────────────

function parseCode(code) {
  const m = code?.match(/^RI(\d{4})(\d{2})(\d{2})-(\d+)$/)
  if (!m) return { date: '', seq: code ?? '' }
  return { date: `${m[3]}-${m[2]}-${m[1]}`, seq: m[4] }
}

function getTodayPrefix() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `RI${y}${m}${d}`
}

function timeAgo(date, t) {
  if (!date) return t.justNow
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t.justNow
  if (mins < 60) return t.minutesAgo(mins)
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t.hoursAgo(hours)
  const days = Math.floor(hours / 24)
  if (days === 1) return t.yesterday
  return t.daysAgo(days)
}

const QUEUE_ALLOWED = /^[0-9.,\-+]*$/

// ── ProfileModal ──────────────────────────────────────────────────────────────

function ProfileModal({ user, onClose, onLogout }) {
  const { t } = useLang()
  const [name,   setName]   = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateDisplayName(name.trim())
      setSaved(true)
      setTimeout(onClose, 800)
    } catch (err) {
      console.error('updateDisplayName:', err)
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
            <button
              type="submit"
              disabled={!name.trim() || saving || saved}
              className="w-full bg-gradient-to-r from-[#06C755] to-[#05B84C] text-white rounded-2xl py-3.5 font-semibold text-sm shadow-lg shadow-green-200 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saved ? '✓ บันทึกแล้ว' : saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30 70"/>
                  </svg>
                  กำลังบันทึก...
                </span>
              ) : 'บันทึก'}
            </button>

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

// ── NewQueueModal ─────────────────────────────────────────────────────────────

function NewQueueModal({ onClose, onCreate }) {
  const { t } = useLang()
  const [queueNum, setQueueNum]   = useState('')
  const [supplier, setSupplier]   = useState('')
  const [note, setNote]           = useState('')
  const [queueError, setQueueError] = useState('')
  const [saving, setSaving]       = useState(false)

  const handleQueueChange = (val) => {
    if (val === '' || QUEUE_ALLOWED.test(val)) { setQueueNum(val); setQueueError('') }
    else setQueueError(t.queueInvalid)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!queueNum.trim()) { setQueueError(t.queueRequired); return }
    setSaving(true)
    try {
      await onCreate({ queueNumber: queueNum, supplier, note })
      onClose()
    } catch (err) {
      const key = err.message === 'duplicateQueueNumber' ? 'duplicateQueueNumber' : 'createError'
      setQueueError(t[key] ?? t.createError)
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-2 flex flex-col items-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full"/>
        </div>
        <div className="px-5 pb-8">
          {/* Code preview */}
          <div className="mb-5 bg-[#F0FDF4] border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#06C755]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#06C755" strokeWidth="2">
                <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{t.autoCode}</p>
              <p className="text-base font-bold text-[#06C755] font-mono tracking-wide">
                {getTodayPrefix()}-<span className="opacity-40">???</span>
              </p>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-4">{t.newQueueTitle}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                {t.queueLabel} <span className="text-red-400">*</span>
                <span className="ml-1 text-gray-300 font-normal normal-case tracking-normal">{t.queueHint}</span>
              </label>
              <input autoFocus value={queueNum} onChange={e => handleQueueChange(e.target.value)}
                placeholder={t.queuePlaceholder} inputMode="numeric"
                className={`w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm ring-1 focus:ring-2 focus:ring-[#06C755] outline-none transition-all ${queueError ? 'ring-red-300' : 'ring-gray-200'}`}
              />
              {queueError && <p className="text-xs text-red-500 mt-1.5">{queueError}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{t.supplierLabel}</label>
              <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder={t.supplierPlaceholder}
                className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-[#06C755] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{t.noteLabel}</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t.notePlaceholder} rows={2}
                className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-[#06C755] outline-none transition-all resize-none"
              />
            </div>
            <button type="submit" disabled={saving}
              className="w-full bg-gradient-to-r from-[#06C755] to-[#05B84C] text-white rounded-2xl py-3.5 font-semibold text-sm mt-1 shadow-lg shadow-green-200 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30 70"/>
                  </svg>
                  {t.creating ?? t.createQueue}
                </span>
              ) : t.createQueue}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── QueueItem ─────────────────────────────────────────────────────────────────

function QueueItem({ queue, onSelect, onTogglePin }) {
  const { t } = useLang()
  const { date, seq } = parseCode(queue.code)

  return (
    <div className="relative group mx-4 mb-2.5">
      <button
        onClick={() => onSelect(queue)}
        className="w-full bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:shadow-[0_1px_4px_rgba(0,0,0,0.08)] active:scale-[0.99] transition-all text-left overflow-hidden"
      >
        {queue.pinned && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#06C755] rounded-l-2xl"/>
        )}

        <div className="flex items-start gap-3 px-4 py-3.5 pr-12">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
            queue.pinned ? 'bg-[#06C755]' : queue.status === 'open' ? 'bg-[#F0FDF4]' : 'bg-gray-50'
          }`}>
            {queue.pinned ? (
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={queue.status === 'open' ? '#06C755' : '#9CA3AF'} strokeWidth="1.8">
                <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Row 1: date · receipt no + time ago */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">
                {date}
                <span className="mx-1 text-gray-200">·</span>
                <span className="font-medium text-gray-500">{t.receiptNo} {seq}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {queue.hasUntagged && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"/>}
                <span className="text-[11px] text-gray-400">{timeAgo(queue.lastMediaAt, t)}</span>
              </div>
            </div>

            {/* Row 2: queue number */}
            {queue.queueNumber && (
              <p className="text-[15px] font-semibold text-gray-900 mt-1 leading-tight">
                {t.queueLabel} {queue.queueNumber}
              </p>
            )}

            {/* Row 3: supplier */}
            {queue.supplier && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{queue.supplier}</p>
            )}

            {/* Row 4: badges */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                queue.status === 'open'      ? 'bg-[#DCFCE7] text-[#16A34A]' :
                queue.status === 'cancelled' ? 'bg-red-50 text-red-400' :
                                               'bg-gray-100 text-gray-400'
              }`}>
                {queue.status === 'open'      ? t.statusOpen :
                 queue.status === 'cancelled' ? t.statusCancelled :
                                                t.statusClosed}
              </span>
              {queue.photoCount > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                  {queue.photoCount}
                </span>
              )}
              {queue.videoCount > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  {queue.videoCount}
                </span>
              )}
              {queue.note && (
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full truncate max-w-[90px]">
                  {queue.note}
                </span>
              )}
              {queue.pinned && (
                <span className="text-[11px] font-semibold text-[#06C755]">{t.pinned}</span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Pin button */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(queue.id, queue.pinned) }}
        className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
          queue.pinned
            ? 'bg-[#06C755]/10'
            : 'bg-gray-50 opacity-0 group-hover:opacity-100 group-active:opacity-100'
        }`}
        aria-label={queue.pinned ? 'ถอดหมุด' : 'ปักหมุด'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill={queue.pinned ? '#06C755' : 'none'}
          stroke={queue.pinned ? '#06C755' : '#9CA3AF'} strokeWidth="2"
        >
          <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z"/>
          <circle cx="12" cy="8" r="2"
            fill={queue.pinned ? 'white' : 'none'}
            stroke={queue.pinned ? '#06C755' : '#9CA3AF'}
          />
        </svg>
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QueueListPage({ user, onSelectQueue, onLogout, onExport }) {
  const { t, lang, toggleLang } = useLang()
  const [showModal,   setShowModal]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const {
    queues, loading,
    search, setSearch,
    filter, setFilter,
    handleCreate,
    handleTogglePin,
  } = useQueueList()

  const TABS = [
    ['all',       t.filterAll],
    ['open',      t.filterOpen],
    ['closed',    t.filterClosed],
    ['cancelled', t.filterCancelled],
  ]

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden relative">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-0 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t.queueListTitle}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
            >
              {lang === 'th' ? 'EN' : 'TH'}
            </button>
            {user?.role === 'admin' && onExport && (
              <button
                onClick={onExport}
                title="Export ข้อมูล"
                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center active:bg-gray-200 transition-colors"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </button>
            )}
            {user?.role !== 'qc' && (
              <button
                onClick={() => setShowModal(true)}
                className="w-8 h-8 bg-[#06C755] rounded-xl flex items-center justify-center shadow-sm shadow-green-200 active:scale-90 transition-transform"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowProfile(true)}
              title="โปรไฟล์"
              className="w-8 h-8 bg-[#06C755]/10 rounded-xl flex items-center justify-center active:bg-[#06C755]/20 transition-colors"
            >
              <span className="text-xs font-bold text-[#06C755]">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-[#F5F7FA] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex">
          {TABS.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                filter === val
                  ? 'text-[#06C755] border-[#06C755]'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pt-3 pb-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-7 h-7 text-[#06C755]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
            </svg>
          </div>
        ) : queues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1">
              <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="mt-3 text-sm text-gray-400">{t.noQueues}</p>
          </div>
        ) : (
          queues.map(queue => (
            <QueueItem
              key={queue.id}
              queue={queue}
              onSelect={onSelectQueue}
              onTogglePin={handleTogglePin}
            />
          ))
        )}
      </div>

      {showModal && (
        <NewQueueModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  )
}
