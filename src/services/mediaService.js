import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, increment,
} from 'firebase/firestore'
import { db, auth } from '../firebase/firebase.js'

/**
 * Enqueue a Storage file path for deletion by the Cloud Function.
 * Client never deletes Storage directly — the scheduled function processes this queue.
 */
async function enqueueStorageDelete(storagePath) {
  if (!storagePath) return
  await addDoc(collection(db, 'storageDeleteQueue'), {
    storagePath,
    queuedAt: serverTimestamp(),
  })
}

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
    (err)  => { console.warn('subscribeMedia:', err); onError?.(err) },
  )
}

// ── write ─────────────────────────────────────────────────────────────────────

/**
 * Add a media item to a queue and increment the relevant counter on the queue doc.
 * role: the uploader's role — determines takenByRole and qcStatus initial value.
 */
export async function addMedia(queueId, { url, storagePath, type, duration, role }) {
  const uid         = auth.currentUser?.uid
  const takenByName = auth.currentUser?.displayName || auth.currentUser?.email || uid
  if (!uid) throw new Error('Not authenticated')

  const isQc = role === 'qc'

  const ref = await addDoc(collection(db, 'queues', queueId, 'media'), {
    url,
    storagePath,
    type,
    duration:    duration ?? null,
    productType: null,
    qcStatus:    isQc ? 'pending' : null,
    takenByRole: role ?? 'staff',
    takenBy:     uid,
    takenByName,
    takenAt:     serverTimestamp(),
  })

  const countField = type === 'video' ? 'videoCount' : 'photoCount'
  const queueUpdate = {
    [countField]: increment(1),
    lastMediaAt:  serverTimestamp(),
    updatedAt:    serverTimestamp(),
  }
  // QC media and video files have no product type — don't flip hasUntagged
  if (!isQc && type !== 'video') queueUpdate.hasUntagged = true

  await updateDoc(doc(db, 'queues', queueId), queueUpdate)

  return ref.id
}

/**
 * Update the product type tag on a single media item.
 */
export async function tagMedia(queueId, mediaId, productType) {
  await updateDoc(doc(db, 'queues', queueId, 'media', mediaId), { productType })
}

/**
 * Update the QC status on a QC media item.
 * status: 'pending' | 'passed' | 'failed'
 */
export async function updateQcStatus(queueId, mediaId, status) {
  await updateDoc(doc(db, 'queues', queueId, 'media', mediaId), { qcStatus: status })
}

/**
 * Delete a media document, decrement the queue's count,
 * and enqueue the Storage file for background deletion by the Cloud Function.
 */
export async function deleteMedia(queueId, mediaId, type, storagePath) {
  await deleteDoc(doc(db, 'queues', queueId, 'media', mediaId))
  const countField = type === 'video' ? 'videoCount' : 'photoCount'
  await updateDoc(doc(db, 'queues', queueId), {
    [countField]: increment(-1),
    updatedAt:    serverTimestamp(),
  })
  // Enqueue Storage deletion — processed by Cloud Function (never from client)
  await enqueueStorageDelete(storagePath)
}

/**
 * Sync the queue's hasUntagged flag based on the current in-memory media list.
 * QC media (takenByRole === 'qc') and video files are excluded — they don't require productType.
 */
export async function syncHasUntagged(queueId, mediaItems) {
  const hasUntagged = mediaItems.some(m => m.takenByRole !== 'qc' && m.type !== 'video' && !m.productType)
  await updateDoc(doc(db, 'queues', queueId), { hasUntagged, updatedAt: serverTimestamp() })
}
