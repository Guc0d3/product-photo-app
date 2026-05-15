import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function toProduct(snap) {
  const d = snap.data()
  return {
    id: snap.id,
    name: d.name ?? '',
    order: d.order ?? 0,
    active: d.active ?? true,
    createdAt: d.createdAt?.toDate() ?? null,
  }
}

// ── read ──────────────────────────────────────────────────────────────────────

/**
 * Realtime subscription to all active products, ordered by `order` asc.
 * Returns unsubscribe function.
 */
export function subscribeProducts(onData, onError) {
  const q = query(collection(db, 'products'), orderBy('order', 'asc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(toProduct).filter((p) => p.active)),
    (err) => {
      console.warn('subscribeProducts:', err)
      onError?.(err)
    },
  )
}

// ── write (admin only — enforced by Firestore rules) ──────────────────────────

export async function addProduct(name) {
  return addDoc(collection(db, 'products'), {
    name,
    order: Date.now(), // simple monotonic ordering
    active: true,
    createdAt: serverTimestamp(),
  })
}

export async function updateProduct(productId, fields) {
  await updateDoc(doc(db, 'products', productId), fields)
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, 'products', productId))
}

// ── seed (run once from admin to populate initial product types) ──────────────

const DEFAULT_PRODUCTS = [
  'ทองแดง',
  'ทองเหลือง',
  'อลูมิเนียม',
  'สแตนเลส',
  'สังกะสี (ซิ้ง, ซีโห้) และ ตะกั่ว',
  'หม้อน้ำ',
  'แบตเตอรี่',
  'อื่นๆ',
]

/**
 * Seed the `products` collection with default product types.
 * Uses a batch write — safe to call only once (no duplicate-check).
 */
export async function seedProducts() {
  const batch = writeBatch(db)
  DEFAULT_PRODUCTS.forEach((name, i) => {
    const ref = doc(collection(db, 'products'))
    batch.set(ref, {
      name,
      order: i,
      active: true,
      createdAt: serverTimestamp(),
    })
  })
  await batch.commit()
}
