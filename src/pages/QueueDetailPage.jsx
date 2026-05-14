import { useState, useEffect } from 'react'
import { useQueueDetail } from '../hooks/useQueueDetail.js'
import { useProducts } from '../hooks/useProducts.js'
import QcStatusModal from '../components/QcStatusModal.jsx'
import ProductTypeModal from '../components/ProductTypeModal.jsx'
import FullPreview from '../components/FullPreview.jsx'
import QueueDetailHeader from '../components/QueueDetailHeader.jsx'
import MediaGrid from '../components/MediaGrid.jsx'
import QueueConfirmModals from '../components/QueueConfirmModals.jsx'
import { isToday } from '../utils/dateUtils.js'

export default function QueueDetailPage({ queue, user, onBack, onCamera }) {
  const [taggingPhoto,            setTaggingPhoto]            = useState(null)
  const [taggingQcPhoto,          setTaggingQcPhoto]          = useState(null)
  const [previewIndex,            setPreviewIndex]            = useState(null)
  const [showConfirmFirstApprove, setShowConfirmFirstApprove] = useState(false)
  const [showConfirmClose,        setShowConfirmClose]        = useState(false)
  const [showConfirmCancel,       setShowConfirmCancel]       = useState(false)
  const [showConfirmReopen,       setShowConfirmReopen]       = useState(false)
  const [submitting,              setSubmitting]              = useState(false)
  const [groupBy,                 setGroupBy]                 = useState(false)
  const [sortAsc,                 setSortAsc]                 = useState(false)

  const { liveQueue, media, loading, error, clearError, handleTag, handleQcStatus, handleDelete, handleFirstApproval, handleClose, handleCancel, handleReopen } = useQueueDetail(queue, user)

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(clearError, 4000)
    return () => clearTimeout(timer)
  }, [error, clearError])

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

  const sortedMedia   = [...media].sort((a, b) => {
    const ta = a.takenAt?.getTime?.() ?? 0
    const tb = b.takenAt?.getTime?.() ?? 0
    return sortAsc ? ta - tb : tb - ta
  })
  const untaggedCount = sortedMedia.filter(p => p.takenByRole !== 'qc' && !p.productType).length
  const images        = sortedMedia.filter(p => p.type === 'image')
  const videos        = sortedMedia.filter(p => p.type === 'video')

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
      <QueueDetailHeader
        queue={queue} q={q} user={user}
        isAdmin={isAdmin} isQcUser={isQcUser}
        isCancelled={isCancelled} isPendingClose={isPendingClose}
        isAlreadyFirstApprover={isAlreadyFirstApprover} canCloseQueue={canCloseQueue}
        images={images} videos={videos} untaggedCount={untaggedCount}
        sortAsc={sortAsc} groupBy={groupBy}
        onBack={onBack}
        onSortToggle={() => setSortAsc(v => !v)}
        onGroupToggle={() => setGroupBy(g => !g)}
        onShowFirstApprove={() => setShowConfirmFirstApprove(true)}
        onShowClose={() => setShowConfirmClose(true)}
        onShowCancel={() => setShowConfirmCancel(true)}
        onShowReopen={() => setShowConfirmReopen(true)}
      />

      <MediaGrid
        loading={loading}
        sortedMedia={sortedMedia} images={images} videos={videos}
        groupBy={groupBy}
        canEditItem={canEditItem}
        onPreview={setPreviewIndex}
        onTag={handleTagItem}
      />

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
          items={sortedMedia}
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

      <QueueConfirmModals
        q={q} submitting={submitting}
        isPendingClose={isPendingClose} isAdmin={isAdmin} untaggedCount={untaggedCount}
        showFirstApprove={showConfirmFirstApprove}
        showClose={showConfirmClose}
        showReopen={showConfirmReopen}
        showCancel={showConfirmCancel}
        onHideFirstApprove={() => setShowConfirmFirstApprove(false)}
        onHideClose={() => setShowConfirmClose(false)}
        onHideReopen={() => setShowConfirmReopen(false)}
        onHideCancel={() => setShowConfirmCancel(false)}
        onFirstApprove={handleFirstApproveQueue}
        onClose={handleCloseQueue}
        onReopen={handleReopenQueue}
        onCancel={handleCancelQueue}
      />
    </div>
  )
}
