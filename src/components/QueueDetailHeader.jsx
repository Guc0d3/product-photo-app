import { useLang } from '../contexts/LangContext.jsx'

export default function QueueDetailHeader({
  queue, q,
  isAdmin, isQcUser,
  isCancelled, isPendingClose, isAlreadyFirstApprover, canCloseQueue,
  images, videos, untaggedCount,
  sortAsc, groupBy,
  onBack, onSortToggle, onGroupToggle,
  onShowFirstApprove, onShowClose, onShowCancel, onShowReopen,
}) {
  const { t } = useLang()

  return (
    <>
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
                    onClick={onShowCancel}
                    className="text-xs font-semibold text-red-400 bg-red-50 px-3 py-1.5 rounded-xl active:bg-red-100 transition-colors"
                  >
                    {t.cancelQueue}
                  </button>
                )}
                {canCloseQueue && (
                  <button
                    onClick={onShowFirstApprove}
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
                      onClick={onShowClose}
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
                onClick={onShowReopen}
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={onSortToggle}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors bg-gray-100 text-gray-500"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                {sortAsc ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10 4l-4-4m4 4l4-4"/>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m10 0l-4 4m4-4l4 4"/>
                )}
              </svg>
              {sortAsc ? t.sortOldToNew : t.sortNewToOld}
            </button>
            <button
              onClick={onGroupToggle}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                groupBy ? 'bg-[#06C755] text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t.groupByType}
            </button>
          </div>
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
            {isAlreadyFirstApprover ? t.alreadyApproved : t.waitingSecondApproval}
          </p>
        </div>
      )}
    </>
  )
}
