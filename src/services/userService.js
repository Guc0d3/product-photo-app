import {
  collection, doc, getDocs, updateDoc,
  query, orderBy,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { sendPasswordResetEmail } from 'firebase/auth'
import { db, auth, functions } from '../firebase/firebase.js'

/** Convert a Firestore snapshot to a plain user object */
function toUser(snap) {
  const d = snap.data()
  return {
    uid:         snap.id,
    email:       d.email        ?? '',
    displayName: d.displayName  ?? '',
    role:        d.role         ?? 'staff',
    createdAt:   d.createdAt?.toDate() ?? null,
  }
}

// ── read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch all user profiles (admin only — Firestore rules enforce this).
 * Returns array of { uid, email, displayName, role, createdAt: Date }
 */
export async function fetchAllUsers() {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(toUser)
}

// ── write ─────────────────────────────────────────────────────────────────────

/**
 * Update a user's role.
 * @param {string} uid  - target user's uid
 * @param {string} role - new role: 'staff' | 'qc' | 'audit' | 'admin'
 */
export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role })
}

/**
 * Create a new user account via Cloud Function, then send a password-reset
 * (invite) email so the user can set their own password.
 * @param {{ email: string, displayName: string, role: string }} param0
 * @returns {Promise<{ uid: string }>}
 */
export async function createUserAccount({ email, displayName, role }) {
  const callable = httpsCallable(functions, 'createUser')
  const result = await callable({ email, displayName, role })
  await sendPasswordResetEmail(auth, email)
  return result.data
}

/**
 * Send a password reset email to the given address.
 * Works for any existing Firebase Auth account.
 */
export async function resetUserPassword(email) {
  await sendPasswordResetEmail(auth, email)
}
