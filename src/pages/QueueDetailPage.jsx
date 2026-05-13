import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import { useQueueDetail } from '../hooks/useQueueDetail.js'
import { useProducts } from '../hooks/useProducts.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import QcStatusModal from '../components/QcStatusModal.jsx'
import ProductTypeModal from '../components/ProductTypeModal.jsx'
import FullPreview from '../components/FullPreview.jsx'
import MediaCard from '../components/MediaCard.jsx'
import { isToday } from '../utils/dateUtils.js'

const VIDEO_EXPIRY_DAYS = 15

export default function QueueDetailPage({ queue, user, onBack, onCamera }) {
  const { t } = useLang()
  const [taggingPhoto,      setTaggingPhoto]      = useState(null)
  const [taggingQcPhoto,    setTaggingQcPhoto]    = useState(null)
  const [previewIndex,      setPreviewIndex]      = useState(null)
  const [showConfirmFirstApprove, setShowConfirmFirstApprove] = useState(false)
  const [showConfirmClose,        setShowConfirmClose]        = useState(false)
  const [showConfirmCancel,       setShowConfirmCancel]       = useState(false)
  const [showConfirmReopen,       setShowConfirmReopen]       = useState(false)
  const [submitting,        setSubmitting]        = useState(false)
  const [groupBy,           setGroupBy]           = useState(false)

  const { liveQueue, media, loading, error, clearError, handleTag, handleQcStatus, handleDelete, handleFirstApproval, handleClose, handleCancel, handleReopen } = useQueueDetail(queue, user)

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(clearError, 4000)
    return () => clearTimeout(timer)
  }, [error])

  const q = liveQueue ?? queue
  const { products } = useProducts()

  const isAdmin        = user?.role === 'admin'
  const isQcUser       = user?.role === 'qc'
  const isCancelled    = q?.status === 'cancelled'
  const isPendingClose = q?.status === 'pending_close'
  const canCloseQueue  = isAdmin || user?.role === 'audit'
  const isAlreadyFirstApprover = isPendingClose && q?.firstApproval?.uid === user?.uid
  const canChangeQcStatus = isAdmin || isQcUser || user?.role === 'audit'

  const canEditProductType = (item) =>
    !isCancelled && item.takenByRole !== 'qc' && (isAdmin || isToday(item.takenAt))

  const canEditQcStatus = (item) =>
    !isCancelled && item.takenByRole === 'qc' && canChangeQcStatus

  const canEditItem = (item) => !isCancelled && (isAdmin || isToday(item.takenAt))

  const untaggedCount = media.filter(p => p.takenByRole !== 'qc' && !p.productType).length
  const images        = media.filter(p => p.type === 'image')
  const videos        = media.filter(p => p.type === 'video')

  const handleSaveTag = async (productType) => {
    if (!taggingPhoto) return false
    return await handleTag(taggingPhoto.id, productType)
  }

  const handleSaveQcStatus = async (status) => {
    if (!taggingQcPhoto) return false
    return await handleQcStatus(taggingQcPhoto.id, status)
  }

  const handleTagFromPreview = (item) => {
    setPreviewIndex(null)
    setTimeout(() => setTaggingPhoto(item), 100)
  }

  const handleQcStatusFromPreview = (item) => {
    setPreviewIndex(null)
    setTimeout(() => setTaggingQcPhoto(item), 100)
  }

  const handleTagItem = (item) => {
    if (item.takenByRole === 'qc') {
      if (canEditQcStatus(item)) setTaggingQcPhoto(item)
    } else {
      if (canEditProductType(item)) setTaggingPhoto(item)
    }
  }

  const handleFirstApproveQueue = async () => {
    if (submitting) return
    clearError(); setSubmitting(true)
    const ok = await handleFirstApproval()
    setSubmitting(false)
    if (ok) setShowConfirmFirstApprove(false)
  }

  const handleCloseQueue = async () => {
    if (submitting) return
    clearError(); setSubmitting(true)
    const ok = await handleClose()
    setSubmitting(false)
    if (ok) { setShowConfirmClose(false); onBack() }
  }

  const handleCancelQueue = async () => {
    if (submitting) return
    clearError(); setSubmitting(true)
    const ok = await handleCancel()
    setSubmitting(false)
    if (ok) setShowConfirmCancel(false)
  }

  const handleReopenQueue = async () => {
    if (submitting) return
    clearError(); setSubmitting(true)
    const ok = await handleReopen()
    setSubmitting(false)
    if (ok) setShowConfirmReopen(false)
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
            {q?.status === 'open' && (
              <div className="flex items-center gap-1.5">
                {!isQcUser && (
                  <button
                    onClick={() => setShowConfirmCancel(true)}
                    className="text-xs font-semibold text-red-400 bg-red-50 px-3 py-1.5 rounded-xl active:bg-red-100 transition-colors"
                  >
                    {t.cancelQueue}
                  </button>
                )}
                {canCloseQueue && (
                  <button
                    onClick={() => setShowConfirmFirstApprove(true)}
                    className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-3 py-1.5 rounded-xl active:bg-green-100 transition-colors"
                  >
                    {t.firstApproveQueue}
                  </button>
                )}
              </div>
            )}
            {isPendingClose && (
              <div className="flex items-center gap-1.5">
                {isAlreadyFirstApprover ? (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                    {t.statusPendingClose}
                  </span>
                ) : (
                  canCloseQueue && (
                    <button
                      onClick={() => setShowConfirmClose(true)}
                      className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl active:bg-gray-200 transition-colors"
                    >
                      {t.statusPendingClose}
                    </button>
                  )
                )}
              </div>
            )}
            {q?.status === 'closed' && (
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

      {/* Pending close banner */}
      {isPendingClose && q?.firstApproval && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center gap-2">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth="2" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-xs text-amber-700 font-medium">
            {t.pendingCloseBy(q?.firstApproval?.displayName ?? '...')}
            {' · '}
            {isAlreadyFirstApprover ? t.alreadyApproved : 'รอการยืนยันขั้นที่ 2'}
          </p>
        </div>
      )}

      {/* Media grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner className="w-7 h-7 text-[#06C755]"/>
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

      {/* Camera FAB */}
      {q?.status === 'open' && (
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
          onDelete={handleDelete}
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

      {/* Error toast */}
      {error && (
        <div className="absolute top-24 left-4 right-4 z-[60] bg-red-500 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="ml-1 flex-shrink-0 opacity-80 active:opacity-100">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* First Approval confirm */}
      {showConfirmFirstApprove && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-[#F0FDF4] rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t.firstApproveTitle}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t.firstApproveBody}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowConfirmFirstApprove(false)} disabled={submitting}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-40"
              >
                {t.cancel}
              </button>
              <button onClick={handleFirstApproveQueue} disabled={submitting}
                className="flex-1 bg-[#06C755] text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-green-200 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
                  : t.confirmFirstApprove}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Queue confirm */}
      {showConfirmClose && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <h3 className="font-bold text-gray-900 text-base">
              {isPendingClose ? t.closeQueueStep2Title : t.closeQueueTitle}
            </h3>
            <p className="text-sm text-gray-500 mt-1.5">
              {isPendingClose && q?.firstApproval
                ? t.closeQueueStep2Body(q?.firstApproval?.displayName ?? '...')
                : untaggedCount > 0
                  ? t.closeQueueBodyUntagged(untaggedCount)
                  : t.closeQueueBody}
            </p>
            {!isPendingClose && untaggedCount > 0 && (
              <p className="text-xs text-orange-400 mt-1">{t.closeQueueHint(isAdmin)}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowConfirmClose(false)} disabled={submitting}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-40"
              >
                {t.cancel}
              </button>
              <button onClick={handleCloseQueue} disabled={submitting}
                className="flex-1 bg-[#06C755] text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-green-200 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
                  : t.confirmClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen confirm */}
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
              <button onClick={() => setShowConfirmReopen(false)} disabled={submitting}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-40"
              >
                {t.cancel}
              </button>
              <button onClick={handleReopenQueue} disabled={submitting}
                className="flex-1 bg-blue-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
                  : t.confirmReopen}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
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
              <button onClick={() => setShowConfirmCancel(false)} disabled={submitting}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-40"
              >
                {t.cancel}
              </button>
              <button onClick={handleCancelQueue} disabled={submitting}
                className="flex-1 bg-red-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-red-200 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
                  : t.confirmCancelQueue}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
