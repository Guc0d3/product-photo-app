const { onSchedule } = require('firebase-functions/v2/scheduler')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')

// วิดีโอจะถูกลบอัตโนมัติหลังจาก 15 วัน
const EXPIRY_DAYS = 15

exports.cleanupExpiredVideos = onSchedule(
  {
    schedule: 'every day 02:00',
    timeZone: 'Asia/Bangkok',
    region: 'asia-southeast1',
  },
  async () => {
    const db     = getFirestore()
    const bucket = getStorage().bucket()

    await Promise.all([
      deleteExpiredVideos(db, bucket),
      processStorageDeleteQueue(db, bucket),
    ])
  }
)

// ── Task 1: ลบวิดีโอที่หมดอายุ ────────────────────────────────────────────────
async function deleteExpiredVideos(db, bucket) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - EXPIRY_DAYS)

  console.log(`[deleteExpiredVideos] cutoff = ${cutoff.toISOString()} (EXPIRY_DAYS=${EXPIRY_DAYS})`)

  const snap = await db
    .collectionGroup('media')
    .where('type', '==', 'video')
    .where('takenAt', '<', cutoff)
    .get()

  if (snap.empty) {
    console.log('[deleteExpiredVideos] No expired videos found.')
    return
  }

  console.log(`[deleteExpiredVideos] Found ${snap.size} expired video(s). Deleting...`)

  const results = await Promise.allSettled(
    snap.docs.map(async (docSnap) => {
      const { storagePath } = docSnap.data()
      const queueRef = docSnap.ref.parent.parent  // queues/{queueId}

      if (storagePath) {
        await bucket.file(storagePath).delete().catch((err) => {
          console.warn(`[deleteExpiredVideos] Storage delete failed for ${storagePath}:`, err.message)
        })
      }

      await docSnap.ref.delete()

      if (queueRef) {
        await queueRef.update({ videoCount: FieldValue.increment(-1) }).catch(() => {})
      }

      console.log(`[deleteExpiredVideos] Deleted video ${docSnap.id}`)
    })
  )

  const failed = results.filter(r => r.status === 'rejected')
  console.log(`[deleteExpiredVideos] Done. Deleted ${snap.size - failed.length}/${snap.size} videos.`)
}

// ── Task 2: ลบไฟล์ที่ client enqueue ไว้ ──────────────────────────────────────
async function processStorageDeleteQueue(db, bucket) {
  const snap = await db.collection('storageDeleteQueue').get()

  if (snap.empty) {
    console.log('[storageDeleteQueue] Queue is empty.')
    return
  }

  console.log(`[storageDeleteQueue] Processing ${snap.size} item(s)...`)

  const results = await Promise.allSettled(
    snap.docs.map(async (docSnap) => {
      const { storagePath } = docSnap.data()

      if (storagePath) {
        await bucket.file(storagePath).delete().catch((err) => {
          // File may already be gone — not an error worth failing over
          console.warn(`[storageDeleteQueue] Storage delete failed for ${storagePath}:`, err.message)
        })
      }

      // Always remove from queue regardless of Storage outcome
      await docSnap.ref.delete()

      console.log(`[storageDeleteQueue] Processed: ${storagePath}`)
    })
  )

  const failed = results.filter(r => r.status === 'rejected')
  console.log(`[storageDeleteQueue] Done. Processed ${snap.size - failed.length}/${snap.size} items.`)
}
