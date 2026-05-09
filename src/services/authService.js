import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase.js'

/** Sign in with email + password */
export async function signIn(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

/** Sign out current user */
export async function logOut() {
  await signOut(auth)
}

/**
 * Subscribe to auth state changes.
 * On login → load (or create) user profile from Firestore.
 * Returns unsubscribe function.
 */
export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }

    const userRef = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(userRef)

    if (snap.exists()) {
      callback({ uid: firebaseUser.uid, email: firebaseUser.email, ...snap.data() })
    } else {
      // First login — auto-create staff profile
      const profile = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        role: 'staff',
        createdAt: serverTimestamp(),
      }
      await setDoc(userRef, profile)
      callback({ uid: firebaseUser.uid, ...profile })
    }
  })
}

/** Fetch user profile once (no subscription) */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { uid, ...snap.data() } : null
}

/**
 * Update display name — อัปเดตทั้ง Firebase Auth และ Firestore users doc
 */
export async function updateDisplayName(displayName) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  await updateProfile(user, { displayName })
  await updateDoc(doc(db, 'users', user.uid), { displayName })
}
