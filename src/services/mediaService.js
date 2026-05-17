import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, increment,
} from 'firebase/firestore'
import { db, auth } from '../firebase/firebase.js'
import { withRetry } from '../utils/withRetry.js'

async function enqueueStorageDelete(storagePath) {
  if (!storagePath) return
  await withRetry(() =>
    addDoc(collection(db, 'storageDeleteQueue'), {
      storagePath,
      queuedAt: serverTimestamp(),
    })
  )
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

export async function addMedia(queueId, { url, storagePath, type, duration, role }) {
  const uid         = auth.currentUser?.uid
  const takenByName = auth.currentUser?.displayName || auth.currentUser?.email || uid
  if (!uid) throw new Error('Not authenticated')

  const isQc = role === 'qc'

  return withRetry(async () => {
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
    if (!isQc && type !== 'video') queueUpdate.hasUntagged = true

    await updateDoc(doc(db, 'queues', queueId), queueUpdate)

    return ref.id
  })
}

export async function tagMedia(queueId, mediaId, productType) {
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId, 'media', mediaId), { productType })
  )
}

export async function updateQcStatus(queueId, mediaId, status) {
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId, 'media', mediaId), { qcStatus: status })
  )
}

export async function deleteMedia(queueId, mediaId, type, storagePath) {
  await withRetry(async () => {
    await deleteDoc(doc(db, 'queues', queueId, 'media', mediaId))
    const countField = type === 'video' ? 'videoCount' : 'photoCount'
    await updateDoc(doc(db, 'queues', queueId), {
      [countField]: increment(-1),
      updatedAt:    serverTimestamp(),
    })
  })
  await enqueueStorageDelete(storagePath)
}

export async function syncHasUntagged(queueId, mediaItems) {
  const hasUntagged = mediaItems.some(
    m => m.takenByRole !== 'qc' && m.type !== 'video' && !m.productType
  )
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId), { hasUntagged, updatedAt: serverTimestamp() })
  )
}
