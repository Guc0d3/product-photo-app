import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import { useQueueDetail } from '../hooks/useQueueDetail.js'
import { useProducts } from '../hooks/useProducts.js'
import { seedProducts } from '../services/productService.js'

const VIDEO_EXPIRY_DAYS = 15

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isToday(date) {
  if (!date) return false
  const a = new Date(date); a.setHours(0, 0, 0, 0)
  const b = new Date();     b.setHours(0, 0, 0, 0)
  return a.getTime() === b.getTime()
}

function daysUntilExpiry(takenAt) {
  const expiry = new Date(takenAt).getTime() + VIDEO_EXPIRY_DAYS * 86400000
  return Math.ceil((expiry - Date.now()) / 86400000)
}

// ── QC Status helpers ─────────────────────────────────────────────────────────

function QcStatusIcon({ status, size = 18 }) {
  const s = size
  const inner = Math.round(s * 0.55)
  if (status === 'passed') return (
    <div className="rounded-full bg-green-500 flex items-center justify-center flex-shrink-0" style={{ width: s, height: s }}>
      <svg width={inner} height={inner} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
    </div>
  )
  if (status === 'failed') return (
    <div className="rounded-full bg-red-500 flex items-center justify-center flex-shrink-0" style={{ width: s, height: s }}>
      <svg width={inner} height={inner} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
        <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
  )
  return (
    <div className="rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0" style={{ width: s, height: s }}>
      <svg width={inner} height={inner} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
        <path strokeLinecap="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
  )
}

const QC_STATUS_BG = { passed: 'bg-green-500', failed: 'bg-red-500', pending: 'bg-gray-400' }

// ── QC Status Modal ───────────────────────────────────────────────────────────
function QcStatusModal({ photo, onClose, onSave }) {
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
    await onSave(selected)
    onClose()
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
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30 70"/>
                </svg>
              </span>
            ) : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product Type Modal ────────────────────────────────────────────────────────
