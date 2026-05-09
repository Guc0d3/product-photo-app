import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, increment,
} from 'firebase/firestore'
import { db, auth } from '../firebase/firebase.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function toMedia(snap) {
  const d = snap.data()
  return {
    id: snap.id,
    ...d,
    takenAt: d.takenAt?.toDate() ?? null,
  }
}

// ── read ──────────────────────────────────────────────────────────────────────

/**
 * Realtime subscription to all media in a queue, ordered oldest-first.
 * Returns unsubscribe function.
 */
export function subscribeMedia(queueId, onData, onError) {
  const q = query(
    collection(db, 'queues', queueId, 'media'),
    orderBy('takenAt', 'asc'),
  )
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(toMedia)),
    (err)  => { console.error('subscribeMedia:', err); onError?.(err) },
  )
}

// ── write ─────────────────────────────────────────────────────────────────────

/**
 * Add a media item to a queue and increment the relevant counter on the queue doc.
 */
export async function addMedia(queueId, { url, storagePath, type, duration }) {
  const uid         = auth.currentUser?.uid
  const takenByName = auth.currentUser?.displayName || auth.currentUser?.email || uid
  if (!uid) throw new Error('Not authenticated')

  const ref = await addDoc(collection(db, 'queues', queueId, 'media'), {
    url,
    storagePath,
    type,
    duration:    duration ?? null,
    productType: null,
    takenBy:     uid,
    takenByName,
    takenAt:     serverTimestamp(),
  })

  const countField = type === 'video' ? 'videoCount' : 'photoCount'
  await updateDoc(doc(db, 'queues', queueId), {
    [countField]: increment(1),
    hasUntagged:  true,
    lastMediaAt:  serverTimestamp(),
    updatedAt:    serverTimestamp(),
  })

  return ref.id
}

/**
 * Update the product type tag on a single media item.
 */
export async function tagMedia(queueId, mediaId, productType) {
  await updateDoc(doc(db, 'queues', queueId, 'media', mediaId), { productType })
}

/**
 * Delete a media document and decrement the queue's count.
 * Storage file deletion is handled by the caller.
 */
export async function deleteMedia(queueId, mediaId, type) {
  await deleteDoc(doc(db, 'queues', queueId, 'media', mediaId))
  const countField = type === 'video' ? 'videoCount' : 'photoCount'
  await updateDoc(doc(db, 'queues', queueId), {
    [countField]: increment(-1),
    updatedAt:    serverTimestamp(),
  })
}

/**
 * Sync the queue's hasUntagged flag based on the current in-memory media list.
 */
export async function syncHasUntagged(queueId, mediaItems) {
  const hasUntagged = mediaItems.some(m => !m.productType)
  await updateDoc(doc(db, 'queues', queueId), { hasUntagged, updatedAt: serverTimestamp() })
}
