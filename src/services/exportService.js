import { collectionGroup, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/firebase.js'

/**
 * Fetch all media documents for a given month using collectionGroup query.
 * yearMonth: "2025-05"
 */
export async function fetchMediaByMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 1)

  const q = query(
    collectionGroup(db, 'media'),
    where('takenAt', '>=', Timestamp.fromDate(start)),
    where('takenAt', '<',  Timestamp.fromDate(end)),
    orderBy('takenAt', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    takenAt: d.data().takenAt?.toDate() ?? null,
  }))
}

async function fetchWithRetry(url, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, delayMs * attempt))
    }
  }
}

/**
 * Sanitize a string for use as a file/folder name.
 * Removes characters not allowed by Windows/macOS/Linux filesystems.
 */
function sanitizeName(name) {
  return name
    .replace(/[/\\:*?"<>|]/g, '_')  // replace forbidden chars with _
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .trim()                          // strip leading/trailing spaces
    .replace(/^\.+/, '_')           // names cannot start with a dot
    .slice(0, 100)                  // cap length for safety
    || '_unnamed'                   // fallback if empty after sanitize
}

/**
 * Export media items to a local folder using the File System Access API.
 * Folder structure: [productType or _untagged] / [YYYY-MM-DD] / [filename]
 * onProgress(done, total) called after each file.
 */
export async function exportMediaToFolder(items, dirHandle, onProgress) {
  for (let i = 0; i < items.length; i++) {
    const item        = items[i]
    const folderName  = sanitizeName(item.productType || '_untagged')
    const dateStr     = item.takenAt ? item.takenAt.toISOString().slice(0, 10) : '_unknown'
    const filename    = sanitizeName(item.storagePath?.split('/').pop() || `${Date.now()}.jpg`)

    // Create nested directories
    const typeDir = await dirHandle.getDirectoryHandle(folderName, { create: true })
    const dateDir = await typeDir.getDirectoryHandle(dateStr,     { create: true })

    // Download and write file (retry up to 3 times on transient network errors)
    const response = await fetchWithRetry(item.url)
    const blob     = await response.blob()
    const fh       = await dateDir.getFileHandle(filename, { create: true })
    const writable = await fh.createWritable()
    await writable.write(blob)
    await writable.close()

    onProgress?.(i + 1, items.length)
  }
}
