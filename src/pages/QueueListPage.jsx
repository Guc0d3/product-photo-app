import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'

function generateQueueCode(existingQueues) {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateStr = `${y}${m}${d}`
  const prefix = `RI${dateStr}-`
  const todayCodes = existingQueues.filter(q => q.code.startsWith(prefix))
  return `${prefix}${String(todayCodes.length + 1).padStart(3, '0')}`
}

function parseCode(code) {
  const m = code.match(/^RI(\d{4})(\d{2})(\d{2})-(\d+)$/)
  if (!m) return { date: '', seq: code }
  return { date: `${m[3]}-${m[2]}-${m[1]}`, seq: m[4] }
}

const QUEUE_ALLOWED = /^[0-9.,\-+]*$/

const MOCK_QUEUES = [
  { id: 'q001', code: 'RI20240507-001', queue: '1', supplier: 'บริษัท ABC จำกัด', note: '', photoCount: 8, videoCount: 2, lastPhotoAt: new Date(Date.now() - 2 * 60000), status: 'open', hasUntagged: true, pinned: true, createdAt: new Date() },
  { id: 'q002', code: 'RI20240507-002', queue: '2', supplier: 'ห้างหุ้นส่วน XYZ', note: 'สินค้าแช่เย็น', photoCount: 7, videoCount: 0, lastPhotoAt: new Date(Date.now() - 60 * 60000), status: 'open', hasUntagged: false, pinned: false, createdAt: new Date() },
  { id: 'q003', code: 'RI20240506-003', queue: '3', supplier: 'บริษัท 123 คอร์ป', note: '', photoCount: 23, videoCount: 1, lastPhotoAt: new Date(Date.now() - 25 * 3600000), status: 'closed', hasUntagged: false, pinned: false, createdAt: new Date(Date.now() - 86400000) },
  { id: 'q004', code: 'RI20240507-003', queue: '4', supplier: 'นายสมศรี ค้าส่ง', note: '', photoCount: 0, videoCount: 0, lastPhotoAt: null, status: 'open', hasUntagged: false, pinned: false, createdAt: new Date() },
  { id: 'q005', code: 'RI20240507-004', queue: '5', supplier: 'บริษัท DEF ซัพพลาย', note: 'ด่วน', photoCount: 5, videoCount: 0, lastPhotoAt: new Date(Date.now() - 3 * 3600000), status: 'open', hasUntagged: true, pinned: false, createdAt: new Date() },
]

function timeAgo(date, t) {
  if (!date) return t.justNow
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t.justNow
  if (mins < 60) return t.minutesAgo(mins)
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t.hoursAgo(hours)
  const days = Math.floor(hours / 24)
  if (days === 1) return t.yesterday
  return t.daysAgo(days)
}

