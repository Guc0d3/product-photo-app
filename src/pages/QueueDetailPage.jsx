import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '../contexts/LangContext.jsx'

const PRODUCT_TYPES = [
  'เครื่องดื่ม', 'อาหารแห้ง', 'ขนม', 'ผลิตภัณฑ์ทำความสะอาด',
  'สินค้าอุปโภค', 'เครื่องสำอาง', 'ยาและอาหารเสริม', 'เครื่องใช้ไฟฟ้า',
  'เสื้อผ้า', 'เครื่องเขียน', 'ของเล่น', 'สินค้าเกษตร',
]

const VIDEO_EXPIRY_DAYS = 15

const today = new Date()
today.setHours(0, 0, 0, 0)

function isToday(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime() === today.getTime()
}

function daysUntilExpiry(takenAt) {
  const taken = new Date(takenAt)
  const expiry = new Date(taken.getTime() + VIDEO_EXPIRY_DAYS * 86400000)
  const now = new Date()
  return Math.ceil((expiry - now) / 86400000)
}

const MOCK_PHOTOS = [
  { id: 'p1', type: 'image', color: '#FFD6D6', takenAt: new Date(), takenAtStr: '09:15', productType: 'เครื่องดื่ม' },
  { id: 'p2', type: 'image', color: '#D6E4FF', takenAt: new Date(), takenAtStr: '09:17', productType: null },
  { id: 'p3', type: 'image', color: '#D6FFD6', takenAt: new Date(), takenAtStr: '09:18', productType: 'อาหารแห้ง' },
  { id: 'p4', type: 'video', color: '#FFE8D6', takenAt: new Date(), takenAtStr: '09:20', productType: null, duration: '0:23' },
  { id: 'p5', type: 'image', color: '#F0D6FF', takenAt: new Date(), takenAtStr: '09:22', productType: 'ขนม' },
  { id: 'p6', type: 'image', color: '#D6FFF5', takenAt: new Date(), takenAtStr: '09:25', productType: null },
  { id: 'p7', type: 'video', color: '#FFFAD6', takenAt: new Date(), takenAtStr: '09:28', productType: 'เครื่องสำอาง', duration: '1:05' },
  { id: 'p8', type: 'image', color: '#FFD6E8', takenAt: new Date(), takenAtStr: '09:31', productType: null },
]

