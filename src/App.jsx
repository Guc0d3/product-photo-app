import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import QueueListPage from './pages/QueueListPage.jsx'
import QueueDetailPage from './pages/QueueDetailPage.jsx'
import CameraPage from './pages/CameraPage.jsx'
import { useLang } from './contexts/LangContext.jsx'
import { useAuthContext } from './contexts/AuthContext.jsx'
import { useAuth } from './hooks/useAuth.js'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

function LoadingScreen() {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-white">
      <div className="w-16 h-16 bg-[#06C755]/10 rounded-2xl flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-[#06C755]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
        </svg>
      </div>
    </div>
  )
}

function EmptyDetailPanel() {
  const { t } = useLang()
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F7FA] select-none">
      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-5">
        <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#06C755" strokeWidth="1.2">
          <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <p className="text-gray-500 font-medium">{t.selectQueueHint}</p>
      <p className="text-gray-400 text-sm mt-1">{t.selectQueueSubHint}</p>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuthContext()
  const { handleLogout } = useAuth()
  const [selectedQueue, setSelectedQueue] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [mobileScreen, setMobileScreen] = useState('queueList')
  const isDesktop = useIsDesktop()

  useEffect(() => {
    if (!user) {
      setSelectedQueue(null)
      setMobileScreen('queueList')
    }
  }, [user])

  if (loading) return <LoadingScreen />

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#F5F7FA]">
        <div className="w-full md:max-w-md h-[100dvh] md:h-auto md:rounded-2xl md:shadow-xl overflow-hidden flex flex-col">
          <LoginPage />
        </div>
      </div>
    )
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectQueue = (queue) => {
    setSelectedQueue(queue)
    if (!isDesktop) setMobileScreen('queueDetail')
  }
  const handleOpenCamera = () => {
    if (isDesktop) setShowCamera(true)
    else setMobileScreen('camera')
  }
  const handlePhotoTaken = () => {
    setShowCamera(false)
    if (!isDesktop) setMobileScreen('queueDetail')
  }
  const handleBackFromDetail = () => {
    setSelectedQueue(null)
    if (!isDesktop) setMobileScreen('queueList')
  }
  const handleBackFromCamera = () => {
    setShowCamera(false)
    if (!isDesktop) setMobileScreen('queueDetail')
  }

  // ── Mobile ─────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden relative">
        {mobileScreen === 'queueList' && (
          <QueueListPage user={user} onSelectQueue={handleSelectQueue} onLogout={handleLogout} />
        )}
        {mobileScreen === 'queueDetail' && (
          <QueueDetailPage queue={selectedQueue} user={user} onBack={handleBackFromDetail} onCamera={handleOpenCamera} />
        )}
        {mobileScreen === 'camera' && (
          <CameraPage queue={selectedQueue} onBack={handleBackFromCamera} onPhotoTaken={handlePhotoTaken} />
        )}
      </div>
    )
  }

  // ── Desktop two-panel ──────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#F5F7FA] relative">
      <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-r border-gray-200 overflow-hidden bg-white">
        <QueueListPage user={user} onSelectQueue={handleSelectQueue} onLogout={handleLogout} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedQueue
          ? <QueueDetailPage queue={selectedQueue} user={user} onBack={handleBackFromDetail} onCamera={handleOpenCamera} />
          : <EmptyDetailPanel />
        }
      </div>
      {showCamera && (
        <div className="absolute inset-0 z-50">
          <CameraPage queue={selectedQueue} onBack={handleBackFromCamera} onPhotoTaken={handlePhotoTaken} />
        </div>
      )}
    </div>
  )
}
