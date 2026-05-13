import { useLang } from '../contexts/LangContext.jsx'
import QcStatusIcon, { QC_STATUS_BG } from './QcStatusIcon.jsx'
import { formatTime, daysUntilExpiry } from '../utils/dateUtils.js'

export default function MediaCard({ item, index, onPreview, onTag, canEdit }) {
  const { t } = useLang()
  const expiryDays = item.type === 'video' ? daysUntilExpiry(item.takenAt) : null
  const isExpired  = expiryDays !== null && expiryDays <= 0

  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <button
        onClick={() => onPreview(index)}
        className="absolute inset-0 active:opacity-80 transition-opacity bg-gray-100"
        aria-label="preview"
      >
        {item.type === 'video' ? (
          <>
            <video
              src={item.url}
              className="absolute inset-0 w-full h-full object-cover"
              preload="metadata"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            {item.duration && (
              <span className="absolute bottom-6 right-1.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                {item.duration}
              </span>
            )}
          </>
        ) : (
          <img
            src={item.url}
            alt={`media ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        <span className="absolute top-1.5 right-1.5 bg-black/30 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full">
          {formatTime(item.takenAt)}
        </span>

        {item.type === 'video' && expiryDays !== null && expiryDays <= 5 && (
          <span className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
            isExpired ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'
          }`}>
            {isExpired ? t.expired : t.videoExpiry(expiryDays)}
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent rounded-b-2xl"/>
      </button>

      <button
        onClick={() => onTag(item)}
        className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5"
        aria-label="tag"
      >
        {item.takenByRole === 'qc' ? (
          <div className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded-full ${QC_STATUS_BG[item.qcStatus || 'pending']}`}>
            <QcStatusIcon status={item.qcStatus || 'pending'} size={10}/>
          </div>
        ) : item.productType ? (
          <span className={`block text-white text-[10px] font-semibold px-2 py-0.5 rounded-full truncate text-center ${
            canEdit ? 'bg-[#06C755]' : 'bg-[#06C755]/70'
          }`}>
            {item.productType}
          </span>
        ) : (
          <span className={`block text-white text-[10px] font-semibold px-2 py-0.5 rounded-full text-center ${
            canEdit ? 'bg-orange-500' : 'bg-orange-400/70'
          }`}>
            {canEdit ? t.notTagged : t.noType}
          </span>
        )}
      </button>
    </div>
  )
}
