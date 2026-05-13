import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import { useQueueList } from '../hooks/useQueueList.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import QueueItem from '../components/QueueItem.jsx'
import ProfileModal from '../components/ProfileModal.jsx'
import NewQueueModal from '../components/NewQueueModal.jsx'

export default function QueueListPage({ user, onSelectQueue, onLogout, onExport }) {
  const { t, lang, toggleLang } = useLang()
  const [showModal,   setShowModal]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const {
    queues, loading,
    search, setSearch,
    filter, setFilter,
    handleCreate,
    handleTogglePin,
  } = useQueueList()

  const TABS = [
    ['all',           t.filterAll],
    ['open',          t.filterOpen],
    ['pending_close', t.filterPendingClose],
    ['closed',        t.filterClosed],
    ['cancelled',     t.filterCancelled],
  ]

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7FA] overflow-hidden relative">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-0 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t.queueListTitle}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
            >
              {lang === 'th' ? 'EN' : 'TH'}
            </button>
            {user?.role !== 'qc' && (
              <button
                onClick={() => setShowModal(true)}
                className="w-8 h-8 bg-[#06C755] rounded-xl flex items-center justify-center shadow-sm shadow-green-200 active:scale-90 transition-transform"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowProfile(true)}
              title="โปรไฟล์"
              className="w-8 h-8 bg-[#06C755]/10 rounded-xl flex items-center justify-center active:bg-[#06C755]/20 transition-colors"
            >
              <span className="text-xs font-bold text-[#06C755]">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-[#F5F7FA] rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex">
          {TABS.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                filter === val
                  ? 'text-[#06C755] border-[#06C755]'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pt-3 pb-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner className="w-7 h-7 text-[#06C755]"/>
          </div>
        ) : queues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1">
              <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="mt-3 text-sm text-gray-400">{t.noQueues}</p>
          </div>
        ) : (
          queues.map(queue => (
            <QueueItem
              key={queue.id}
              queue={queue}
              onSelect={onSelectQueue}
              onTogglePin={handleTogglePin}
            />
          ))
        )}
      </div>

      {showModal && (
        <NewQueueModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
          onExport={onExport}
        />
      )}
    </div>
  )
}
