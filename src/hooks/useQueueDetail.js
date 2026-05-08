import { useState, useEffect } from 'react'
import {
  subscribeMedia,
  tagMedia,
  deleteMedia,
  syncHasUntagged,
} from '../services/mediaService.js'
import { deleteStorageFile } from '../services/storageService.js'
import { closeQueue } from '../services/queueService.js'

/**
 * Controller hook for the queue detail screen.
 * Subscribes to the media subcollection in real-time; exposes action handlers.
 */
export function useQueueDetail(queue) {
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
      if (item.storagePath) await deleteStorageFile(item.storagePath)
      await deleteMedia(queue.id, mediaId, item.type)
      const remaining = media.filter(m => m.id !== mediaId)
      await syncHasUntagged(queue.id, remaining)
    } catch (err) {
      console.error('handleDelete:', err)
      setError(err.message)
    }
  }

  const handleClose = async () => {
    try {
      await closeQueue(queue.id)
    } catch (err) {
      console.error('handleClose:', err)
      setError(err.message)
    }
  }

  return { media, loading, error, handleTag, handleDelete, handleClose }
}
