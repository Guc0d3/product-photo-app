import { useLang } from '../contexts/LangContext.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function QueueConfirmModals({
  q, submitting, isPendingClose, isAdmin, untaggedCount,
  showFirstApprove, showClose, showReopen, showCancel,
  onHideFirstApprove, onHideClose, onHideReopen, onHideCancel,
  onFirstApprove, onClose, onReopen, onCancel,
}) {
  const { t } = useLang()

  return (
    <>
      {/* First Approval confirm */}
      {showFirstApprove && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-[#F0FDF4] rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t.firstApproveTitle}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t.firstApproveBody}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={onHideFirstApprove} disabled={submitting}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-40"
              >
                {t.cancel}
              </button>
              <button onClick={onFirstApprove} disabled={submitting}
                className="flex-1 bg-[#06C755] text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-green-200 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
                  : t.confirmFirstApprove}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Queue confirm */}
      {showClose && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <h3 className="font-bold text-gray-900 text-base">
              {isPendingClose ? t.closeQueueStep2Title : t.closeQueueTitle}
            </h3>
            <p className="text-sm text-gray-500 mt-1.5">
              {isPendingClose && q?.firstApproval
                ? t.closeQueueStep2Body(q?.firstApproval?.displayName ?? '...')
                : untaggedCount > 0
                  ? t.closeQueueBodyUntagged(untaggedCount)
                  : t.closeQueueBody}
            </p>
            {!isPendingClose && untaggedCount > 0 && (
              <p className="text-xs text-orange-400 mt-1">{t.closeQueueHint(isAdmin)}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={onHideClose} disabled={submitting}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-40"
              >
                {t.cancel}
              </button>
              <button onClick={onClose} disabled={submitting}
                className="flex-1 bg-[#06C755] text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-green-200 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
                  : t.confirmClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen confirm */}
      {showReopen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t.reopenQueueTitle}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t.reopenQueueBody}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={onHideReopen} disabled={submitting}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-40"
              >
                {t.cancel}
              </button>
              <button onClick={onReopen} disabled={submitting}
                className="flex-1 bg-blue-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
                  : t.confirmReopen}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {showCancel && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl p-5 w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t.cancelQueueTitle}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t.cancelQueueBody}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={onHideCancel} disabled={submitting}
                className="flex-1 bg-gray-100 rounded-2xl py-3 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-40"
              >
                {t.cancel}
              </button>
              <button onClick={onCancel} disabled={submitting}
                className="flex-1 bg-red-500 text-white rounded-2xl py-3 text-sm font-semibold shadow-lg shadow-red-200 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner className="w-4 h-4" stroke="white"/></span>
                  : t.confirmCancelQueue}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
