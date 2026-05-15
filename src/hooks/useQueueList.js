import { useState, useEffect } from 'react'
import {
  subscribeQueues,
  createQueue,
  togglePin,
} from '../services/queueService.js'
import { getTodayPrefix } from '../utils/dateUtils.js'

// Date range options: value = days back (0 = today only, null = all time)
export const DATE_RANGE_OPTIONS = [
  { value: 0,    labelKey: 'dateRangeToday' },
  { value: 7,    labelKey: 'dateRange7Days' },
  { value: 30,   labelKey: 'dateRange30Days' },
  { value: null, labelKey: 'dateRangeAll' },
]

function getStartDate(rangeDays) {
  if (rangeDays === null) return null
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - rangeDays)
  return d
}

/**
 * Controller hook for the queue list screen.
 * Subscribes to Firestore in real-time; exposes filtered/sorted queues
 * and action handlers.
 */
export function useQueueList() {
  const [queues, setQueues]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')
  const [dateRange, setDateRange] = useState(0)   // default: today only

  // ── real-time subscription ──────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    const startDate = getStartDate(dateRange)
    const unsubscribe = subscribeQueues(
      (data) => { setQueues(data); setLoading(false) },
      ()     => setLoading(false),
      startDate,
    )
    return () => unsubscribe()
  }, [dateRange])

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
    await createQueue({ queueNumber, supplier, note })
  }

  const handleTogglePin = async (queueId, currentPinned) => {
    await togglePin(queueId, !currentPinned).catch(() => {})
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
    search,  setSearch,
    filter,  setFilter,
    dateRange, setDateRange,
    handleCreate,
    handleTogglePin,
  }
}
