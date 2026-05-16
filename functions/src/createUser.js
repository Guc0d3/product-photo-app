const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const VALID_ROLES = ['staff', 'qc', 'audit', 'admin']

exports.createUser = onCall({ region: 'asia-southeast1' }, async (request) => {
  // 1. Must be authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.')
  }

  const callerUid = request.auth.uid
  const db = getFirestore()

  // 2. Caller must be admin
  const callerSnap = await db.collection('users').doc(callerUid).get()
  if (!callerSnap.exists || callerSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can create users.')
  }

  // 3. Validate input
  const { email, displayName, role } = request.data ?? {}

  if (!email || typeof email !== 'string' || !email.trim()) {
    throw new HttpsError('invalid-argument', 'email is required.')
  }
  if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
    throw new HttpsError('invalid-argument', 'displayName is required.')
  }
  if (!role || !VALID_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', `role must be one of: ${VALID_ROLES.join(', ')}.`)
  }

  // 4. Create Firebase Auth user (no password — user sets via password-reset email)
  let userRecord
  try {
    userRecord = await getAuth().createUser({
      email: email.trim(),
      displayName: displayName.trim(),
    })
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'This email is already in use.')
    }
    throw new HttpsError('internal', err.message)
  }

  // 5. Create Firestore user document
  await db.collection('users').doc(userRecord.uid).set({
    email: email.trim(),
    displayName: displayName.trim(),
    role,
    createdAt: FieldValue.serverTimestamp(),
  })

  return { uid: userRecord.uid }
})