// ── Product Type Modal ───────────────────────────────────────────────────────
function ProductTypeModal({ photo, onClose, onSave }) {
  const { t } = useLang()
  const [selected, setSelected] = useState(photo.productType || '')
  const [search, setSearch] = useState('')
  const filtered = PRODUCT_TYPES.filter(pt => pt.includes(search))

  return (
    <div className="absolute inset-0 bg-black/60 flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: '75%' }} onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-2 flex flex-col items-center">
          <div className="w-10 h-1 bg-gray-300 rounded-full"/>
        </div>
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: photo.color }}/>
          <div>
            <p className="text-sm font-semibold text-gray-800">{t.selectProductType}</p>
            <p className="text-xs text-gray-500">{t.takenAt(photo.takenAtStr)}</p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.searchProductType}
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {filtered.map(type => (
            <button key={type} onClick={() => setSelected(type)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl mb-1 text-sm font-medium transition-colors ${
                selected === type ? 'bg-green-50 text-[#06C755]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{type}</span>
              {selected === type && (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#06C755" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-6">{t.noProductTypeFound}</p>}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => { onSave(selected); onClose() }}
            disabled={!selected}
            className="w-full bg-[#06C755] text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Full-screen Photo/Video Preview ─────────────────────────────────────────
function FullPreview({ items, startIndex, onClose, onTagPhoto, onDelete, canEdit }) {
  const { t } = useLang()
  const [index, setIndex] = useState(startIndex)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const touchStartX = useRef(null)

  const current = items[index]

  const goPrev = useCallback(() => { if (index > 0) setIndex(i => i - 1) }, [index])
  const goNext = useCallback(() => { if (index < items.length - 1) setIndex(i => i + 1) }, [index, items.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape') { if (confirmDelete) setConfirmDelete(false); else onClose() }
      if (e.key === 'Delete' && canEdit) setConfirmDelete(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext, onClose, confirmDelete, canEdit])

  const handleDelete = () => {
    const remaining = items.length - 1
    if (remaining === 0) {
      onDelete(current.id)
      onClose()
    } else {
      const nextIndex = index >= remaining ? remaining - 1 : index
      onDelete(current.id)
      setIndex(nextIndex)
      setConfirmDelete(false)
    }
  }

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) goPrev()
    else if (dx < -50) goNext()
    touchStartX.current = null
  }

  const expiryDays = current.type === 'video' ? daysUntilExpiry(current.takenAt) : null

  return (
    <div className="absolute inset-0 bg-black z-40 flex flex-col"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={onClose} className="active:scale-90">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <span className="text-white text-sm font-medium">{index + 1} / {items.length}</span>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <button onClick={() => onTagPhoto(current)}
              className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full active:bg-white/30"
            >
              {t.editType}
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center active:bg-red-600"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-16"/>
        )}
      </div>

      {/* Delete confirm overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-8"
          onClick={() => setConfirmDelete(false)}
        >
          <div className="bg-white rounded-2xl p-5 w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{current.type === 'video' ? t.deleteVideo : t.deletePhoto}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.deleteHint(current.takenAtStr)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700"
              >
                {t.cancel}
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-transform"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media */}
      <div className="flex-1 flex items-center justify-center"
        style={{ background: current.color }}
      >
        {current.type === 'video' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <svg width="36" height="36" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="text-white/80 text-sm">{current.duration}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center opacity-20">
            <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth="0.5">
              <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/60 text-xs">{current.takenAtStr}</p>
            {current.productType ? (
              <span className="inline-block bg-[#06C755] text-white text-xs px-3 py-1 rounded-full mt-1">
                {current.productType}
              </span>
            ) : (
              <span className="inline-block bg-orange-500 text-white text-xs px-3 py-1 rounded-full mt-1">
                {t.notTaggedFull}
              </span>
            )}
            {expiryDays !== null && (
              <p className={`text-xs mt-1 ${expiryDays <= 3 ? 'text-red-400' : 'text-white/60'}`}>
                {expiryDays > 0 ? t.videoExpiresIn(expiryDays) : t.videoExpired}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={goPrev} disabled={index === 0}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center disabled:opacity-30 active:bg-white/30"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button onClick={goNext} disabled={index === items.length - 1}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center disabled:opacity-30 active:bg-white/30"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1 mt-3">
          {items.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${
                i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Left/Right tap zones */}
      <button onClick={goPrev} disabled={index === 0}
        className="absolute left-0 top-20 bottom-24 w-1/4 disabled:opacity-0"
        aria-label="รูปก่อนหน้า"
      />
      <button onClick={goNext} disabled={index === items.length - 1}
        className="absolute right-0 top-20 bottom-24 w-1/4 disabled:opacity-0"
        aria-label="รูปถัดไป"
      />
    </div>
  )
}

// ── Media Card ───────────────────────────────────────────────────────────────
function MediaCard({ item, index, onPreview, onTag, canEdit }) {
  const { t } = useLang()
  const expiryDays = item.type === 'video' ? daysUntilExpiry(item.takenAt) : null
  const isExpired = expiryDays !== null && expiryDays <= 0

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden">
      {/* Photo/Video area — tap to preview */}
      <button
        onClick={() => onPreview(index)}
        className="absolute inset-0 active:opacity-80 transition-opacity"
        style={{ background: item.color }}
        aria-label="ดูรูป"
      >
        {item.type === 'video' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
              <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            {item.duration && (
              <span className="absolute bottom-6 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {item.duration}
              </span>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth="1.5">
              <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        )}

        {/* Time */}
        <span className="absolute top-1.5 right-1.5 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-full">
          {item.takenAtStr}
        </span>

        {/* Video expiry warning */}
        {item.type === 'video' && expiryDays !== null && expiryDays <= 5 && (
          <span className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${
            isExpired ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'
          }`}>
            {isExpired ? t.expired : t.videoExpiry(expiryDays)}
          </span>
        )}

        {/* Dark overlay for bottom badge */}
        <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-black/50 to-transparent"/>
      </button>

      {/* Product type badge — tap separately to edit */}
      <button
        onClick={() => canEdit ? onTag(item) : null}
        className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5"
        aria-label="แก้ไขชนิดสินค้า"
      >
        {item.productType ? (
          <span className={`block text-white text-[10px] font-medium px-2 py-0.5 rounded-full truncate text-center ${
            canEdit ? 'bg-[#06C755]' : 'bg-[#06C755]/70'
          }`}>
            {item.productType}
          </span>
        ) : (
          <span className={`block text-white text-[10px] font-medium px-2 py-0.5 rounded-full text-center ${
            canEdit ? 'bg-orange-500' : 'bg-orange-400/70'
          }`}>
            {canEdit ? t.notTagged : t.noType}
          </span>
        )}
      </button>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function QueueDetailPage({ queue, user, onBack, onCamera }) {
  const { t } = useLang()
  const [photos, setPhotos] = useState(MOCK_PHOTOS)
  const [taggingPhoto, setTaggingPhoto] = useState(null)
  const [previewIndex, setPreviewIndex] = useState(null)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [groupBy, setGroupBy] = useState(false)

  const isAdmin = user?.role === 'admin'

  // Permission: regular user can only edit photos taken today
  const canEditItem = (item) => isAdmin || isToday(item.takenAt)

  const untaggedCount = photos.filter(p => !p.productType).length
  const images = photos.filter(p => p.type === 'image')
  const videos = photos.filter(p => p.type === 'video')

  const handleSaveTag = (productType) => {
    setPhotos(prev => prev.map(p => p.id === taggingPhoto.id ? { ...p, productType } : p))
  }

  const handleDeleteFromPreview = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  const handleCloseQueue = () => {
    setShowConfirmClose(false)
    onBack() // go back to queue list
  }

  const handleTagFromPreview = (item) => {
    if (canEditItem(item)) {
      setPreviewIndex(null)
      setTimeout(() => setTaggingPhoto(item), 100)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F5] overflow-hidden relative">
      {/* Header */}
      <div className="bg-[#06C755] text-white px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="active:scale-90">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm font-mono truncate">{queue?.code || 'RI20240507-001'}</p>
              {queue?.queue && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                  {t.queueLabel} {queue.queue}
                </span>
              )}
            </div>
            <p className="text-xs text-white/80 truncate">{queue?.supplier || 'บริษัท ABC จำกัด'}</p>
          </div>
          <div className="flex items-center gap-2">
            {untaggedCount > 0 && (
              <span className="bg-orange-400 text-white text-xs px-2 py-0.5 rounded-full">
                {t.untaggedCount(untaggedCount)}
              </span>
            )}
            <button
              onClick={() => setShowConfirmClose(true)}
              className="text-xs bg-white/20 px-2.5 py-1 rounded-full active:bg-white/30"
            >
              {t.closeQueue}
            </button>
          </div>
        </div>

        {/* Stats + controls */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-white/90">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              {images.length}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/90">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              {videos.length}
            </span>
            {untaggedCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-200">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                {t.untaggedWarning(untaggedCount)}
              </span>
            )}
          </div>
          {/* Group by toggle */}
          <button
            onClick={() => setGroupBy(g => !g)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              groupBy ? 'bg-white text-[#06C755]' : 'bg-white/20 text-white'
            }`}
          >
            {t.groupByType}
          </button>
        </div>

        {/* Permission notice */}
        {!isAdmin && (
          <div className="mt-2 bg-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-white/80">{t.permissionNotice}</p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <p className="mt-2 text-sm font-medium">{t.noMedia}</p>
            <p className="text-xs mt-1">{t.noMediaHint}</p>
          </div>
        ) : !groupBy ? (
          // All items mixed
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {photos.map((item, i) => (
              <MediaCard
                key={item.id}
                item={item}
                index={i}
                onPreview={(idx) => setPreviewIndex(idx)}
                onTag={setTaggingPhoto}
                canEdit={canEditItem(item)}
              />
            ))}
          </div>
        ) : (
          // Grouped by type
          <>
            {images.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="2">
                    <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                  <span className="text-xs font-semibold text-gray-500">{t.imagesGroup(images.length)}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {images.map((item) => {
                    const idx = photos.findIndex(p => p.id === item.id)
                    return (
                      <MediaCard key={item.id} item={item} index={idx}
                        onPreview={(i) => setPreviewIndex(i)}
                        onTag={setTaggingPhoto}
                        canEdit={canEditItem(item)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
            {videos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span className="text-xs font-semibold text-gray-500">{t.videosGroup(videos.length)}</span>
                  <span className="text-xs text-gray-400">{t.videoExpiryLabel(VIDEO_EXPIRY_DAYS)}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {videos.map((item) => {
                    const idx = photos.findIndex(p => p.id === item.id)
                    return (
                      <MediaCard key={item.id} item={item} index={idx}
                        onPreview={(i) => setPreviewIndex(i)}
                        onTag={setTaggingPhoto}
                        canEdit={canEditItem(item)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera FAB */}
      <div className="absolute bottom-6 right-6">
        <button onClick={onCamera}
          className="w-16 h-16 bg-[#06C755] rounded-full shadow-lg shadow-green-300 flex items-center justify-center active:scale-90 transition-transform"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
            <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        </button>
      </div>

      {/* Full preview */}
      {previewIndex !== null && (
        <FullPreview
          items={photos}
          startIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onTagPhoto={handleTagFromPreview}
          onDelete={handleDeleteFromPreview}
          canEdit={canEditItem(photos[previewIndex])}
        />
      )}

      {/* Product Type Modal */}
      {taggingPhoto && (
        <ProductTypeModal
          photo={taggingPhoto}
          onClose={() => setTaggingPhoto(null)}
          onSave={handleSaveTag}
        />
      )}

      {/* Confirm Close Queue */}
      {showConfirmClose && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 px-8">
          <div className="bg-white rounded-2xl p-5 w-full shadow-xl">
            <h3 className="font-semibold text-gray-800 text-base">{t.closeQueueTitle}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {untaggedCount > 0
                ? t.closeQueueBodyUntagged(untaggedCount)
                : t.closeQueueBody
              }
            </p>
            {untaggedCount > 0 && (
              <p className="text-xs text-orange-500 mt-1">{t.closeQueueHint(isAdmin)}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowConfirmClose(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700"
              >
                {t.cancel}
              </button>
              <button onClick={handleCloseQueue}
                className="flex-1 bg-[#06C755] text-white rounded-xl py-2.5 text-sm font-medium"
              >
                {t.confirmClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
