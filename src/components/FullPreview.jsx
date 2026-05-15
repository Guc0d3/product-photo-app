import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import QcStatusIcon from './QcStatusIcon.jsx'
import { formatTime, daysUntilExpiry } from '../utils/dateUtils.js'

export default function FullPreview({ items, startIndex, onClose, onTagPhoto, onQcStatus, onDelete, canDelete, canEditProductType, canEditQcStatus }) {
  const { t } = useLang()
  const [index,         setIndex]         = useState(startIndex)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [zoomed,        setZoomed]        = useState(false)
  const [rotation,      setRotation]      = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => { setZoomed(false); setRotation(0) }, [index])

  const current = items[index]

  const goPrev = useCallback(() => { if (index > 0) setIndex(i => i - 1) }, [index])
  const goNext = useCallback(() => { if (index < items.length - 1) setIndex(i => i + 1) }, [index, items.length])

  const isQcItem         = current?.takenByRole === 'qc'
  const canTagCurrent    = isQcItem ? canEditQcStatus(current) : canEditProductType(current)
  const canDeleteCurrent = canDelete(current)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape')  { if (confirmDelete) setConfirmDelete(false); else onClose() }
      if (e.key === 'Delete' && canDeleteCurrent) setConfirmDelete(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext, onClose, confirmDelete, canDeleteCurrent])

  const handleDelete = async () => {
    const remaining = items.length - 1
    if (remaining === 0) {
      await onDelete(current.id)
      onClose()
    } else {
      const nextIndex = index >= remaining ? remaining - 1 : index
      await onDelete(current.id)
      setIndex(nextIndex)
      setConfirmDelete(false)
    }
  }

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) goPrev()
    else if (dx < -50) goNext()
    touchStartX.current = null
  }

  if (!current) return null

  const expiryDays = current.type === 'video' ? daysUntilExpiry(current.takenAt) : null
  const takenAtStr = formatTime(current.takenAt)

  return (
    <div className="absolute inset-0 bg-black z-40 flex flex-col"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 backdrop-blur-sm">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <span className="text-white/80 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
          {index + 1} / {items.length}
        </span>
        <div className="flex items-center gap-2">
          {canTagCurrent && (
            <button
              onClick={() => isQcItem ? onQcStatus(current) : onTagPhoto(current)}
              className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full active:bg-white/20"
            >
              {isQcItem ? t.qcStatusLabel : t.editType}
            </button>
          )}
          {current.type !== 'video' && (
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center active:bg-white/20"
              aria-label="หมุนรูป"
            >
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          )}
          {canDeleteCurrent && (
            <button onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center active:bg-red-600"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}
          {!canTagCurrent && current.type === 'video' && !canDeleteCurrent && <div className="w-16"/>}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && canDeleteCurrent && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(false)}
        >
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{current.type === 'video' ? t.deleteVideo : t.deletePhoto}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.deleteHint(takenAtStr)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200"
              >
                {t.cancel}
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-500 text-white rounded-2xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform shadow-lg shadow-red-200"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media viewer */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pt-20 pb-32">
          {current.type === 'video' ? (
            <video src={current.url} controls playsInline className="max-w-full max-h-full object-contain"/>
          ) : (
            <img
              src={current.url}
              alt={`media ${index + 1}`}
              onClick={() => setZoomed(z => !z)}
              style={{ transform: `rotate(${rotation}deg)${zoomed ? ' scale(2.5)' : ''}` }}
              className="max-w-full max-h-full object-contain select-none transition-transform duration-200 cursor-zoom-in"
            />
          )}
        </div>

        {isQcItem && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="opacity-40">
              <QcStatusIcon status={current.qcStatus || 'pending'} size={120}/>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/50 text-xs mb-1.5">{takenAtStr}</p>
            {!isQcItem && current.type !== 'video' && (
              current.productType ? (
                <span className="inline-flex items-center bg-[#06C755] text-white text-xs font-medium px-3 py-1 rounded-full">
                  {current.productType}
                </span>
              ) : (
                <span className="inline-flex items-center bg-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {t.notTaggedFull}
                </span>
              )
            )}
            {expiryDays !== null && (
              <p className={`text-xs mt-1.5 ${expiryDays <= 3 ? 'text-red-400' : 'text-white/50'}`}>
                {expiryDays > 0 ? t.videoExpiresIn(expiryDays) : t.videoExpired}
              </p>
            )}
            {current.takenByName && (
              <p className="flex items-center gap-1 text-white/50 text-xs mt-1.5">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                {current.takenByName.includes('@')
                  ? current.takenByName.split('@')[0]
                  : current.takenByName}
              </p>
            )}
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button onClick={goPrev} disabled={index === 0}
              className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-20 active:bg-white/20"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button onClick={goNext} disabled={index === items.length - 1}
              className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-20 active:bg-white/20"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-4 pointer-events-auto">
          {items.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Wide tap areas for prev/next */}
      <button onClick={goPrev} disabled={index === 0}
        className="absolute left-0 top-20 bottom-24 w-1/4 disabled:opacity-0" aria-label="prev"/>
      <button onClick={goNext} disabled={index === items.length - 1}
        className="absolute right-0 top-20 bottom-24 w-1/4 disabled:opacity-0" aria-label="next"/>
    </div>
  )
}
