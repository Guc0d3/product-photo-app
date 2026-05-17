import { Component } from 'react'
import { logError } from '../services/errorLogService.js'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    logError(error, { type: 'react-error', componentStack: info.componentStack })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#F5F7FA] px-8">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <p className="text-gray-800 font-semibold text-center mb-1">เกิดข้อผิดพลาด</p>
        <p className="text-gray-500 text-sm text-center mb-6">กรุณาโหลดหน้าใหม่เพื่อดำเนินการต่อ</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#06C755] text-white px-6 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          โหลดใหม่
        </button>
      </div>
    )
  }
}
