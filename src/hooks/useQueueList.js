import { useState, useEffect } from 'react'
import {
  subscribeQueues,
  createQueue,
  togglePin,
} from '../services/queueService.js'
import { getTodayPrefix } from '../utils/dateUtils.js'

/**
 * Controller hook for the queue list screen.
 * Subscribes to Firestore in real-time; exposes filtered/sorted queues
 * and action handlers.
 */
export function useQueueList() {
  const [queues, setQueues]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')

  // ── real-time subscription ──────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeQueues(
      (data) => { setQueues(data); setLoading(false) },
      ()     => setLoading(false),
    )
    return () => unsubscribe()
  }, [])

  // ── actions ─────────────────────────────────────────────────────────────

  /**
   * ตรวจว่า queueNumber ซ้ำกับใบที่สร้างวันนี้หรือไม่
   * เปรียบเทียบกับ code prefix RI{YYYYMMDD} เพราะ queues โหลดไว้ใน state แล้ว
   */
  function isDuplicateToday(queueNumber) {
    const prefix = getTodayPrefix()
    return queues.some(
      q => q.queueNumber === queueNumber && q.code?.startsWith(prefix),
    )
  }

  /**
   * สร้างใบรับสินค้าใหม่
   * throw 'duplicateQueueNumber' ถ้าคิวซ้ำในวันเดียวกัน
   */
  const handleCreate = async ({ queueNumber, supplier, note }) => {
    if (isDuplicateToday(queueNumber)) {
      throw new Error('duplicateQueueNumber')
    }
    try {
      await createQueue({ queueNumber, supplier, note })
    } catch (err) {
      console.error('createQueue:', err)
      setError(err.message)
      throw err
    }
  }

  const handleTogglePin = async (queueId, currentPinned) => {
    try {
      await togglePin(queueId, !currentPinned)
    } catch (err) {
      console.error('togglePin:', err)
      setError(err.message)
    }
  }

  // ── derived data ─────────────────────────────────────────────────────────
  const filtered = queues.filter((q) => {
    const term = search.toLowerCase()
    const matchSearch = !term ||
      q.code?.toLowerCase().includes(term) ||
      q.supplier?.toLowerCase().includes(term) ||
      q.queueNumber?.includes(term)
    const matchFilter =
      filter === 'all' ||
      (filter === 'open'          && q.status === 'open') ||
      (filter === 'pending_close' && q.status === 'pending_close') ||
      (filter === 'closed'        && q.status === 'closed') ||
      (filter === 'cancelled'     && q.status === 'cancelled')
    return matchSearch && matchFilter
  })

  // Pinned queues always appear first
  const sorted = [
    ...filtered.filter(q =>  q.pinned),
    ...filtered.filter(q => !q.pinned),
  ]

  return {
    queues:  sorted,
    loading,
    error,
    search,  setSearch,
    filter,  setFilter,
    handleCreate,
    handleTogglePin,
  }
}
