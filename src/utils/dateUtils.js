export const VIDEO_EXPIRY_DAYS = 15

export function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function isToday(date) {
  if (!date) return false
  const a = new Date(date); a.setHours(0, 0, 0, 0)
  const b = new Date();     b.setHours(0, 0, 0, 0)
  return a.getTime() === b.getTime()
}

export function daysUntilExpiry(takenAt) {
  if (!takenAt) return null  // server timestamp not yet resolved
  const expiry = new Date(takenAt).getTime() + VIDEO_EXPIRY_DAYS * 86400000
  return Math.ceil((expiry - Date.now()) / 86400000)
}

export function parseCode(code) {
  const m = code?.match(/^RI(\d{4})(\d{2})(\d{2})-(\d+)$/)
  if (!m) return { date: '', seq: code ?? '' }
  return { date: `${m[3]}-${m[2]}-${m[1]}`, seq: m[4] }
}

export function getTodayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export function getTodayPrefix() {
  return `RI${getTodayStr()}`
}

export function timeAgo(date, t) {
  if (!date) return t.justNow
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t.justNow
  if (mins < 60) return t.minutesAgo(mins)
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t.hoursAgo(hours)
  const days = Math.floor(hours / 24)
  if (days === 1) return t.yesterday
  return t.daysAgo(days)
}
