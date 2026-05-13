import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import { getTodayPrefix } from '../utils/dateUtils.js'

const QUEUE_ALLOWED = /^[0-9.,\-+]*$/

export default function NewQueueModal({ onClose, onCreate }) {
  const { t } = useLang()
  const [queueNum,   setQueueNum]   = useState('')
  const [supplier,   setSupplier]   = useState('')
  const [note,       setNote]       = useState('')
  const [queueError, setQueueError] = useState('')
  const [saving,     setSaving]     = useState(false)

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
                  <LoadingSpinner className="w-4 h-4" stroke="white"/>
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