function NewQueueModal({ onClose, onCreate, existingQueues }) {
  const { t } = useLang()
  const [queueNum, setQueueNum] = useState('')
  const [supplier, setSupplier] = useState('')
  const [note, setNote] = useState('')
  const [queueError, setQueueError] = useState('')
  const previewCode = generateQueueCode(existingQueues)

  const handleQueueChange = (val) => {
    if (val === '' || QUEUE_ALLOWED.test(val)) { setQueueNum(val); setQueueError('') }
    else setQueueError(t.queueInvalid)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!queueNum.trim()) { setQueueError(t.queueRequired); return }
    onCreate({ queue: queueNum, supplier, note })
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="w-full bg-white rounded-t-2xl" onClick={e => e.stopPropagation()}>
        <div className="pt-3 pb-1 flex flex-col items-center">
          <div className="w-10 h-1 bg-gray-300 rounded-full"/>
        </div>
        <div className="px-5 pb-8">
          <div className="mb-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#06C755" strokeWidth="1.8">
              <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <div>
              <p className="text-xs text-gray-500">{t.autoCode}</p>
              <p className="text-sm font-bold text-[#06C755] font-mono">{previewCode}</p>
            </div>
          </div>

          <h2 className="text-base font-semibold text-gray-800 mb-4">{t.newQueueTitle}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.queueLabel} <span className="text-red-500">*</span>
                <span className="ml-1 text-gray-400 font-normal">{t.queueHint}</span>
              </label>
              <input autoFocus value={queueNum} onChange={e => handleQueueChange(e.target.value)}
                placeholder={t.queuePlaceholder} inputMode="numeric"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] bg-gray-50 ${queueError ? 'border-red-400' : 'border-gray-200'}`}
              />
              {queueError && <p className="text-xs text-red-500 mt-1">{queueError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.supplierLabel}</label>
              <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder={t.supplierPlaceholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.noteLabel}</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t.notePlaceholder} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#06C755] bg-gray-50 resize-none"
              />
            </div>
            <button type="submit" className="w-full bg-[#06C755] text-white rounded-xl py-3 font-semibold text-sm mt-1 active:scale-95 transition-transform">
              {t.createQueue}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function QueueItem({ queue, onSelect, onTogglePin }) {
  const { t } = useLang()
  const { date, seq } = parseCode(queue.code)

  return (
    <div className="relative bg-white border-b border-gray-100 group">
      <button
        onClick={() => onSelect(queue)}
        className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left pr-12"
      >
        {/* Icon */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
          queue.pinned ? 'bg-[#06C755]' : queue.status === 'open' ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          {queue.pinned ? (
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={queue.status === 'open' ? '#06C755' : '#9CA3AF'} strokeWidth="1.5">
              <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Line 1 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">
              {date}
              <span className="text-gray-400 font-normal"> {t.receiptNo} </span>
              <span className="font-semibold">{seq}</span>
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              {queue.hasUntagged && <span className="w-2 h-2 bg-orange-500 rounded-full"/>}
              <span className="text-xs text-gray-400">{timeAgo(queue.lastPhotoAt, t)}</span>
            </div>
          </div>
          {/* Line 2 */}
          {queue.queue && <p className="text-sm text-gray-700 mt-0.5">{t.queueLabel} {queue.queue}</p>}
          {/* Line 3 */}
          {queue.supplier && queue.supplier !== '-' && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{queue.supplier}</p>
          )}
          {/* Line 4 */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              queue.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {queue.status === 'open' ? t.statusOpen : t.statusClosed}
            </span>
            {queue.photoCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                {queue.photoCount}
              </span>
            )}
            {queue.videoCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                {queue.videoCount}
              </span>
            )}
            {queue.note && <span className="text-xs text-gray-400 truncate max-w-[100px]">{queue.note}</span>}
            {queue.pinned && (
              <span className="text-xs text-[#06C755] font-medium">{t.pinned}</span>
            )}
          </div>
        </div>
      </button>

      {/* Pin button — always visible on right */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(queue.id) }}
        className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          queue.pinned
            ? 'bg-[#06C755]/10 text-[#06C755]'
            : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 group-active:opacity-100'
        }`}
        aria-label={queue.pinned ? 'ถอดหมุด' : 'ปักหมุด'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={queue.pinned ? '#06C755' : 'none'} stroke={queue.pinned ? '#06C755' : '#9CA3AF'} strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z"/>
          <circle cx="12" cy="8" r="2" fill={queue.pinned ? 'white' : 'none'} stroke={queue.pinned ? '#06C755' : '#9CA3AF'}/>
        </svg>
      </button>
    </div>
  )
}

export default function QueueListPage({ user, onSelectQueue }) {
  const { t, lang, toggleLang } = useLang()
  const [queues, setQueues] = useState(MOCK_QUEUES)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  const handleCreate = ({ queue, supplier, note }) => {
    const code = generateQueueCode(queues)
    setQueues(prev => [{
      id: `q${Date.now()}`, code, queue, supplier: supplier || '-', note: note || '',
      photoCount: 0, videoCount: 0, lastPhotoAt: null,
      status: 'open', hasUntagged: false, pinned: false, createdAt: new Date(),
    }, ...prev])
  }

  const handleTogglePin = (id) => {
    setQueues(prev => prev.map(q => q.id === id ? { ...q, pinned: !q.pinned } : q))
  }

  const filtered = queues.filter(q => {
    const matchSearch =
      q.code.toLowerCase().includes(search.toLowerCase()) ||
      q.supplier.includes(search) ||
      q.queue.includes(search)
    const matchFilter = filter === 'all' || q.status === filter
    return matchSearch && matchFilter
  })

  // Pinned first
  const sorted = [
    ...filtered.filter(q => q.pinned),
    ...filtered.filter(q => !q.pinned),
  ]

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F5] overflow-hidden relative">
      {/* Header */}
      <div className="bg-[#06C755] text-white px-4 pt-12 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold">{t.queueListTitle}</h1>
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <button
              onClick={toggleLang}
              className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full active:bg-white/30"
            >
              {lang === 'th' ? 'EN' : 'TH'}
            </button>
            <button onClick={() => setShowModal(true)}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center active:bg-white/30"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">{user?.displayName?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>

        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder}
            className="w-full bg-white/20 text-white placeholder-white/60 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:bg-white/30"
          />
        </div>

        <div className="flex gap-1 pb-0">
          {[['all', t.filterAll], ['open', t.filterOpen], ['closed', t.filterClosed]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                filter === val ? 'bg-[#F5F5F5] text-[#06C755]' : 'text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="mt-2 text-sm">{t.noQueues}</p>
          </div>
        ) : (
          sorted.map(queue => (
            <QueueItem key={queue.id} queue={queue} onSelect={onSelectQueue} onTogglePin={handleTogglePin} />
          ))
        )}
      </div>

      {showModal && (
        <NewQueueModal onClose={() => setShowModal(false)} onCreate={handleCreate} existingQueues={queues} />
      )}
    </div>
  )
}
