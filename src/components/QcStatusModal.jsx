import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import QcStatusIcon from './QcStatusIcon.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import { formatTime } from '../utils/dateUtils.js'

export default function QcStatusModal({ photo, onClose, onSave }) {
  const { t } = useLang()
  const [selected, setSelected] = useState(photo.qcStatus || 'pending')
  const [saving,   setSaving]   = useState(false)

  const options = [
    { value: 'pending', label: t.qcPending },
    { value: 'passed',  label: t.qcPassed  },
    { value: 'failed',  label: t.qcFailed  },
  ]

  const handleSave = async () => {
    setSaving(true)
    const ok = await onSave(selected)
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-2 flex flex-col items-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full"/>
        </div>
        <div className="px-5 pb-4 flex items-center gap-3">
          {photo.url && (
            <img src={photo.url} alt="media" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-sm"/>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{t.selectQcStatus}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.takenAt(formatTime(photo.takenAt))}</p>
          </div>
        </div>
        <div className="px-4 pb-2 flex flex-col gap-2">
          {options.map(opt => (
            <button key={opt.value} onClick={() => setSelected(opt.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                selected === opt.value ? 'bg-gray-50 ring-2 ring-gray-200' : 'hover:bg-gray-50'
              }`}
            >
              <QcStatusIcon status={opt.value} size={22}/>
              <span className="text-sm font-medium text-gray-800">{opt.label}</span>
              {selected === opt.value && (
                <div className="ml-auto w-5 h-5 bg-[#06C755] rounded-full flex items-center justify-center">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#06C755] to-[#05B84C] text-white rounded-2xl py-3.5 font-semibold text-sm disabled:opacity-40 shadow-lg shadow-green-200 active:scale-[0.98] transition-all"
          >
            {saving
              ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
              : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
