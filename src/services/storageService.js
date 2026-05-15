import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase/firebase.js'

/**
 * Upload a File/Blob to Firebase Storage with resumable upload.
 * Path: media/[YYYY-MM-DD]/[filename]
 * @param {File} file
 * @param {(pct: number) => void} [onProgress] - called with 0–100
 * Returns { url, storagePath }.
 */
export function uploadMedia(file, onProgress, onPaused) {
  const ext      = file.name?.split('.').pop() || (file.type?.startsWith('video') ? 'mp4' : 'jpg')
  const filename = `${Date.now()}.${ext}`
  const yyyyMmDd = new Date().toISOString().slice(0, 10)
  const path     = `media/${yyyyMmDd}/${filename}`
  const fileRef  = ref(storage, path)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, file)

    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.state === 'paused') {
          // Network dropped — Firebase SDK will auto-retry when connectivity returns
          onPaused?.(true)
        } else {
          onPaused?.(false)
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          onProgress?.(pct)
        }
      },
      (err) => { onPaused?.(false); reject(err) },
      async () => {
        try {
          onPaused?.(false)
          const url = await getDownloadURL(task.snapshot.ref)
          resolve({ url, storagePath: path })
        } catch (err) {
          reject(err)
        }
      },
    )
  })
}

/**
 * Delete a file from Firebase Storage by its storage path.
 * Silently ignores "object not found" errors.
 */
export async function deleteStorageFile(storagePath) {
  if (!storagePath) return
  try {
    await deleteObject(ref(storage, storagePath))
  } catch (err) {
    if (err.code !== 'storage/object-not-found') throw err
  }
}
