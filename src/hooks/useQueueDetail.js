import { useState, useEffect } from 'react'
import {
  subscribeMedia,
  tagMedia,
  updateQcStatus,
  deleteMedia,
  syncHasUntagged,
} from '../services/mediaService.js'
import { firstApproveQueue, closeQueue, cancelQueue, reopenQueue, subscribeQueue } from '../services/queueService.js'

/**
 * Controller hook for the queue detail screen.
 * Subscribes to the queue doc + media subcollection in real-time; exposes action handlers.
 */
export function useQueueDetail(queue, user) {
  const [liveQueue, setLiveQueue] = useState(queue)
  const [media,     setMedia]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // ── subscribe to queue document (status, firstApproval, etc.) ──────────
  useEffect(() => {
    if (!queue?.id) return
    setLiveQueue(queue)   // reset immediately so stale data from previous queue doesn't flash
    const unsubscribe = subscribeQueue(queue.id, setLiveQueue)
    return () => unsubscribe()
  }, [queue?.id])  // depend only on id — new object reference for same queue must not re-subscribe

  // ── subscribe to media subcollection ────────────────────────────────────
  useEffect(() => {
    if (!queue?.id) return
    setLoading(true)
    const unsubscribe = subscribeMedia(
      queue.id,
      (data) => { setMedia(data); setLoading(false) },
      ()     => setLoading(false),
    )
    return () => unsubscribe()
  }, [queue?.id])

  // ── actions ─────────────────────────────────────────────────────────────

  const handleTag = async (mediaId, productType) => {
    try {
      await tagMedia(queue.id, mediaId, productType)
      // Compute updated list optimistically to sync the hasUntagged flag
      const updated = media.map(m => m.id === mediaId ? { ...m, productType } : m)
      await syncHasUntagged(queue.id, updated)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const handleDelete = async (mediaId) => {
    try {
      const item = media.find(m => m.id === mediaId)
      if (!item) return false

      // 1. Delete Firestore doc + enqueue Storage deletion (handled by Cloud Function)
      await deleteMedia(queue.id, mediaId, item.type, item.storagePath)

      // 2. Sync hasUntagged flag
      const remaining = media.filter(m => m.id !== mediaId)
      await syncHasUntagged(queue.id, remaining)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const handleFirstApproval = async () => {
    try {
      await firstApproveQueue(queue.id, user)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const handleClose = async () => {
    try {
      await closeQueue(queue.id, user)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const handleQcStatus = async (mediaId, status) => {
    try {
      await updateQcStatus(queue.id, mediaId, status)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const handleCancel = async () => {
    try {
      await cancelQueue(queue.id)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const handleReopen = async () => {
    try {
      await reopenQueue(queue.id)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const clearError = () => setError(null)

  return { liveQueue, media, loading, error, clearError, handleTag, handleQcStatus, handleDelete, handleFirstApproval, handleClose, handleCancel, handleReopen }
}
