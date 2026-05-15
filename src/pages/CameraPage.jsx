import { useState, useRef } from 'react'
import { useLang } from '../contexts/LangContext.jsx'
import { useCamera } from '../hooks/useCamera.js'
import { uploadMedia } from '../services/storageService.js'
import { addMedia } from '../services/mediaService.js'
import { compressVideo } from '../services/videoCompressService.js'

export default function CameraPage({ queue, user, onBack, onPhotoTaken }) {
  const { t } = useLang()

  const [phase,        setPhase]        = useState('viewfinder') // 'viewfinder' | 'preview'
  const [capturedFile, setCapturedFile] = useState(null)
  const [previewUrl,   setPreviewUrl]   = useState(null)
  const [flash,        setFlash]        = useState(false)
  const [facingMode,   setFacingMode]   = useState('environment')
  const [uploading,      setUploading]      = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError,    setUploadError]    = useState(null)
  const [compressing,    setCompressing]    = useState(false)
  const [compressProgress, setCompressProgress] = useState(0)

  const fileInputRef      = useRef(null)
  const videoInputRef     = useRef(null)

  const { videoRef, error, ready, handleVideoReady, capture } = useCamera(facingMode)

  // ── capture ────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!ready) return
    setFlash(true)
    setTimeout(() => setFlash(false), 150)
    try {
      const file = await capture()
      const url  = URL.createObjectURL(file)
      setCapturedFile(file)
      setPreviewUrl(url)
      setPhase('preview')
    } catch {
      // capture failed — user stays on viewfinder and can retry
    }
  }

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setCapturedFile(null)
    setPreviewUrl(null)
    setUploadError(null)
    setUploadProgress(0)
    setCompressProgress(0)
    setPhase('viewfinder')
  }

  // ── pick from library ──────────────────────────────────────────────────────
  const LARGE_FILE_THRESHOLD_MB = 50
  const MAX_VIDEO_SECONDS       = 30

  const getVideoDuration = (file) => new Promise((resolve) => {
    const vid = document.createElement('video')
    vid.preload = 'metadata'
    vid.onloadedmetadata = () => { URL.revokeObjectURL(vid.src); resolve(vid.duration) }
    vid.onerror = () => resolve(null)
    vid.src = URL.createObjectURL(file)
  })

  const handlePickFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    // Check video duration before showing preview
    if (file.type?.startsWith('video')) {
      const duration = await getVideoDuration(file)
      if (duration !== null && duration > MAX_VIDEO_SECONDS) {
        setUploadError(t.videoTooLong(MAX_VIDEO_SECONDS))
        return
      }
    }

    const url = URL.createObjectURL(file)
    setCapturedFile(file)
    setPreviewUrl(url)
    setUploadError(null)
    setPhase('preview')
  }

  const fileSizeMB   = capturedFile ? Math.round(capturedFile.size / (1024 * 1024)) : 0
  const isLargeFile  = fileSizeMB >= LARGE_FILE_THRESHOLD_MB

  const COMPRESS_THRESHOLD_MB = 20   // compress videos larger than this

  const handleConfirm = async () => {
    if (!capturedFile || !queue?.id || uploading || compressing) return
    setUploadError(null)
    setUploadProgress(0)
    setCompressProgress(0)

    let fileToUpload = capturedFile
    const isVideo = capturedFile.type?.startsWith('video')

    // Compress video if large enough to benefit
    if (isVideo && capturedFile.size > COMPRESS_THRESHOLD_MB * 1024 * 1024) {
      setCompressing(true)
      try {
        fileToUpload = await compressVideo(capturedFile, setCompressProgress)
      } catch {
        // Compression failed — fall back to original file
        fileToUpload = capturedFile
      } finally {
        setCompressing(false)
      }
    }

    setUploading(true)
    try {
      const mediaType = isVideo ? 'video' : 'image'
      const { url, storagePath } = await uploadMedia(fileToUpload, setUploadProgress)
      await addMedia(queue.id, { url, storagePath, type: mediaType, role: user?.role })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      onPhotoTaken()
    } catch {
      setUploadError(t.uploadError)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFlipCamera = () => {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment')
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none"/>}

      {/* ── Viewfinder ─────────────────────────────────────────────────────── */}
      {phase === 'viewfinder' && (
        <>
          <div className="flex-1 relative bg-black">
            {error ? (
              /* Permission / error state */
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
                    <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                </div>
                <p className="text-white/80 text-sm text-center leading-relaxed">
                  {t[error] ?? t.cameraError}
                </p>
              </div>
            ) : (
              <>
                {/* Live video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onCanPlay={handleVideoReady}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Loading spinner while stream starts */}
                {!ready && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin w-8 h-8 text-white/50" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
                    </svg>
                  </div>
                )}

                {/* Rule-of-thirds grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/10"/>
                  ))}
                </div>

                {/* Focus brackets */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 relative">
                    <div className="absolute top-0 left-0  w-5 h-5 border-t-2 border-l-2 border-white/80"/>
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/80"/>
                    <div className="absolute bottom-0 left-0  w-5 h-5 border-b-2 border-l-2 border-white/80"/>
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/80"/>
                  </div>
                </div>
              </>
            )}

            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/60 to-transparent">
              <button onClick={onBack} className="active:scale-90">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <p className="text-white text-xs font-medium opacity-90">{queue?.code}</p>
              <button onClick={handleFlipCamera} className="active:scale-90" disabled={!!error}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Video-too-long error toast */}
          {uploadError && (
            <div className="bg-black px-4 pt-2">
              <div className="flex items-center justify-between bg-red-500/20 border border-red-500/40 rounded-xl px-3 py-2">
                <p className="text-red-400 text-xs">{uploadError}</p>
                <button onClick={() => setUploadError(null)} className="text-red-400 ml-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Shutter row */}
          <div className="bg-black px-6 pt-8 pb-safe-8 flex items-center justify-between">

            {/* Gallery / pick from library */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
              aria-label="เลือกรูปจากคลัง"
            >
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="white" stroke="none"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/>
              </svg>
            </button>

            {/* Shutter */}
            <button
              onClick={handleCapture}
              disabled={!ready || !!error}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
            >
              <div className="w-14 h-14 bg-white rounded-full"/>
            </button>

            {/* Record video — invokes native camera in video mode on Android */}
            <button
              onClick={() => videoInputRef.current?.click()}
              className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
              aria-label="ถ่ายวิดีโอ"
            >
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
            </button>

          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handlePickFile}
          />
          {/* capture="camcorder" opens native camera in video mode on Android */}
          {/* max recording time ~60s enforced via accept MIME hint on some browsers */}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            capture="camcorder"
            className="hidden"
            onChange={handlePickFile}
          />
        </>
      )}

      {/* ── Preview ────────────────────────────────────────────────────────── */}
      {phase === 'preview' && (
        <>
          <div className="flex-1 relative bg-black">
            {capturedFile?.type?.startsWith('video') ? (
              <video
                src={previewUrl}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <img
                src={previewUrl}
                alt="captured"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/40 to-transparent">
              <button onClick={handleRetake} disabled={uploading} className="active:scale-90">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className="text-white text-sm font-medium">{t.reviewPhoto}</span>
              <div className="w-6"/>
            </div>
          </div>

          {/* Action row */}
          <div className="bg-black px-6 pt-6 pb-safe-6">
            {uploadError && (
              <p className="text-red-400 text-xs text-center mb-3">{uploadError}</p>
            )}
            {!uploading && isLargeFile && (
              <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-2 mb-3">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth="2" className="flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                <p className="text-amber-400 text-xs">{t.uploadLargeFileWarning(fileSizeMB)}</p>
              </div>
            )}
            {compressing && (
              <div className="mb-3">
                <div className="flex justify-between text-white/60 text-xs mb-1">
                  <span>กำลังบีบอัดวิดีโอ...</span>
                  <span>{compressProgress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${compressProgress}%` }}
                  />
                </div>
              </div>
            )}
            {uploading && (
              <div className="mb-3">
                <div className="flex justify-between text-white/60 text-xs mb-1">
                  <span>{t.uploading}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div
                    className="bg-[#06C755] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            {!uploading && (
              <p className="text-white/60 text-xs text-center mb-4">{t.cameraHint}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                disabled={uploading}
                className="flex-1 border border-white/30 text-white rounded-xl py-3 text-sm font-medium active:bg-white/10 disabled:opacity-40 transition-opacity"
              >
                {t.retake}
              </button>
              <button
                onClick={handleConfirm}
                disabled={uploading || compressing}
                className="flex-1 bg-[#06C755] text-white rounded-xl py-3 text-sm font-semibold active:scale-95 transition-all disabled:opacity-70"
              >
                {compressing ? `บีบอัด ${compressProgress}%` : uploading ? `${uploadProgress}%` : t.usePhoto}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
