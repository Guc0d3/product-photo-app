import { useState, useEffect, lazy, Suspense } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import QueueListPage from './pages/QueueListPage.jsx'
import QueueDetailPage from './pages/QueueDetailPage.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { useLang } from './contexts/LangContext.jsx'
import { useAuthContext } from './contexts/AuthContext.jsx'
import { useAuth } from './hooks/useAuth.js'

const CameraPage     = lazy(() => import('./pages/CameraPage.jsx'))
const AdminExportPage = lazy(() => import('./pages/AdminExportPage.jsx'))
const UserManagePage  = lazy(() => import('./pages/UserManagePage.jsx'))

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

const VALID_ROLES = ['staff', 'admin', 'qc', 'audit']

function AccessDeniedScreen({ onLogout }) {
  const { t } = useLang()
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-[#F5F7FA] px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t.accessDeniedTitle}</h2>
        <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line mb-7">
          {t.accessDeniedMessage}
        </p>
        <button
          onClick={onLogout}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-2xl text-sm transition-colors active:scale-95"
        >
          {t.accessDeniedLogout}
        </button>
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
  const [showExport, setShowExport] = useState(false)
  const [showUserManage, setShowUserManage] = useState(false)
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

  // ── Logged in but no valid role ────────────────────────────────────────────
  if (!VALID_ROLES.includes(user.role)) {
    return <AccessDeniedScreen onLogout={handleLogout} />
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
  const handleOpenExport = () => {
    if (isDesktop) setShowExport(true)
    else setMobileScreen('export')
  }
  const handleBackFromExport = () => {
    setShowExport(false)
    if (!isDesktop) setMobileScreen('queueList')
  }
  const handleOpenUserManage = () => {
    if (isDesktop) setShowUserManage(true)
    else setMobileScreen('userManage')
  }
  const handleBackFromUserManage = () => {
    setShowUserManage(false)
    if (!isDesktop) setMobileScreen('queueList')
  }

  const fallback = (
    <div className="flex-1 flex items-center justify-center bg-[#F5F7FA]">
      <LoadingSpinner className="w-7 h-7 text-[#06C755]" />
    </div>
  )

  // ── Mobile ─────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden relative">
        {mobileScreen === 'queueList' && (
          <QueueListPage user={user} onSelectQueue={handleSelectQueue} onLogout={handleLogout} onExport={handleOpenExport} onUserManage={handleOpenUserManage} />
        )}
        {mobileScreen === 'queueDetail' && (
          <QueueDetailPage queue={selectedQueue} user={user} onBack={handleBackFromDetail} onCamera={handleOpenCamera} />
        )}
        {mobileScreen === 'camera' && (
          <ErrorBoundary>
            <Suspense fallback={fallback}>
              <CameraPage queue={selectedQueue} user={user} onBack={handleBackFromCamera} onPhotoTaken={handlePhotoTaken} />
            </Suspense>
          </ErrorBoundary>
        )}
        {mobileScreen === 'export' && (
          <ErrorBoundary>
            <Suspense fallback={fallback}>
              <AdminExportPage onBack={handleBackFromExport} />
            </Suspense>
          </ErrorBoundary>
        )}
        {mobileScreen === 'userManage' && (
          <ErrorBoundary>
            <Suspense fallback={fallback}>
              <UserManagePage user={user} onBack={handleBackFromUserManage} />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
    )
  }

  // ── Desktop two-panel ──────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#F5F7FA] relative">
      <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-r border-gray-200 overflow-hidden bg-white">
        <QueueListPage user={user} onSelectQueue={handleSelectQueue} onLogout={handleLogout} onExport={handleOpenExport} onUserManage={handleOpenUserManage} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedQueue
          ? <QueueDetailPage queue={selectedQueue} user={user} onBack={handleBackFromDetail} onCamera={handleOpenCamera} />
          : <EmptyDetailPanel />
        }
      </div>
      {showCamera && (
        <div className="absolute inset-0 z-50 flex flex-col">
          <ErrorBoundary>
            <Suspense fallback={fallback}>
              <CameraPage queue={selectedQueue} user={user} onBack={handleBackFromCamera} onPhotoTaken={handlePhotoTaken} />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
      {showExport && (
        <div className="absolute inset-0 z-50">
          <ErrorBoundary>
            <Suspense fallback={fallback}>
              <AdminExportPage onBack={handleBackFromExport} />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
      {showUserManage && (
        <div className="absolute inset-0 z-50 flex flex-col">
          <ErrorBoundary>
            <Suspense fallback={fallback}>
              <UserManagePage user={user} onBack={handleBackFromUserManage} />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </div>
  )
}
