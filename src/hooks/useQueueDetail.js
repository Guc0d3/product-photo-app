import { useState, useEffect } from 'react'
import {
  subscribeMedia,
  tagMedia,
  updateQcStatus,
  deleteMedia,
  syncHasUntagged,
} from '../services/mediaService.js'
import { deleteStorageFile } from '../services/storageService.js'
import { firstApproveQueue, closeQueue, cancelQueue, reopenQueue } from '../services/queueService.js'

/**
 * Controller hook for the queue detail screen.
 * Subscribes to the media subcollection in real-time; exposes action handlers.
 */
export function useQueueDetail(queue, user) {
  const [media,   setMedia]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── real-time subscription ──────────────────────────────────────────────
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
    } catch (err) {
      console.error('handleTag:', err)
      setError(err.message)
    }
  }

  const handleDelete = async (mediaId) => {
    try {
      const item = media.find(m => m.id === mediaId)
      if (!item) return

      // 1. Delete Firestore doc first → onSnapshot fires → UI updates immediately
      await deleteMedia(queue.id, mediaId, item.type)
      const remaining = media.filter(m => m.id !== mediaId)
      await syncHasUntagged(queue.id, remaining)

      // 2. Delete Storage file in background — CORS or network failures won't block UI
      if (item.storagePath) {
        deleteStorageFile(item.storagePath).catch(err =>
          console.warn('Storage delete failed (non-blocking):', err)
        )
      }
    } catch (err) {
      console.error('handleDelete:', err)
      setError(err.message)
    }
  }

  const handleFirstApproval = async () => {
    try {
      await firstApproveQueue(queue.id, user)
    } catch (err) {
      console.error('handleFirstApproval:', err)
      setError(err.message)
    }
  }

  const handleClose = async () => {
    try {
      await closeQueue(queue.id, user)
    } catch (err) {
      console.error('handleClose:', err)
      setError(err.message)
    }
  }

  const handleQcStatus = async (mediaId, status) => {
    try {
      await updateQcStatus(queue.id, mediaId, status)
    } catch (err) {
      console.error('handleQcStatus:', err)
      setError(err.message)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelQueue(queue.id)
    } catch (err) {
      console.error('handleCancel:', err)
      setError(err.message)
    }
  }

  const handleReopen = async () => {
    try {
      await reopenQueue(queue.id)
    } catch (err) {
      console.error('handleReopen:', err)
      setError(err.message)
    }
  }

  return { media, loading, error, handleTag, handleQcStatus, handleDelete, handleFirstApproval, handleClose, handleCancel, handleReopen }
}
