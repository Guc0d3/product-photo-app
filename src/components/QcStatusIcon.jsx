export const QC_STATUS_BG = { passed: 'bg-green-500', failed: 'bg-red-500', pending: 'bg-gray-400' }

export default function QcStatusIcon({ status, size = 18 }) {
  const s = size
  const inner = Math.round(s * 0.55)
  if (status === 'passed') return (
    <div className="rounded-full bg-green-500 flex items-center justify-center flex-shrink-0" style={{ width: s, height: s }}>
      <svg width={inner} height={inner} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
    </div>
  )
  if (status === 'failed') return (
    <div className="rounded-full bg-red-500 flex items-center justify-center flex-shrink-0" style={{ width: s, height: s }}>
      <svg width={inner} height={inner} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
        <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
  )
  return (
    <div className="rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0" style={{ width: s, height: s }}>
      <svg width={inner} height={inner} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
        <path strokeLinecap="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
  )
}
