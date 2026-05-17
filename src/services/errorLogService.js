import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase/firebase.js'

export async function logError(error, context = {}) {
  try {
    await addDoc(collection(db, 'errorLogs'), {
      message:   error?.message || String(error),
      stack:     error?.stack   || null,
      userId:    auth.currentUser?.uid || null,
      url:       window.location.href,
      timestamp: serverTimestamp(),
      ...context,
    })
  } catch {
    console.error('[errorLog failed]', error)
  }
}
