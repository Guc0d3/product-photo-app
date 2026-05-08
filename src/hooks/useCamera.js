import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Hook that manages a getUserMedia camera stream.
 *
 * Returns:
 *   videoRef        — attach to <video ref={videoRef}>
 *   error           — null | string key ('cameraPermissionDenied' | 'cameraError')
 *   ready           — true when the video element is playing
 *   handleVideoReady — pass to <video onCanPlay={handleVideoReady}>
 *   capture         — async () => File (JPEG)
 */
export function useCamera(facingMode = 'environment') {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const [error,  setError]  = useState(null)
  const [ready,  setReady]  = useState(false)

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('cameraNotSupported')
        return
      }

      // Try ideal constraints first; fall back to bare `video: true`
      const constraints = [
        { video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
        { video: true, audio: false },
      ]

      let lastErr = null
      for (const c of constraints) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(c)
          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
          streamRef.current = stream
          if (videoRef.current) videoRef.current.srcObject = stream
          setError(null)
          return          // success — stop trying
        } catch (err) {
          lastErr = err
        }
      }

      // All attempts failed
      if (!cancelled) {
        console.error('getUserMedia:', lastErr)
        if (lastErr.name === 'NotAllowedError')  setError('cameraPermissionDenied')
        else if (lastErr.name === 'NotFoundError') setError('cameraNotFound')
        else setError('cameraError')
      }
    }

    start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setReady(false)
    }
  }, [facingMode])

  /** Call this via <video onCanPlay={handleVideoReady}> */
  const handleVideoReady = useCallback(() => setReady(true), [])

  /** Capture current frame as a JPEG File */
  const capture = useCallback(async () => {
    const video = videoRef.current
    if (!video) throw new Error('No video element')
    const canvas  = document.createElement('canvas')
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0)
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob
          ? resolve(new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' }))
          : reject(new Error('toBlob failed')),
        'image/jpeg',
        0.92,
      )
    })
  }, [])

  return { videoRef, error, ready, handleVideoReady, capture }
}
