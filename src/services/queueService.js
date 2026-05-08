import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, orderBy,
  runTransaction, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../firebase/firebase.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function getTodayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/** Convert Firestore Timestamps to plain JS Dates in a queue doc */
function toQueue(snap) {
  const d = snap.data()
  return {
    id: snap.id,
    ...d,
    createdAt:   d.createdAt?.toDate()   ?? null,
    updatedAt:   d.updatedAt?.toDate()   ?? null,
    lastMediaAt: d.lastMediaAt?.toDate() ?? null,
    closedAt:    d.closedAt?.toDate()    ?? null,
  }
}

// ── read ──────────────────────────────────────────────────────────────────────

/**
 * Realtime subscription to all queues, ordered by createdAt desc.
 * Returns unsubscribe function.
 */
export function subscribeQueues(onData, onError) {
  const q = query(collection(db, 'queues'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(toQueue)),
    (err)  => { console.error('subscribeQueues:', err); onError?.(err) },
  )
}

// ── write ─────────────────────────────────────────────────────────────────────

/**
 * Create a new queue with an atomically-generated code (RIYYYYMMDD-XXX).
 * Uses a per-day counter document in the `counters` collection.
 */
export async function createQueue({ queueNumber, supplier, note }) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  const dateStr = getTodayStr()
  const counterRef = doc(db, 'counters', dateStr)

  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    const next = snap.exists() ? snap.data().seq + 1 : 1
    tx.set(counterRef, { seq: next, date: dateStr })
    return next
  })

  const code = `RI${dateStr}-${String(seq).padStart(3, '0')}`

  const ref = await addDoc(collection(db, 'queues'), {
    code,
    queueNumber,
    supplier:    supplier || '',
    note:        note     || '',
    status:      'open',
    photoCount:  0,
    videoCount:  0,
    hasUntagged: false,
    pinned:      false,
    createdBy:   uid,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
    lastMediaAt: null,
    closedAt:    null,
  })

  return ref.id
}

/** Toggle pin state */
export async function togglePin(queueId, pinned) {
  await updateDoc(doc(db, 'queues', queueId), {
    pinned,
    updatedAt: serverTimestamp(),
  })
}

/** Close a queue */
export async function closeQueue(queueId) {
  await updateDoc(doc(db, 'queues', queueId), {
    status:    'closed',
    closedAt:  serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/** Generic field update (for photo counts, hasUntagged, etc.) */
export async function updateQueue(queueId, fields) {
  await updateDoc(doc(db, 'queues', queueId), {
    ...fields,
    updatedAt: serverTimestamp(),
  })
}
