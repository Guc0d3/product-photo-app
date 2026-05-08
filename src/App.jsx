import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import QueueListPage from './pages/QueueListPage.jsx'
import QueueDetailPage from './pages/QueueDetailPage.jsx'
import CameraPage from './pages/CameraPage.jsx'
import { useLang } from './contexts/LangContext.jsx'

const MOCK_USER = { uid: 'user1', email: 'staff@company.com', displayName: 'สมชาย ใจดี', role: 'staff' }

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

function EmptyDetailPanel() {
  const { t } = useLang()
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F0F0] select-none">
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
  const [screen, setScreen] = useState('login')
  const [user, setUser] = useState(null)
  const [selectedQueue, setSelectedQueue] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const isDesktop = useIsDesktop()

  const handleLogin = () => { setUser(MOCK_USER); setScreen('queueList') }
  const handleSelectQueue = (queue) => { setSelectedQueue(queue); if (!isDesktop) setScreen('queueDetail') }
  const handleOpenCamera = () => { if (isDesktop) setShowCamera(true); else setScreen('camera') }
  const handlePhotoTaken = () => { setShowCamera(false); if (!isDesktop) setScreen('queueDetail') }
  const handleBackFromDetail = () => { setSelectedQueue(null); if (!isDesktop) setScreen('queueList') }
  const handleBackFromCamera = () => { setShowCamera(false); if (!isDesktop) setScreen('queueDetail') }

  if (screen === 'login') {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F0F0F0]">
        <div className="w-full md:max-w-md h-screen md:h-auto md:rounded-2xl md:shadow-xl overflow-hidden flex flex-col">
          <LoginPage onLogin={handleLogin} />
        </div>
      </div>
    )
  }

  if (!isDesktop) {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative">
        {screen === 'queueList' && <QueueListPage user={user} onSelectQueue={handleSelectQueue} />}
        {screen === 'queueDetail' && (
          <QueueDetailPage queue={selectedQueue} user={user} onBack={handleBackFromDetail} onCamera={handleOpenCamera} />
        )}
        {screen === 'camera' && (
          <CameraPage queue={selectedQueue} onBack={handleBackFromCamera} onPhotoTaken={handlePhotoTaken} />
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#F0F0F0] relative">
      <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-r border-gray-200 overflow-hidden shadow-sm">
        <QueueListPage user={user} onSelectQueue={handleSelectQueue} />
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
