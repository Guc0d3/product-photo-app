import { useLang } from '../contexts/LangContext.jsx'
import { parseCode, timeAgo } from '../utils/dateUtils.js'

export default function QueueItem({ queue, onSelect, onTogglePin }) {
  const { t } = useLang()
  const { date, seq } = parseCode(queue.code)

  return (
    <div className="relative group mx-4 mb-2.5">
      <button
        onClick={() => onSelect(queue)}
        className="w-full bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:shadow-[0_1px_4px_rgba(0,0,0,0.08)] active:scale-[0.99] transition-all text-left overflow-hidden"
      >
        {queue.pinned && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#06C755] rounded-l-2xl"/>
        )}

        <div className="flex items-start gap-3 px-4 py-3.5 pr-12">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
            queue.pinned ? 'bg-[#06C755]' : queue.status === 'open' ? 'bg-[#F0FDF4]' : 'bg-gray-50'
          }`}>
            {queue.pinned ? (
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={queue.status === 'open' ? '#06C755' : '#9CA3AF'} strokeWidth="1.8">
                <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400">
                {date}
                <span className="mx-1 text-gray-200">·</span>
                <span className="font-medium text-gray-500">{t.receiptNo} {seq}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {queue.hasUntagged && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"/>}
                <span className="text-[11px] text-gray-400">{timeAgo(queue.lastMediaAt, t)}</span>
              </div>
            </div>

            {queue.queueNumber && (
              <p className="text-[15px] font-semibold text-gray-900 mt-1 leading-tight">
                {t.queueLabel} {queue.queueNumber}
              </p>
            )}

            {queue.supplier && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{queue.supplier}</p>
            )}

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                queue.status === 'open'          ? 'bg-[#DCFCE7] text-[#16A34A]' :
                queue.status === 'pending_close' ? 'bg-amber-50 text-amber-600' :
                queue.status === 'cancelled'     ? 'bg-red-50 text-red-400' :
                                                   'bg-gray-100 text-gray-400'
              }`}>
                {queue.status === 'open'          ? t.statusOpen :
                 queue.status === 'pending_close' ? t.statusPendingClose :
                 queue.status === 'cancelled'     ? t.statusCancelled :
                                                    t.statusClosed}
              </span>
              {queue.photoCount > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                  {queue.photoCount}
                </span>
              )}
              {queue.videoCount > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  {queue.videoCount}
                </span>
              )}
              {queue.note && (
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full truncate max-w-[90px]">
                  {queue.note}
                </span>
              )}
              {queue.pinned && (
                <span className="text-[11px] font-semibold text-[#06C755]">{t.pinned}</span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Pin button */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(queue.id, queue.pinned) }}
        className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
          queue.pinned
            ? 'bg-[#06C755]/10'
            : 'bg-gray-50 opacity-0 group-hover:opacity-100 group-active:opacity-100'
        }`}
        aria-label={queue.pinned ? 'ถอดหมุด' : 'ปักหมุด'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill={queue.pinned ? '#06C755' : 'none'}
          stroke={queue.pinned ? '#06C755' : '#9CA3AF'} strokeWidth="2"
        >
          <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z"/>
          <circle cx="12" cy="8" r="2"
            fill={queue.pinned ? 'white' : 'none'}
            stroke={queue.pinned ? '#06C755' : '#9CA3AF'}
          />
        </svg>
      </button>
    </div>
  )
}
