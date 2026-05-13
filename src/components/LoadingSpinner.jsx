export default function LoadingSpinner({ className = 'w-6 h-6', stroke = 'currentColor' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="3" strokeDasharray="30 70"/>
    </svg>
  )
}
