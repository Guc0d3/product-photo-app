import {
  formatTime,
  isToday,
  daysUntilExpiry,
  parseCode,
  getTodayStr,
  getTodayPrefix,
  timeAgo,
  VIDEO_EXPIRY_DAYS,
} from '../src/utils/dateUtils.js'

// ── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  test('formats hour and minute with zero-padding', () => {
    expect(formatTime(new Date(2025, 4, 14, 3, 7, 0))).toBe('03:07')
    expect(formatTime(new Date(2025, 4, 14, 23, 59, 0))).toBe('23:59')
    expect(formatTime(new Date(2025, 4, 14, 0, 0, 0))).toBe('00:00')
  })

  test('returns empty string for falsy input', () => {
    expect(formatTime(null)).toBe('')
    expect(formatTime(undefined)).toBe('')
  })
})

// ── isToday ──────────────────────────────────────────────────────────────────

describe('isToday', () => {
  test('returns true for current moment', () => {
    expect(isToday(new Date())).toBe(true)
  })

  test('returns true for start and end of today', () => {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999)
    expect(isToday(startOfDay)).toBe(true)
    expect(isToday(endOfDay)).toBe(true)
  })

  test('returns false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isToday(yesterday)).toBe(false)
  })

  test('returns false for tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isToday(tomorrow)).toBe(false)
  })

  test('returns false for falsy input', () => {
    expect(isToday(null)).toBe(false)
    expect(isToday(undefined)).toBe(false)
  })
})

// ── daysUntilExpiry ──────────────────────────────────────────────────────────

describe('daysUntilExpiry', () => {
  test('returns VIDEO_EXPIRY_DAYS when taken right now', () => {
    expect(daysUntilExpiry(new Date())).toBe(VIDEO_EXPIRY_DAYS)
  })

  test('returns 1 when one day before expiry', () => {
    const takenAt = new Date(Date.now() - (VIDEO_EXPIRY_DAYS - 1) * 86400000)
    expect(daysUntilExpiry(takenAt)).toBe(1)
  })

  test('returns 0 on the expiry day', () => {
    const takenAt = new Date(Date.now() - VIDEO_EXPIRY_DAYS * 86400000)
    expect(daysUntilExpiry(takenAt)).toBe(0)
  })

  test('returns negative after expiry', () => {
    const takenAt = new Date(Date.now() - (VIDEO_EXPIRY_DAYS + 3) * 86400000)
    expect(daysUntilExpiry(takenAt)).toBe(-3)
  })
})

// ── parseCode ────────────────────────────────────────────────────────────────

describe('parseCode', () => {
  test('parses valid RI code into date and sequence', () => {
    expect(parseCode('RI20250514-3')).toEqual({ date: '14-05-2025', seq: '3' })
    expect(parseCode('RI20251231-10')).toEqual({ date: '31-12-2025', seq: '10' })
    expect(parseCode('RI20250101-1')).toEqual({ date: '01-01-2025', seq: '1' })
  })

  test('returns empty date and original string for invalid format', () => {
    expect(parseCode('INVALID')).toEqual({ date: '', seq: 'INVALID' })
    expect(parseCode('RI2025051-3')).toEqual({ date: '', seq: 'RI2025051-3' })
    expect(parseCode('20250514-3')).toEqual({ date: '', seq: '20250514-3' })
  })

  test('returns empty strings for null or undefined', () => {
    expect(parseCode(null)).toEqual({ date: '', seq: '' })
    expect(parseCode(undefined)).toEqual({ date: '', seq: '' })
  })
})

// ── getTodayStr ──────────────────────────────────────────────────────────────

describe('getTodayStr', () => {
  test('returns 8-digit string in YYYYMMDD format', () => {
    expect(getTodayStr()).toMatch(/^\d{8}$/)
  })

  test('matches current local date', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    expect(getTodayStr()).toBe(expected)
  })
})

// ── getTodayPrefix ───────────────────────────────────────────────────────────

describe('getTodayPrefix', () => {
  test('starts with RI followed by 8 digits', () => {
    expect(getTodayPrefix()).toMatch(/^RI\d{8}$/)
  })

  test('equals RI + getTodayStr', () => {
    expect(getTodayPrefix()).toBe(`RI${getTodayStr()}`)
  })
})

// ── timeAgo ──────────────────────────────────────────────────────────────────

const t = {
  justNow:    'just now',
  minutesAgo: (n) => `${n}m ago`,
  hoursAgo:   (n) => `${n}h ago`,
  yesterday:  'yesterday',
  daysAgo:    (n) => `${n}d ago`,
}

describe('timeAgo', () => {
  test('returns justNow for null input', () => {
    expect(timeAgo(null, t)).toBe('just now')
  })

  test('returns justNow for under 1 minute ago', () => {
    expect(timeAgo(new Date(Date.now() - 30_000), t)).toBe('just now')
  })

  test('returns minutes for 1–59 minutes ago', () => {
    expect(timeAgo(new Date(Date.now() - 60_000), t)).toBe('1m ago')
    expect(timeAgo(new Date(Date.now() - 59 * 60_000), t)).toBe('59m ago')
  })

  test('returns hours for 1–23 hours ago', () => {
    expect(timeAgo(new Date(Date.now() - 60 * 60_000), t)).toBe('1h ago')
    expect(timeAgo(new Date(Date.now() - 23 * 60 * 60_000), t)).toBe('23h ago')
  })

  test('returns yesterday for exactly 24 hours ago', () => {
    expect(timeAgo(new Date(Date.now() - 24 * 60 * 60_000), t)).toBe('yesterday')
  })

  test('returns days for 2+ days ago', () => {
    expect(timeAgo(new Date(Date.now() - 2 * 24 * 60 * 60_000), t)).toBe('2d ago')
    expect(timeAgo(new Date(Date.now() - 7 * 24 * 60 * 60_000), t)).toBe('7d ago')
  })
})
