import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, orderBy, where, limit,
  runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db, auth } from '../firebase/firebase.js'
import { getTodayStr } from '../utils/dateUtils.js'
import { withRetry } from '../utils/withRetry.js'

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

export function subscribeQueue(queueId, onData, onError) {
  return onSnapshot(
    doc(db, 'queues', queueId),
    (snap) => { if (snap.exists()) onData(toQueue(snap)) },
    (err)  => { console.warn('subscribeQueue:', err); onError?.(err) },
  )
}

export function subscribeQueues(onData, onError, startDate = null, maxResults = 300) {
  const constraints = [orderBy('createdAt', 'desc')]
  if (startDate) constraints.push(where('createdAt', '>=', Timestamp.fromDate(startDate)))
  constraints.push(limit(maxResults))
  const q = query(collection(db, 'queues'), ...constraints)
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(toQueue)),
    (err)  => { console.warn('subscribeQueues:', err); onError?.(err) },
  )
}

// ── write ─────────────────────────────────────────────────────────────────────

export async function createQueue({ queueNumber, supplier, note }) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  const dateStr = getTodayStr()
  const counterRef = doc(db, 'counters', dateStr)

  return withRetry(async () => {
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
  })
}

export async function togglePin(queueId, pinned) {
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId), { pinned, updatedAt: serverTimestamp() })
  )
}

export async function firstApproveQueue(queueId, user) {
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId), {
      status: 'pending_close',
      firstApproval: {
        uid:         user.uid,
        displayName: user.displayName || user.email || 'ไม่ระบุ',
        role:        user.role,
        approvedAt:  serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    })
  )
}

export async function closeQueue(queueId, user) {
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId), {
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
  )
}

export async function reopenQueue(queueId) {
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId), {
      status:        'open',
      closedAt:      null,
      firstApproval: null,
      closedBy:      null,
      updatedAt:     serverTimestamp(),
    })
  )
}

export async function cancelQueue(queueId) {
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId), {
      status:      'cancelled',
      cancelledAt: serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
  )
}

export async function updateQueue(queueId, fields) {
  await withRetry(() =>
    updateDoc(doc(db, 'queues', queueId), { ...fields, updatedAt: serverTimestamp() })
  )
}
