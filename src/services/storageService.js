import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase/firebase.js'

/**
 * Upload a File/Blob to Firebase Storage under media/{queueId}/.
 * Returns { url, storagePath }.
 */
export async function uploadMedia(queueId, file) {
  const ext      = file.name?.split('.').pop() || (file.type?.startsWith('video') ? 'mp4' : 'jpg')
  const filename = `${Date.now()}.${ext}`
  const path     = `media/${queueId}/${filename}`
  const fileRef  = ref(storage, path)

  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)

  return { url, storagePath: path }
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
