import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, orderBy,
  runTransaction, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../firebase/firebase.js'
import { getTodayStr } from '../utils/dateUtils.js'

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
    firstApproval: d.firstApproval ? {
      ...d.firstApproval,
      approvedAt: d.firstApproval.approvedAt?.toDate() ?? null,
    } : null,
    closedBy: d.closedBy ? {
      ...d.closedBy,
      closedAt: d.closedBy.closedAt?.toDate() ?? null,
    } : null,
  }
}

// ── read ──────────────────────────────────────────────────────────────────────

/**
 * Realtime subscription to a single queue document.
 * Returns unsubscribe function.
 */
export function subscribeQueue(queueId, onData, onError) {
  return onSnapshot(
    doc(db, 'queues', queueId),
    (snap) => { if (snap.exists()) onData(toQueue(snap)) },
    (err)  => { console.error('subscribeQueue:', err); onError?.(err) },
  )
}

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

/**
 * First approval: open → pending_close.
 * Requires a second person to call closeQueue to fully close.
 */
export async function firstApproveQueue(queueId, user) {
  await updateDoc(doc(db, 'queues', queueId), {
    status: 'pending_close',
    firstApproval: {
      uid:         user.uid,
      displayName: user.displayName || user.email || 'ไม่ระบุ',
      role:        user.role,
      approvedAt:  serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  })
}

/**
 * Second approval: pending_close → closed.
 * Must be called by a different person than firstApproveQueue.
 */
export async function closeQueue(queueId, user) {
  await updateDoc(doc(db, 'queues', queueId), {
    status: 'closed',
    closedBy: {
      uid:         user.uid,
      displayName: user.displayName || user.email || 'ไม่ระบุ',
      role:        user.role,
      closedAt:    serverTimestamp(),
    },
    closedAt:  serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/** Reopen a closed queue back to open — clears approval records */
export async function reopenQueue(queueId) {
  await updateDoc(doc(db, 'queues', queueId), {
    status:        'open',
    closedAt:      null,
    firstApproval: null,
    closedBy:      null,
    updatedAt:     serverTimestamp(),
  })
}

/** Cancel a queue — read-only after this, no further edits allowed */
export async function cancelQueue(queueId) {
  await updateDoc(doc(db, 'queues', queueId), {
    status:      'cancelled',
    cancelledAt: serverTimestamp(),
    updatedAt:   serverTimestamp(),
  })
}

/** Generic field update (for photo counts, hasUntagged, etc.) */
export async function updateQueue(queueId, fields) {
  await updateDoc(doc(db, 'queues', queueId), {
    ...fields,
    updatedAt: serverTimestamp(),
  })
}