function ProductTypeModal({ photo, productTypes, isAdmin, onClose, onSave }) {
  const { t } = useLang()
  const [selected, setSelected] = useState(photo.productType || '')
  const [search,   setSearch]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [seeding,  setSeeding]  = useState(false)

  const filtered = productTypes.filter(pt =>
    pt.toLowerCase().includes(search.toLowerCase())
  )

  const handleSeed = async () => {
    setSeeding(true)
    try { await seedProducts() } catch (e) { console.error('seed:', e) }
    setSeeding(false)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    await onSave(selected)
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl flex flex-col shadow-2xl" style={{ maxHeight: '75%' }} onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-2 flex flex-col items-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full"/>
        </div>

        {/* Header thumbnail */}
        <div className="px-5 pb-3 flex items-center gap-3">
          {photo.url ? (
            <img
              src={photo.url}
              alt="media"
              className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl flex-shrink-0 shadow-sm bg-gray-100 flex items-center justify-center">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1.5">
                <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{t.selectProductType}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.takenAt(formatTime(photo.takenAt))}</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.searchProductType}
              className="w-full bg-[#F5F7FA] rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {filtered.map(type => (
            <button key={type} onClick={() => setSelected(type)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-1 text-sm font-medium transition-colors ${
                selected === type ? 'bg-[#F0FDF4] text-[#16A34A]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{type}</span>
              {selected === type && (
                <div className="w-5 h-5 bg-[#06C755] rounded-full flex items-center justify-center">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && search === '' && productTypes.length === 0 && isAdmin && (
            /* First-run: no products seeded yet — show one-click seed button */
            <div className="flex flex-col items-center py-10 gap-3">
              <p className="text-sm text-gray-400 text-center">{t.noProductTypes ?? 'ยังไม่มีชนิดสินค้า'}</p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 bg-[#06C755] text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-all disabled:opacity-60"
              >
                {seeding ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30 70"/>
                    </svg>
                    {t.seeding ?? 'กำลังเพิ่มข้อมูล...'}
                  </>
                ) : (
                  <>{t.seedProducts ?? 'เพิ่มชนิดสินค้าเริ่มต้น'}</>
                )}
              </button>
            </div>
          )}
          {filtered.length === 0 && (search !== '' || productTypes.length > 0) && (
            <p className="text-center text-gray-400 text-sm py-8">{t.noProductTypeFound}</p>
          )}
        </div>

        {/* Footer button */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="w-full bg-gradient-to-r from-[#06C755] to-[#05B84C] text-white rounded-2xl py-3.5 font-semibold text-sm disabled:opacity-40 shadow-lg shadow-green-200 disabled:shadow-none active:scale-[0.98] transition-all"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30 70"/>
                </svg>
              </span>
            ) : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Full-screen Preview ───────────────────────────────────────────────────────
function FullPreview({ items, startIndex, onClose, onTagPhoto, onQcStatus, onDelete, canDelete, canEditProductType, canEditQcStatus }) {
  const { t } = useLang()
  const [index,         setIndex]         = useState(startIndex)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const touchStartX = useRef(null)

  const current = items[index]

  const goPrev = useCallback(() => { if (index > 0) setIndex(i => i - 1) }, [index])
  const goNext = useCallback(() => { if (index < items.length - 1) setIndex(i => i + 1) }, [index, items.length])

  const isQcItem        = current?.takenByRole === 'qc'
  const canTagCurrent   = isQcItem ? canEditQcStatus(current) : canEditProductType(current)
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
          {canDeleteCurrent && (
            <button onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center active:bg-red-600"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          )}
          {!canTagCurrent && !canDeleteCurrent && <div className="w-16"/>}
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
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {current.type === 'video' ? (
          <video
            src={current.url}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={current.url}
            alt={`media ${index + 1}`}
            className="w-full h-full object-contain"
          />
        )}

        {/* QC status — large centered watermark for QC media */}
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
            {!isQcItem && (
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
        {/* Dot indicators */}
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

// ── Media Card ────────────────────────────────────────────────────────────────
function MediaCard({ item, index, onPreview, onTag, canEdit }) {
  const { t } = useLang()
  const expiryDays = item.type === 'video' ? daysUntilExpiry(item.takenAt) : null
  const isExpired  = expiryDays !== null && expiryDays <= 0

  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <button
        onClick={() => onPreview(index)}
        className="absolute inset-0 active:opacity-80 transition-opacity bg-gray-100"
        aria-label="preview"
      >
        {/* Thumbnail */}
        {item.type === 'video' ? (
          <>
            <video
              src={item.url}
              className="absolute inset-0 w-full h-full object-cover"
              preload="metadata"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            {item.duration && (
              <span className="absolute bottom-6 right-1.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                {item.duration}
              </span>
            )}
          </>
        ) : (
          <img
            src={item.url}
            alt={`media ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Time badge */}
        <span className="absolute top-1.5 right-1.5 bg-black/30 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full">
          {formatTime(item.takenAt)}
        </span>

        {/* Expiry badge */}
        {item.type === 'video' && expiryDays !== null && expiryDays <= 5 && (
          <span className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
            isExpired ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'
          }`}>
            {isExpired ? t.expired : t.videoExpiry(expiryDays)}
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent rounded-b-2xl"/>
      </button>

      {/* Product type / QC status badge */}
      <button
        onClick={() => onTag(item)}
        className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5"
        aria-label="tag"
      >
        {item.takenByRole === 'qc' ? (
          /* QC media — show QC status badge */
          <div className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded-full ${QC_STATUS_BG[item.qcStatus || 'pending']}`}>
            <QcStatusIcon status={item.qcStatus || 'pending'} size={10}/>
          </div>
        ) : item.productType ? (
          <span className={`block text-white text-[10px] font-semibold px-2 py-0.5 rounded-full truncate text-center ${
            canEdit ? 'bg-[#06C755]' : 'bg-[#06C755]/70'
          }`}>
            {item.productType}
          </span>
        ) : (
          <span className={`block text-white text-[10px] font-semibold px-2 py-0.5 rounded-full text-center ${
            canEdit ? 'bg-orange-500' : 'bg-orange-400/70'
          }`}>
            {canEdit ? t.notTagged : t.noType}
          </span>
        )}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QueueDetailPage({ queue, user, onBack, onCamera }) {
  const { t } = useLang()
  const [taggingPhoto,      setTaggingPhoto]      = useState(null)
  const [taggingQcPhoto,    setTaggingQcPhoto]    = useState(null)
  const [previewIndex,      setPreviewIndex]      = useState(null)
  const [showConfirmClose,  setShowConfirmClose]  = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [showConfirmReopen, setShowConfirmReopen] = useState(false)
  const [groupBy,           setGroupBy]           = useState(false)

  const { media, loading, handleTag, handleQcStatus, handleDelete, handleClose, handleCancel, handleReopen } = useQueueDetail(queue)
  const { products } = useProducts()

  const isAdmin     = user?.role === 'admin'
  const isQcUser    = user?.role === 'qc'
  const isCancelled = queue?.status === 'cancelled'

  // Can change QC status: qc, audit, admin
  const canChangeQcStatus = isAdmin || isQcUser || user?.role === 'audit'

  // Can edit product type: not QC media, not cancelled, admin or today
  const canEditProductType = (item) =>
    !isCancelled && item.takenByRole !== 'qc' && (isAdmin || isToday(item.takenAt))

  // Can change QC status on a QC media item: not cancelled, authorized role
  const canEditQcStatus = (item) =>
    !isCancelled && item.takenByRole === 'qc' && canChangeQcStatus

  // Can delete: not cancelled, admin or today
  const canEditItem = (item) => !isCancelled && (isAdmin || isToday(item.takenAt))

  // Only non-QC media count toward untagged
  const untaggedCount = media.filter(p => p.takenByRole !== 'qc' && !p.productType).length
  const images        = media.filter(p => p.type === 'image')
  const videos        = media.filter(p => p.type === 'video')

  const handleSaveTag = async (productType) => {
    if (!taggingPhoto) return
    await handleTag(taggingPhoto.id, productType)
  }

  const handleDeleteFromPreview = async (id) => {
    await handleDelete(id)
  }

  const handleCloseQueue = async () => {
    await handleClose()
    setShowConfirmClose(false)
    onBack()
  }

  const handleCancelQueue = async () => {
    await handleCancel()
    setShowConfirmCancel(false)
  }

  const handleReopenQueue = async () => {
    await handleReopen()
    setShowConfirmReopen(false)
  }

  const handleSaveQcStatus = async (status) => {
    if (!taggingQcPhoto) return
    await handleQcStatus(taggingQcPhoto.id, status)
  }

  const handleTagFromPreview = (item) => {
    setPreviewIndex(null)
    setTimeout(() => setTaggingPhoto(item), 100)
  }

  const handleQcStatusFromPreview = (item) => {
    setPreviewIndex(null)
    setTimeout(() => setTaggingQcPhoto(item), 100)
  }

  // Unified tag handler: routes to correct modal based on item type
  const handleTagItem = (item) => {
    if (item.takenByRole === 'qc') {
      if (canEditQcStatus(item)) setTaggingQcPhoto(item)
    } else {
      if (canEditProductType(item)) setTaggingPhoto(item)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden relative">
      {/* Header */}
      <div className="bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 bg-[#F5F7FA] rounded-xl flex items-center justify-center active:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-sm font-mono tracking-wide truncate">
                {queue?.code || '—'}
              </p>
              {queue?.queueNumber && (
                <span className="bg-[#F0FDF4] text-[#16A34A] text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  {t.queueLabel} {queue.queueNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{queue?.supplier || ''}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {untaggedCount > 0 && !isCancelled && (
              <span className="bg-orange-50 text-orange-500 text-xs font-semibold px-2 py-1 rounded-full border border-orange-100">
                {t.untaggedCount(untaggedCount)}
              </span>
            )}
            {isCancelled && (
              <span className="bg-red-50 text-red-400 text-xs font-semibold px-2 py-1 rounded-full border border-red-100">
                {t.statusCancelled}
              </span>
            )}
            {queue?.status === 'open' && (
              <div className="flex items-center gap-1.5">
                {!isQcUser && (
                  <button
                    onClick={() => setShowConfirmCancel(true)}
                    className="text-xs font-semibold text-red-400 bg-red-50 px-3 py-1.5 rounded-xl active:bg-red-100 transition-colors"
                  >
                    {t.cancelQueue}
                  </button>
                )}
                <button
                  onClick={() => setShowConfirmClose(true)}
                  className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl active:bg-gray-200 transition-colors"
                >
                  {t.closeQueue}
                </button>
              </div>
            )}
            {queue?.status === 'closed' && (
              <button
                onClick={() => setShowConfirmReopen(true)}
                className="text-xs font-semibold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-xl active:bg-blue-100 transition-colors"
              >
                {t.reopenQueue}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              <span className="font-semibold text-gray-700">{images.length}</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                <path strokeLinecap="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <span className="font-semibold text-gray-700">{videos.length}</span>
            </span>
            {untaggedCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-400">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                {t.untaggedWarning(untaggedCount)}
              </span>
            )}
          </div>
          <button
            onClick={() => setGroupBy(g => !g)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
              groupBy ? 'bg-[#06C755] text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {t.groupByType}
          </button>
        </div>

        {!isAdmin && (
          <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth="2">
              <path strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-amber-600">{t.permissionNotice}</p>
          </div>
        )}
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex items-center gap-2">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          <p className="text-xs text-red-500 font-medium">{t.cancelledBanner}</p>
        </div>
      )}

      {/* Media grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-7 h-7 text-[#06C755]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
            </svg>
          </div>
        ) : media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1">
                <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">{t.noMedia}</p>
            <p className="text-xs text-gray-300 mt-1">{t.noMediaHint}</p>
          </div>
        ) : !groupBy ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {media.map((item, i) => (
              <MediaCard key={item.id} item={item} index={i}
                onPreview={setPreviewIndex}
                onTag={handleTagItem}
                canEdit={canEditItem(item)}
              />
            ))}
          </div>
        ) : (
          <>
            {images.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                    <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.imagesGroup(images.length)}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {images.map(item => {
                    const idx = media.findIndex(m => m.id === item.id)
                    return <MediaCard key={item.id} item={item} index={idx} onPreview={setPreviewIndex} onTag={handleTagItem} canEdit={canEditItem(item)}/>
                  })}
                </div>
              </div>
            )}
            {videos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.videosGroup(videos.length)}</span>
                  <span className="text-xs text-gray-300">{t.videoExpiryLabel(VIDEO_EXPIRY_DAYS)}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {videos.map(item => {
                    const idx = media.findIndex(m => m.id === item.id)
                    return <MediaCard key={item.id} item={item} index={idx} onPreview={setPreviewIndex} onTag={handleTagItem} canEdit={canEditItem(item)}/>
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera FAB — only for open queues */}
      {queue?.status === 'open' && (
        <div className="absolute bottom-6 right-5">
          <button onClick={onCamera}
            className="w-[60px] h-[60px] bg-[#06C755] rounded-[18px] shadow-xl shadow-green-200 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
              <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </button>
        </div>
      )}

      {/* Overlays */}
      {previewIndex !== null && media[previewIndex] && (
        <FullPreview
          items={media}
          startIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onTagPhoto={handleTagFromPreview}
          onQcStatus={handleQcStatusFromPreview}
          onDelete={handleDeleteFromPreview}
          canDelete={canEditItem}
          canEditProductType={canEditProductType}
          canEditQcStatus={canEditQcStatus}
        />
      )}

      {taggingPhoto && (
        <ProductTypeModal
          photo={taggingPhoto}
          productTypes={products}
          isAdmin={isAdmin}
          onClose={() => setTaggingPhoto(null)}
          onSave={handleSaveTag}
        />
      )}

      {taggingQcPhoto && (
        <QcStatusModal
          photo={taggingQcPhoto}
          onClose={() => setTaggingQcPhoto(null)}
          onSave={handleSaveQcStatus}
        />
      )}

      {showConfirmClose && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <h3 className="font-bold text-gray-900 text-base">{t.closeQueueTitle}</h3>
            <p className="text-sm text-gray-500 mt-1.5">
              {untaggedCount > 0 ? t.closeQueueBodyUntagged(untaggedCount) : t.closeQueueBody}
            </p>
            {untaggedCount > 0 && (
              <p className="text-xs text-orange-400 mt-1">{t.closeQueueHint(isAdmin)}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowConfirmClose(false)}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200"
              >
                {t.cancel}
              </button>
              <button onClick={handleCloseQueue}
                className="flex-1 bg-[#06C755] text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-green-200 active:scale-[0.98] transition-transform"
              >
                {t.confirmClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmReopen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t.reopenQueueTitle}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t.reopenQueueBody}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowConfirmReopen(false)}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200"
              >
                {t.cancel}
              </button>
              <button onClick={handleReopenQueue}
                className="flex-1 bg-blue-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
              >
                {t.confirmReopen}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmCancel && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t.cancelQueueTitle}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t.cancelQueueBody}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowConfirmCancel(false)}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200"
              >
                {t.cancel}
              </button>
              <button onClick={handleCancelQueue}
                className="flex-1 bg-red-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-red-200 active:scale-[0.98] transition-transform"
              >
                {t.confirmCancelQueue}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
