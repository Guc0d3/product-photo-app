import { useLang } from '../contexts/LangContext.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import MediaCard from './MediaCard.jsx'
import { VIDEO_EXPIRY_DAYS } from '../utils/dateUtils.js'

export default function MediaGrid({ loading, sortedMedia, images, videos, groupBy, canEditItem, onPreview, onTag }) {
  const { t } = useLang()

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-3 flex justify-center py-20">
        <LoadingSpinner className="w-7 h-7 text-[#06C755]"/>
      </div>
    )
  }

  if (sortedMedia.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-3 flex flex-col items-center justify-center py-20 text-gray-300">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1">
            <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-400">{t.noMedia}</p>
        <p className="text-xs text-gray-300 mt-1">{t.noMediaHint}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {!groupBy ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {sortedMedia.map((item, i) => (
            <MediaCard key={item.id} item={item} index={i}
              onPreview={onPreview}
              onTag={onTag}
              canEdit={canEditItem(item)}
            />
          ))}
        </div>
      ) : (
        <>
          {images.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                  <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.imagesGroup(images.length)}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {images.map(item => {
                  const idx = sortedMedia.findIndex(m => m.id === item.id)
                  return <MediaCard key={item.id} item={item} index={idx} onPreview={onPreview} onTag={onTag} canEdit={canEditItem(item)}/>
                })}
              </div>
            </div>
          )}
          {videos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2">
                  <path strokeLinecap="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t.videosGroup(videos.length)}</span>
                <span className="text-xs text-gray-300">{t.videoExpiryLabel(VIDEO_EXPIRY_DAYS)}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {videos.map(item => {
                  const idx = sortedMedia.findIndex(m => m.id === item.id)
                  return <MediaCard key={item.id} item={item} index={idx} onPreview={onPreview} onTag={onTag} canEdit={canEditItem(item)}/>
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
